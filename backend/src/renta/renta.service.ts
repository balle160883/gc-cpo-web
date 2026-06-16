import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RentaService {
  private readonly logger = new Logger(RentaService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('rentas_mensuales')
      .select('*')
      .order('cliente_email', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching rentas: ${error.message}`);
      throw error;
    }
    return data;
  }

  async upsert(data: any) {
    const { data: result, error } = await this.supabaseService
      .getClient()
      .from('rentas_mensuales')
      .upsert(data)
      .select();

    if (error) {
      this.logger.error(`Error upserting renta: ${error.message}`);
      throw error;
    }
    return result;
  }
}
