import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as XLSX from 'xlsx';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getSocios(limit = 50, gestorId?: string) {
    let query = this.supabaseService
      .getClient()
      .from('socios_datos')
      .select('*')
      .limit(limit);

    if (gestorId) {
      const { data: asignaciones } = await this.supabaseService
        .getClient()
        .from('asignacion_gestores')
        .select('NoSOCIO')
        .eq('GESTOR ASIGNADO', gestorId)
        .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');
      
      const sociosIds = asignaciones?.map(a => a.NoSOCIO) || [];
      query = query.in('numero_socio', sociosIds);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`Error fetching socios: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getPrestamosPorSocio(socioId: number, gestorId?: string) {
    // Si hay gestorId, validar que el socio le pertenezca
    if (gestorId) {
       const { count } = await this.supabaseService
         .getClient()
         .from('asignacion_gestores')
         .select('*', { count: 'exact', head: true })
         .eq('NoSOCIO', socioId)
         .eq('GESTOR ASIGNADO', gestorId);
       
       if (count === 0) return [];
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('prestamos_datos')
      .select('*')
      .eq('socio_id', socioId);

    if (error) {
      this.logger.error(`Error fetching prestamos: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getCarteraVencida(gestorId?: string) {
    let query = this.supabaseService
      .getClient()
      .from('prestamos_datos')
      .select('*, socios_datos(nombre_completo)')
      .gt('saldo_mora', 0)
      .limit(100); // Límite para evitar consumo excesivo

    if (gestorId) {
       const { data: asignaciones } = await this.supabaseService
         .getClient()
         .from('asignacion_gestores')
         .select('NoCUENTA')
         .eq('GESTOR ASIGNADO', gestorId);
       
       const cuentasIds = asignaciones?.map(a => a.NoCUENTA) || [];
       query = query.in('num_cuenta', cuentasIds);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching cartera vencida: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getAsignaciones(limit = 100, gestorId?: string) {
    let query = this.supabaseService
      .getClient()
      .from('asignacion_gestores')
      .select('*')
      .limit(limit);

    if (gestorId) {
      query = query.eq('GESTOR ASIGNADO', gestorId)
                   .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');
    }

    query = query.order('FECHA ASIGNACION', { ascending: false });

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching asignaciones: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getRecuperacion(gestorId?: string, startDate?: string, endDate?: string) {
    const recoveryDocs: any[] = [];

    try {
      // 1. Obtener de pagos_recuperados
      let queryPagos = this.supabaseService
        .getClient()
        .from('pagos_recuperados')
        .select('*');

      if (startDate) queryPagos = queryPagos.gte('fecha_real', startDate);
      if (endDate) queryPagos = queryPagos.lte('fecha_real', endDate);

      const { data: pagosLog, error: errorPagos } = await queryPagos
        .order('created_at', { ascending: false })
        .limit(200);

      if (errorPagos) {
        this.logger.error(`Error fetching pagos_recuperados: ${errorPagos.message}`);
      } else if (pagosLog && pagosLog.length > 0) {
        const cuentas = [...new Set(pagosLog.map(p => p.num_credito))];
        const { data: gestoresMap } = await this.supabaseService
          .getClient()
          .from('asignacion_gestores')
          .select('NoCUENTA, "GESTOR ASIGNADO"')
          .in('NoCUENTA', cuentas);
          
        const gestorByCuenta = new Map(gestoresMap?.map(g => [g.NoCUENTA, g['GESTOR ASIGNADO']]) || []);
        
        pagosLog.forEach(item => {
          const gestorResponsable = gestorByCuenta.get(item.num_credito) || 'Sistema';
          if (!gestorId || gestorResponsable === gestorId) {
            recoveryDocs.push({
              id: item.id,
              abono_total: item.abono_total,
              nombre: item.nombre,
              numero_socio: item.numero_socio,
              num_credito: item.num_credito,
              fecha_real: item.fecha_real || item.created_at || item.fecha,
              gestor: gestorResponsable,
              tipo: 'PAGO_REAL'
            });
          }
        });
      }

      // 2. Obtener de asignacion_gestores
      let queryActivos = this.supabaseService
        .getClient()
        .from('asignacion_gestores')
        .select('"GESTOR ASIGNADO", "CAPITAL MOROSO", NoSOCIO, NOMBRE, NoCUENTA, "FECHA ASIGNACION", "SITUACIÓN DEL CRÉDITO"');

      if (gestorId) queryActivos = queryActivos.eq('GESTOR ASIGNADO', gestorId);
      if (startDate) queryActivos = queryActivos.gte('FECHA ASIGNACION', startDate);
      if (endDate) queryActivos = queryActivos.lte('FECHA ASIGNACION', endDate);

      const { data: activos, error: errorActivos } = await queryActivos.limit(100);
      if (errorActivos) {
        this.logger.error(`Error fetching asignacion_gestores for recovery: ${errorActivos.message}`);
      } else if (activos) {
        activos.forEach(item => {
          if (item['CAPITAL MOROSO'] > 0 || item['SITUACIÓN DEL CRÉDITO'] === 'LIQUIDADO') {
            recoveryDocs.push({
              abono_total: item['CAPITAL MOROSO'],
              nombre: item.NOMBRE,
              numero_socio: item.NoSOCIO,
              num_credito: item.NoCUENTA,
              fecha_real: item['FECHA ASIGNACION'],
              gestor: item['GESTOR ASIGNADO'],
              tipo: 'CARTERA_ACTIVA'
            });
          }
        });
      }

      // 3. Obtener de recuperaciones_archivadas
      let histQuery = this.supabaseService
        .getClient()
        .from('recuperaciones_archivadas')
        .select('gestor_asignado, capital_moroso, nosocio, nombre, nocuenta, fecha_asignacion');
      
      if (gestorId) histQuery = histQuery.eq('gestor_asignado', gestorId);
      if (startDate) histQuery = histQuery.gte('fecha_asignacion', startDate);
      if (endDate) histQuery = histQuery.lte('fecha_asignacion', endDate);

      const { data: historicos, error: errorHistoricos } = await histQuery
        .order('fecha_asignacion', { ascending: false })
        .limit(100);

      if (errorHistoricos) {
        this.logger.error(`Error fetching recuperaciones_archivadas: ${errorHistoricos.message}`);
      } else if (historicos) {
        historicos.forEach(item => {
          recoveryDocs.push({
            abono_total: item.capital_moroso,
            nombre: item.nombre,
            numero_socio: item.nosocio,
            num_credito: item.nocuenta,
            fecha_real: item.fecha_asignacion,
            gestor: item.gestor_asignado,
            tipo: 'ARCHIVO'
          });
        });
      }

      recoveryDocs.sort((a, b) => {
        const dateA = new Date(a.fecha_real || 0).getTime();
        const dateB = new Date(b.fecha_real || 0).getTime();
        return dateB - dateA;
      });

    } catch (err) {
      this.logger.error(`Fatal error in getRecuperacion: ${err.message}`);
    }

    return recoveryDocs;
  }

  async getAllGestoresLocations() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('ubicaciones_gestores')
      .select('*, usuarios_gestor(gestor)')
      .order('timestamp', { ascending: false })
      .limit(200); // Límite razonable para encontrar la última ubicación de cada gestor sin bajar miles

    if (error) {
      this.logger.error(`Error fetching gestores locations: ${error.message}`);
      throw error;
    }

    // Filtrar para obtener solo la última ubicación de cada gestor
    const uniqueLocations = new Map();
    data?.forEach(loc => {
      if (!uniqueLocations.has(loc.gestor_id)) {
        uniqueLocations.set(loc.gestor_id, {
          ...loc,
          gestor_name: loc.usuarios_gestor?.gestor || 'Gestor'
        });
      }
    });

    return Array.from(uniqueLocations.values());
  }

  async getAllGestores() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios_gestor')
      .select('id, gestor')
      .order('gestor', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching all gestores: ${error.message}`);
      throw error;
    }

    return data.map(g => ({
      gestor_id: g.id,
      gestor_name: g.gestor
    }));
  }

  async updateAsignacion(noCuenta: string, data: any) {
    const { data: result, error } = await this.supabaseService
      .getClient()
      .from('asignacion_gestores')
      .update(data)
      .eq('NoCUENTA', noCuenta)
      .select();

    if (error) {
      this.logger.error(`Error updating asignacion ${noCuenta}: ${error.message}`);
      throw error;
    }
    return result;
  }

  async importAvales(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    if (data.length === 0) return { success: false, message: 'El archivo está vacío' };

    // 1. Obtener gestores de BD para mapeo
    const { data: dbGestoresData } = await this.supabaseService.getClient().from('usuarios_gestor').select('gestor');
    
    const clean = (str: string): string => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
    };

    const cols = Object.keys(data[0]);
    const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'))!;
    const cuentaCol = cols.find(c => c.toUpperCase() === "NOCUENTA") || "NoCUENTA";
    const avalCol = cols.find(c => c.toUpperCase() === "NOMBRE AVAL") || "NOMBRE AVAL";
    const domicilioCol = cols.find(c => c.toUpperCase() === "DOMICILIO") || "DOMICILIO";

    this.logger.log('Limpiando tabla asignacion_avales para re-importación...');
    await this.supabaseService.getClient().from('asignacion_avales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const assignments: any[] = [];
    const unmatchedGestores = new Set<string>();

    for (const row of data) {
      const excelName = String(row[gestorCol] || '').trim();
      const cleanExcel = clean(excelName);
      
      const match = dbGestoresData?.find(dbg => {
          const cleanDb = clean(dbg.gestor);
          const excelWords = cleanExcel.split(/\s+/).filter(w => w.length > 2);
          const dbWords = cleanDb.split(/\s+/).filter(w => w.length > 2);
          const allExcelInDb = excelWords.every(w => dbWords.includes(w));
          const allDbInExcel = dbWords.every(w => excelWords.includes(w));
          return allExcelInDb || allDbInExcel;
      });

      if (match) {
          assignments.push({
              num_cuenta: String(row[cuentaCol] || ''),
              nombre_aval: String(row[avalCol] || ''),
              domicilio_aval: String(row[domicilioCol] || ''),
              colonia_aval: String(row['COLONIA'] || ''),
              municipio_aval: String(row['MUNICIPIO'] || ''),
              cp_aval: String(row['CP'] || ''),
              cruces_aval: String(row['CRUCES'] || ''),
              estado_aval: String(row['ESTADO'] || 'JALISCO'),
              gestor_asignado: match.gestor,
              tipo_aval: 'Aval 1'
          });
      } else {
          if (excelName) unmatchedGestores.add(excelName);
      }
    }

    // Insertar en lotes
    const batchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        const { error } = await this.supabaseService.getClient().from('asignacion_avales').insert(batch);
        if (error) {
            this.logger.error(`Error en lote ${i}: ${error.message}`);
        } else {
            insertedCount += batch.length;
        }
    }

    return {
      success: true,
      totalProcesados: data.length,
      insertados: insertedCount,
      gestoresNoEncontrados: Array.from(unmatchedGestores)
    };
  }
}
