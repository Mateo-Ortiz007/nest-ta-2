import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Response } from 'express';

interface Reserva {
  id: number;
  laboratorio: string;
  docente: string;
  hora: number;
}

const reservas: Reserva[] = [
  { id: 1, laboratorio: 'Lab 1', docente: 'Marta Loja', hora: 8 },
  { id: 2, laboratorio: 'Lab 2', docente: 'Luis Paredes', hora: 10 },
];

let nextReservaId = 3;

@Controller('reservas')
export class ReservasController {
  @Get()
  findAll(@Query('laboratorio') laboratorio?: string): Reserva[] {
    if (laboratorio === undefined) {
      return reservas;
    }

    return reservas.filter((reserva) => reserva.laboratorio === laboratorio);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Reserva {
    const reserva = reservas.find((item) => item.id === id);

    if (!reserva) {
      throw new NotFoundException(`No existe la reserva ${id}`);
    }

    return reserva;
  }

  @Post()
  create(
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) response: Response,
  ): Reserva {
    const docente = body?.docente;
    if (typeof docente !== 'string' || docente.trim() === '') {
      throw new BadRequestException('El docente es obligatorio');
    }

    const laboratorio = body?.laboratorio;
    if (typeof laboratorio !== 'string' || laboratorio.trim() === '') {
      throw new BadRequestException('El laboratorio es obligatorio');
    }

    const hora = body?.hora;
    if (typeof hora !== 'number' || !Number.isInteger(hora)) {
      throw new BadRequestException('La hora debe ser un número entero');
    }

    if (!['Lab 1', 'Lab 2', 'Lab 3'].includes(laboratorio)) {
      throw new UnprocessableEntityException(
        `El laboratorio "${laboratorio}" no existe`,
      );
    }

    if (hora < 7 || hora > 18) {
      throw new UnprocessableEntityException(
        'Solo se reserva entre las 7:00 y las 18:00',
      );
    }

    const existeReserva = reservas.some(
      (reserva) =>
        reserva.laboratorio === laboratorio && reserva.hora === hora,
    );

    if (existeReserva) {
      throw new ConflictException(
        `${laboratorio} ya está reservado a las ${hora}:00`,
      );
    }

    const nuevaReserva: Reserva = {
      id: nextReservaId,
      laboratorio,
      docente: docente.trim(),
      hora,
    };

    nextReservaId += 1;
    reservas.push(nuevaReserva);
    response.setHeader('Location', `/reservas/${nuevaReserva.id}`);
    return nuevaReserva;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    const index = reservas.findIndex((reserva) => reserva.id === id);

    if (index === -1) {
      throw new NotFoundException(`No existe la reserva ${id}`);
    }

    reservas.splice(index, 1);
  }
}
