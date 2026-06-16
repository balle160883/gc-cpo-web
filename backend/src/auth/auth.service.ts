import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const { data: users, error } = await this.supabaseService
      .getClient()
      .from('usuarios_gestor')
      .select('*')
      .eq('email', email);

    if (error || !users || users.length === 0) {
      return null;
    }

    const user = users[0];
    
    let isMatch = false;
    // Si el hash parece un hash de bcrypt, intentamos comprar con bcrypt
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(pass, user.password_hash);
      } catch (e) {
        isMatch = pass === user.password_hash;
      }
    } else {
      // Si no parece bcrypt, comparamos directamente (texto plano para migración)
      isMatch = pass === user.password_hash;
    }
    
    if (isMatch) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      gestorId: user.gestor,
      rol: user.rol 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        gestor: user.gestor,
        rol: user.rol
      }
    };
  }
}
