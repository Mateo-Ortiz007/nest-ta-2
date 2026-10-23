import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  product: any;
  pedido: any;
  pedidoProducto: any;

  async onModuleInit(): Promise<void> {
    this.logger.warn(
      'Prisma está deshabilitado para esta prueba en memoria; la API de reservas usa almacenamiento local.',
    );
  }

  async onModuleDestroy(): Promise<void> {
    // No-op: se evita la conexión a base de datos en este ejercicio.
  }

  $transaction<T>(fn: (tx: any) => Promise<T> | T): Promise<T> | T {
    return fn({
      product: undefined,
      pedido: undefined,
      pedidoProducto: undefined,
    });
  }
}
