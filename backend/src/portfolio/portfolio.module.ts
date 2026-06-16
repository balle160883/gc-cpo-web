import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { RentaModule } from '../renta/renta.module';

@Module({
  imports: [RentaModule],
  providers: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
