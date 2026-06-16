import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { RentaModule } from '../renta/renta.module';

@Module({
  imports: [RentaModule],
  providers: [CrmService],
  controllers: [CrmController],
})
export class CrmModule {}
