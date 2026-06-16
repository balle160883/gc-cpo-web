import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { RentaService } from './renta.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('renta')
export class RentaController {
  constructor(private readonly rentaService: RentaService) {}

  @Get()
  async getRenta(@Request() req: any) {
    // Solo el superadmin puede ver todas las rentas. Los demás podrían ver solo la suya si se implementa.
    // Pero por ahora, el Superadmin es el que usa este endpoint en el frontend.
    return this.rentaService.findAll();
  }

  @Post()
  async upsertRenta(@Body() data: any) {
    return this.rentaService.upsert(data);
  }
}
