import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private supabaseService: SupabaseService) {}

  private _getSujetoEfectivo(item: any): string {
    const desc = item.descripcion || "";
    if (desc.startsWith('1-') || desc.startsWith('2-')) return 'Aval';
    if (desc.startsWith('0-')) return 'Socio';
    return item.sujeto_tipo || 'Socio';
  }

  private _normalizeId(id: any): string {
    if (!id) return '';
    let strId = String(id).trim();
    // Eliminar prefijos de sucursal comunes (ej: '10-156930' -> '156930')
    if (strId.includes('-')) {
      strId = strId.split('-').pop() || strId;
    }
    // Eliminar ceros a la izquierda
    return strId.replace(/^0+/, '');
  }

  private _deduplicateInteracciones(items: any[]): any[] {
    if (!items || items.length === 0) return [];
    
    // Sort descending by fecha_gestion
    const sorted = [...items].sort((a, b) => new Date(b.fecha_gestion).getTime() - new Date(a.fecha_gestion).getTime());
    const uniqueData: any[] = [];

    for (const item of sorted) {
      const itemTime = new Date(item.fecha_gestion).getTime();
      const duplicateIdx = uniqueData.findIndex(existing => {
        if (existing.socio_id !== item.socio_id) return false;
        if (existing.gestor_id !== item.gestor_id) return false;
        
        const diffSeconds = Math.abs(new Date(existing.fecha_gestion).getTime() - itemTime) / 1000;
        return diffSeconds <= 120; // 2 minutes window
      });

      if (duplicateIdx !== -1) {
        const existing = uniqueData[duplicateIdx];
        const existingIsGeneric = existing.descripcion === 'Visita cerrada desde detalle sin comentarios';
        const currentIsGeneric = item.descripcion === 'Visita cerrada desde detalle sin comentarios';

        if (existingIsGeneric && !currentIsGeneric) {
          uniqueData[duplicateIdx] = item;
        }
      } else {
        uniqueData.push(item);
      }
    }
    
    return uniqueData;
  }

  private async _fetchInBatches(table: string, column: string, ids: any[], selectStr: string = '*'): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    
    // Eliminar duplicados y nulos/vacíos
    const uniqueIds = [...new Set(ids.map(id => String(id || '').trim()))].filter(id => id.length > 0);
    const BATCH_SIZE = 500;
    let allResults: any[] = [];

    for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
      const batchIds = uniqueIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await this.supabaseService.getClient()
        .from(table)
        .select(selectStr)
        .in(column, batchIds);

      if (error) {
        this.logger.error(`Error in batch lookup for ${table}: ${error.message}`);
        continue;
      }
      if (data) {
        allResults = [...allResults, ...data];
      }
    }

    return allResults;
  }

  async registrarInteraccion(interaccion: any) {
    // Map tipo_gestion to tipo_contacto for compatibility with the database schema
    if (interaccion.tipo_gestion) {
      const tg = String(interaccion.tipo_gestion).toLowerCase();
      if (tg === 'visita') {
        interaccion.tipo_contacto = 'visita';
      } else if (tg === 'llamada') {
        interaccion.tipo_contacto = 'llamada';
      } else if (tg === 'mensaje') {
        interaccion.tipo_contacto = 'whatsapp';
      } else {
        interaccion.tipo_contacto = tg;
      }
      delete interaccion.tipo_gestion;
    }

    // 1. Capturar contexto de asignación antes de guardar para preservarlo históricamente
    try {
      const socioIdStr = String(interaccion.socio_id || '');
      const socioIdNorm = this._normalizeId(socioIdStr);
      
      const { data: asigData } = await this.supabaseService
        .getClient()
        .from('asignacion_gestores')
        .select('NoCUENTA, "FECHA ASIGNACION"')
        .or(`NoSOCIO.eq.${socioIdStr},NoSOCIO.eq.${socioIdNorm}`)
        .limit(1);

      if (asigData && asigData.length > 0) {
        // Guardar snapshot de la asignación actual en la interacción
        interaccion.num_cuenta = interaccion.num_cuenta || asigData[0].NoCUENTA;
        interaccion.fecha_inicio_gestion = interaccion.fecha_inicio_gestion || asigData[0]['FECHA ASIGNACION'];
      }
    } catch (e) {
      this.logger.warn(`Could not capture assignment context: ${e.message}`);
    }

    // 2. Aplicar detección inteligente antes de guardar
    if (interaccion.descripcion) {
      interaccion.sujeto_tipo = this._getSujetoEfectivo(interaccion);
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('cobranza_interacciones')
      .insert([interaccion])
      .select();

    if (error) {
      this.logger.error(`Error saving interaction: ${error.message}`);
      throw error;
    }
    return data[0];
  }

  async registrarPromesa(promesa: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('cobranza_promesas')
      .insert([promesa])
      .select();

    if (error) {
      this.logger.error(`Error saving promise: ${error.message}`);
      throw error;
    }
    return data[0];
  }

  async getInteraccionesSocio(socioId: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('cobranza_interacciones')
      .select('*, usuarios_gestor(gestor)')
      .eq('socio_id', socioId)
      .order('fecha_gestion', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching interactions: ${error.message}`);
      throw error;
    }

    // Deduplicate in memory before doing joins using 120s window
    const uniqueData = this._deduplicateInteracciones(data || []);

    // Manual join with asignacion_gestores and socios_datos
    if (uniqueData && uniqueData.length > 0) {
      const socioIds = [...new Set(uniqueData.map(i => i.socio_id))].filter(Boolean);
      const prestamoIds = [...new Set(uniqueData.map(i => i.prestamo_id))].filter(Boolean);
      const searchIds = [...new Set([...socioIds, ...socioIds.map(id => this._normalizeId(id))])];

      const [avales, socios, prestamos] = await Promise.all([
        this._fetchInBatches('asignacion_gestores', 'NoSOCIO', searchIds, 'NoSOCIO, NoCUENTA, NOMBRE, "NOMBRE D.A.1", "NOMBRE D.A.2", "FECHA ASIGNACION"'),
        this._fetchInBatches('socios_datos', 'friendly_code', searchIds, 'friendly_code, nombre_completo'),
        prestamoIds.length > 0 ? this._fetchInBatches('prestamos_datos', 'prestamo_id', prestamoIds, 'prestamo_id, num_cuenta, socio_id') : Promise.resolve([])
      ]);

      return uniqueData.map(i => {
        const iIdNorm = this._normalizeId(i.socio_id);
        const iIdOrig = String(i.socio_id || '').trim();
        
        let foundAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === iIdNorm || String(a.NoSOCIO).trim() === iIdOrig);
        let foundSocio = socios.find(s => this._normalizeId(s.friendly_code) === iIdNorm || String(s.friendly_code).trim() === iIdOrig);
        
        // Fallback robusto: si falta la asignación o el número de cuenta
        if (!foundAsig || !foundAsig.NoCUENTA) {
          // 1. Intentar por prestamo_id si existe
          if (i.prestamo_id) {
            const pMatch = prestamos.find((p: any) => p.prestamo_id === i.prestamo_id);
            if (pMatch) {
              const pIdNorm = this._normalizeId(pMatch.socio_id);
              if (!foundAsig) foundAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === pIdNorm);
              if (!foundSocio) foundSocio = socios.find(s => this._normalizeId(s.friendly_code) === pIdNorm);
              if (!foundAsig && pMatch.num_cuenta) {
                foundAsig = { NoCUENTA: pMatch.num_cuenta, NoSOCIO: pMatch.socio_id } as any;
              }
            }
          }
          
          // 2. Si sigue faltando, buscar cualquier asignación que coincida con el socio_id
          if (!foundAsig) {
            const alternativeAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === iIdNorm);
            if (alternativeAsig) foundAsig = alternativeAsig;
          }
        }

        const sujetoEfectivo = this._getSujetoEfectivo(i);
        const isAval = sujetoEfectivo.startsWith('Aval');
        const socioName = foundAsig?.NOMBRE || foundSocio?.nombre_completo;
        let avalName = null;
        if (sujetoEfectivo === 'Aval 1') {
          avalName = foundAsig?.['NOMBRE D.A.1'];
        } else if (sujetoEfectivo === 'Aval 2') {
          avalName = foundAsig?.['NOMBRE D.A.2'];
        } else {
          avalName = foundAsig?.['NOMBRE D.A.1'] || foundAsig?.['NOMBRE D.A.2'];
        }

        const tipoGestion = i.tipo_contacto === 'visita' ? 'Visita' :
                            i.tipo_contacto === 'llamada' ? 'Llamada' :
                            (i.tipo_contacto === 'whatsapp' || i.tipo_contacto === 'sms' || i.tipo_contacto === 'mensaje') ? 'Mensaje' :
                            'Visita';

        return {
          ...i,
          tipo_gestion: tipoGestion,
          nombre_visitado: isAval ? (avalName || (socioName ? `Aval de ${socioName}` : null)) : socioName,
          socios_datos: foundSocio,
          asignacion: foundAsig || (foundSocio ? { NOMBRE: foundSocio.nombre_completo } : null),
          num_cuenta: i.num_cuenta || foundAsig?.NoCUENTA,
          fecha_inicio_gestion: i.fecha_inicio_gestion || foundAsig?.['FECHA ASIGNACION']
        };
      });
    }

    return uniqueData;
  }

  async getInteracciones(gestorId?: string, startDate?: string, endDate?: string) {
    // Lógica de Paginación Automática para superar el límite de 1,000 de Postgrest/Supabase
    let allData: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const to = from + PAGE_SIZE - 1;
      let paginatedQuery = this.supabaseService
        .getClient()
        .from('cobranza_interacciones')
        .select('*, usuarios_gestor(gestor)')
        .order('fecha_gestion', { ascending: false })
        .range(from, to);

      if (gestorId) paginatedQuery = paginatedQuery.eq('gestor_id', gestorId);
      if (startDate) paginatedQuery = paginatedQuery.gte('fecha_gestion', startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        paginatedQuery = paginatedQuery.lte('fecha_gestion', end.toISOString());
      }

      const { data: pageData, error } = await paginatedQuery;

      if (error) {
        this.logger.error(`Error fetching page [${from}-${to}]: ${error.message}`);
        throw error;
      }

      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData];
        if (pageData.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      } else {
        hasMore = false;
      }

      // Seguridad: No recuperar más de 5,000 en un solo reporte para evitar timeout del backend
      if (allData.length >= 5000) {
        hasMore = false;
      }
    }

    const data = allData;
    this.logger.log(`Se recuperaron un total de ${data.length} interacciones de la base de datos (paginación completada).`);

    // Deduplicate in memory before doing joins using 120s window
    const uniqueData = this._deduplicateInteracciones(data || []);

    if (uniqueData.length !== data.length) {
      this.logger.log(`Deduplicados en memoria: ${data.length - uniqueData.length} registros duplicados filtrados.`);
    }

    // Manual join with asignacion_gestores and socios_datos
    if (uniqueData && uniqueData.length > 0) {
      const socioIds = [...new Set(uniqueData.map(i => i.socio_id))].filter(Boolean);
      const prestamoIds = [...new Set(uniqueData.map(i => i.prestamo_id))].filter(Boolean);
      const searchIds = [...new Set([...socioIds, ...socioIds.map(id => this._normalizeId(id))])];

      const [avales, socios, prestamos] = await Promise.all([
        this._fetchInBatches('asignacion_gestores', 'NoSOCIO', searchIds, 'NoSOCIO, NoCUENTA, NOMBRE, "NOMBRE D.A.1", "NOMBRE D.A.2", "FECHA ASIGNACION"'),
        this._fetchInBatches('socios_datos', 'friendly_code', searchIds, 'friendly_code, nombre_completo'),
        prestamoIds.length > 0 ? this._fetchInBatches('prestamos_datos', 'prestamo_id', prestamoIds, 'prestamo_id, num_cuenta, socio_id') : Promise.resolve([])
      ]);

      return uniqueData.map(i => {
        const iIdNorm = this._normalizeId(i.socio_id);
        const iIdOrig = String(i.socio_id || '').trim();
        
        let foundAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === iIdNorm || String(a.NoSOCIO).trim() === iIdOrig);
        let foundSocio = socios.find(s => this._normalizeId(s.friendly_code) === iIdNorm || String(s.friendly_code).trim() === iIdOrig);
        
        // Fallback robusto: si falta la asignación o el número de cuenta
        if (!foundAsig || !foundAsig.NoCUENTA) {
          // 1. Intentar por prestamo_id si existe
          if (i.prestamo_id) {
            const pMatch = prestamos.find((p: any) => p.prestamo_id === i.prestamo_id);
            if (pMatch) {
              const pIdNorm = this._normalizeId(pMatch.socio_id);
              if (!foundAsig) foundAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === pIdNorm);
              if (!foundSocio) foundSocio = socios.find(s => this._normalizeId(s.friendly_code) === pIdNorm);
              
              if (!foundAsig && pMatch.num_cuenta) {
                foundAsig = { NoCUENTA: pMatch.num_cuenta, NoSOCIO: pMatch.socio_id } as any;
              }
            }
          }

          // 2. Si sigue faltando, buscar cualquier asignación que coincida con el socio_id
          if (!foundAsig) {
            const alternativeAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === iIdNorm);
            if (alternativeAsig) foundAsig = alternativeAsig;
          }
        }

        const sujetoEfectivo = this._getSujetoEfectivo(i);
        const isAval = sujetoEfectivo.startsWith('Aval');
        const socioName = foundAsig?.NOMBRE || foundSocio?.nombre_completo;
        let avalName = null;
        if (sujetoEfectivo === 'Aval 1') {
          avalName = foundAsig?.['NOMBRE D.A.1'];
        } else if (sujetoEfectivo === 'Aval 2') {
          avalName = foundAsig?.['NOMBRE D.A.2'];
        } else {
          avalName = foundAsig?.['NOMBRE D.A.1'] || foundAsig?.['NOMBRE D.A.2'];
        }

        const tipoGestion = i.tipo_contacto === 'visita' ? 'Visita' :
                            i.tipo_contacto === 'llamada' ? 'Llamada' :
                            (i.tipo_contacto === 'whatsapp' || i.tipo_contacto === 'sms' || i.tipo_contacto === 'mensaje') ? 'Mensaje' :
                            'Visita';

        return {
          ...i,
          tipo_gestion: tipoGestion,
          nombre_visitado: isAval ? (avalName || (socioName ? `Aval de ${socioName}` : null)) : socioName,
          socios_datos: foundSocio,
          asignacion: foundAsig || (foundSocio ? { NOMBRE: foundSocio.nombre_completo } : null),
          num_cuenta: i.num_cuenta || foundAsig?.NoCUENTA,
          fecha_inicio_gestion: i.fecha_inicio_gestion || foundAsig?.['FECHA ASIGNACION']
        };
      });
    }

    return uniqueData;
  }

  async getPromesasPendientes(gestorId?: string, startDate?: string, endDate?: string) {
    // 1. Query structured promises from cobranza_promesas
    let promiseQuery = this.supabaseService
      .getClient()
      .from('cobranza_promesas')
      .select('*, prestamos_datos(num_cuenta, socio_id, socios_datos(friendly_code, nombre_completo))')
      .eq('estado', 'pendiente');

    if (startDate) promiseQuery = promiseQuery.gte('fecha_promesa', startDate);
    if (endDate) {
       const end = new Date(endDate);
       end.setHours(23, 59, 59, 999);
       promiseQuery = promiseQuery.lte('fecha_promesa', end.toISOString());
    }

    // 2. Query informal promises from cobranza_interacciones
    let interactionQuery = this.supabaseService
      .getClient()
      .from('cobranza_interacciones')
      .select('id, socio_id, fecha_gestion, descripcion, gestor_id, sujeto_tipo, prestamo_id')
      .eq('resultado', 'promesa_pago')
      .order('fecha_gestion', { ascending: false });

    if (gestorId) {
      interactionQuery = interactionQuery.eq('gestor_id', gestorId);
    }
    
    if (startDate) interactionQuery = interactionQuery.gte('fecha_gestion', startDate);
    if (endDate) {
       const end = new Date(endDate);
       end.setHours(23, 59, 59, 999);
       interactionQuery = interactionQuery.lte('fecha_gestion', end.toISOString());
    }

    const [promRes, intRes, gestoresRes] = await Promise.all([
      promiseQuery, 
      interactionQuery,
      this.supabaseService.getClient().from('usuarios_gestor').select('id, gestor')
    ]);

    if (promRes.error) throw promRes.error;
    if (intRes.error) throw intRes.error;

    const formalPromises = promRes.data || [];
    const rawInteractionPromises = intRes.data || [];

    // Deduplicate informal promises using 120s window
    const interactionPromises = this._deduplicateInteracciones(rawInteractionPromises || []);

    // Combine all socio IDs to fetch metadata once
    const allSocioIds = [
      ...formalPromises.map(p => p.prestamos_datos?.socio_id),
      ...interactionPromises.map(i => i.socio_id)
    ].filter(Boolean);

    const socioIds = [...new Set(allSocioIds.map(id => String(id)))];
    const searchIds = [...new Set([...socioIds, ...socioIds.map(id => this._normalizeId(id))])];

    const [avales, socios] = await Promise.all([
      this._fetchInBatches('asignacion_gestores', 'NoSOCIO', searchIds, 'NoSOCIO, NoCUENTA, NOMBRE, "NOMBRE D.A.1", "NOMBRE D.A.2", "FECHA ASIGNACION"'),
      this._fetchInBatches('socios_datos', 'friendly_code', searchIds, 'friendly_code, nombre_completo, socio_id')
    ]);

    const gestoresMap = new Map((gestoresRes.data || []).map(g => [g.id, g.gestor]));

    // Helper to find name and sujeto_tipo
    const getMetadata = (id: any, sujetoTipo: string = 'Socio') => {
      const iIdNorm = this._normalizeId(id);
      const iIdOrig = String(id || '').trim();
      
      const foundAsig = avales.find(a => this._normalizeId(a.NoSOCIO) === iIdNorm || String(a.NoSOCIO).trim() === iIdOrig);
      const foundSocio = socios.find(s => this._normalizeId(s.friendly_code) === iIdNorm || String(s.friendly_code).trim() === iIdOrig);
      
      const isAval = sujetoTipo.startsWith('Aval');
      const socioName = foundAsig?.NOMBRE || foundSocio?.nombre_completo;
      let avalName = null;
      if (sujetoTipo === 'Aval 1') {
        avalName = foundAsig?.['NOMBRE D.A.1'];
      } else if (sujetoTipo === 'Aval 2') {
        avalName = foundAsig?.['NOMBRE D.A.2'];
      } else {
        avalName = foundAsig?.['NOMBRE D.A.1'] || foundAsig?.['NOMBRE D.A.2'];
      }

      return {
        nombre_visitado: isAval ? (avalName || (socioName ? `Aval de ${socioName}` : null)) : socioName,
        sujeto_tipo: sujetoTipo,
        socio_id: foundSocio?.friendly_code || foundAsig?.NoSOCIO || id,
        num_cuenta: foundAsig?.NoCUENTA,
        fecha_inicio_gestion: foundAsig?.['FECHA ASIGNACION']
      };
    };

    const mappedFormal = formalPromises.map(p => {
      const metadata = getMetadata(p.prestamos_datos?.socio_id); // Default to Socio for formal if not linked to interaction
      return {
        ...p,
        monto: p.monto_prometido,
        fecha_pago: p.fecha_promesa,
        nombre_visitado: metadata.nombre_visitado || p.prestamos_datos?.socios_datos?.nombre_completo,
        socio_id: metadata.socio_id,
        num_cuenta: p.prestamos_datos?.num_cuenta || metadata.num_cuenta,
        sujeto_tipo: 'Socio', // Assume Socio for formal unless we fetch interaccion info
        gestor_nombre: gestoresMap.get(p.gestor_id)
      };
    });

    const mappedInformal = interactionPromises.map(i => {
      const sujetoEfectivo = this._getSujetoEfectivo(i);
      const metadata = getMetadata(i.socio_id, sujetoEfectivo);
      return {
        id: i.id,
        is_informal: true,
        num_cuenta: metadata.num_cuenta || 'Bitácora',
        monto: 0,
        fecha_pago: i.fecha_gestion,
        estado: 'pendiente',
        descripcion: i.descripcion,
        gestor_id: i.gestor_id,
        gestor_nombre: gestoresMap.get(i.gestor_id),
        socio_id: metadata.socio_id,
        nombre_visitado: metadata.nombre_visitado,
        sujeto_tipo: metadata.sujeto_tipo,
        prestamos_datos: {
          socios_datos: {
            nombre_completo: metadata.nombre_visitado
          }
        }
      };
    });

    return [...mappedFormal, ...mappedInformal];
  }
}
