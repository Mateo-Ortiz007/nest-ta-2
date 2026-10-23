import {
  HttpException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePedidoDto) {
    return this.prisma.$transaction(async (tx) => {
      // Se crea primero el pedido; si una validación falla, la transacción revierte todo.
      const pedido = await tx.pedido.create({
        data: {
          estado: data.estado ?? 'pendiente',
          cantidad: this.totalItems(data.productos),
        },
      });

      const products = await this.validateProducts(tx, data.productos);
      await this.reserveInventory(tx, products, data.productos);
      await tx.pedidoProducto.createMany({
        data: data.productos.map(({ productId, cantidad }) => ({
          pedidoId: pedido.id,
          productId,
          cantidad,
        })),
      });

      return tx.pedido.findUniqueOrThrow({
        where: { id: pedido.id },
        include: { productos: { include: { product: true } } },
      });
    });
  }

  findAll() {
    return this.prisma.pedido.findMany({
      orderBy: { id: 'desc' },
      include: { productos: { include: { product: true } } },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { productos: { include: { product: true } } },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return pedido;
  }

  async update(id: number, data: UpdatePedidoDto) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: { productos: true },
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido ${id} no encontrado`);
      }

      if (data.productos !== undefined) {
        for (const item of pedido.productos) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.cantidad } },
          });
        }
        const products = await this.validateProducts(tx, data.productos);
        await this.reserveInventory(tx, products, data.productos);
        await tx.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      }

      return tx.pedido.update({
        where: { id },
        data: {
          ...(data.estado !== undefined && { estado: data.estado }),
          ...(data.productos !== undefined && {
            cantidad: this.totalItems(data.productos),
          }),
          ...(data.productos !== undefined && {
            productos: {
              create: data.productos.map(({ productId, cantidad }) => ({
                cantidad,
                product: { connect: { id: productId } },
              })),
            },
          }),
        },
        include: { productos: { include: { product: true } } },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: { productos: true },
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido ${id} no encontrado`);
      }

      for (const item of pedido.productos) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.cantidad } },
        });
      }
      await tx.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      return tx.pedido.delete({ where: { id } });
    });
  }

  private totalItems(productos: { cantidad: number }[]) {
    return productos.reduce((total, item) => total + item.cantidad, 0);
  }

  private async validateProducts(
    tx: any,
    productos: { productId: number; cantidad: number }[],
  ) {
    const productIds = productos.map(({ productId }) => productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    });
    const foundIds = new Set(products.map(({ id }) => id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: `Productos no encontrados: ${missingIds.join(', ')}`,
        missingProductIds: missingIds,
      });
    }
    return products;
  }

  private async reserveInventory(
    tx: any,
    products: { id: number; name: string; stock: number }[],
    productos: { productId: number; cantidad: number }[],
  ) {
    const requestedByProduct = new Map<number, number>();
    for (const item of productos) {
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.cantidad,
      );
    }

    for (const [productId, requested] of requestedByProduct) {
      const product = products.find(({ id }) => id === productId)!;
      if (requested > product.stock) {
        throw new HttpException(
          {
            statusCode: 209,
            message: `Inventario insuficiente para ${product.name}`,
            productId,
            disponible: product.stock,
            solicitado: requested,
          },
          209,
        );
      }

      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: requested } },
        data: { stock: { decrement: requested } },
      });
      if (updated.count === 0) {
        const current = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true },
        });
        throw new HttpException(
          {
            statusCode: 209,
            message: `Inventario insuficiente para ${product.name}`,
            productId,
            disponible: current?.stock ?? 0,
            solicitado: requested,
          },
          209,
        );
      }
    }
  }
}
