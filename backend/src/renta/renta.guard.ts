import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RentaService } from './renta.service';

@Injectable()
export class RentaGuard implements CanActivate {
  private readonly logger = new Logger(RentaGuard.name);

  // Lista blanca de correos y dominios con inmunidad (CPO y Soporte)
  private readonly WHITELIST_EMAILS = [
    'natalie.torres@vesta-track.cloud',
    'ricardo.almaraz@vesta-track.cloud',
    'sergio.elizondo@vesta-track.cloud',
    'ing.ballesteros16@gmail.com'
  ];

  private readonly WHITELIST_DOMAINS = [
    'vesta-track.cloud',
    'cajapopularoblatos.com.mx'
  ];

  constructor(private rentaService: RentaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) return true;

    const email = user.email.toLowerCase();
    const domain = email.split('@')[1];

    // 1. INMUNIDAD TOTAL: Superadmins, Soporte y CPO Staff
    if (user.rol === 'superadmin' || 
        this.WHITELIST_EMAILS.includes(email) || 
        this.WHITELIST_DOMAINS.includes(domain) ||
        email.includes('oblatos')) {
      return true;
    }

    // 2. Consultar el estado de renta del cliente
    // Intentamos buscar por email exacto o por dominio
    try {
      const rentas = await this.rentaService.findAll();
      
      // Buscamos si hay una renta bloqueada para este usuario o su empresa
      const rentaBloqueada = rentas.find(r => 
        (r.cliente_email.toLowerCase() === email || r.cliente_email.toLowerCase() === domain) && 
        r.status === 'bloqueado'
      );

      if (rentaBloqueada) {
        this.logger.warn(`Acceso bloqueado por falta de pago para: ${email}`);
        throw new ForbiddenException({
          message: 'Servicio Suspendido',
          detail: 'Tu suscripción mensual ha vencido o ha sido bloqueada por el administrador. Favor de contactar a soporte.',
          error: 'PAYMENT_REQUIRED'
        });
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(`Error verificando renta para ${email}: ${error.message}`);
      // En caso de error de base de datos, permitimos acceso para no afectar la operación
      return true;
    }

    return true;
  }
}
