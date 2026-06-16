import { Module } from '@nestjs/common';
import { RentaService } from './renta.service';
import { RentaController } from './renta.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [RentaService],
  controllers: [RentaController],
  exports: [RentaService],
})
export class RentaModule {}
