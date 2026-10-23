import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PedidoProductoItemDto } from './pedido-producto-item.dto.js';

export class UpdatePedidoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  estado?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique((item: PedidoProductoItemDto) => item.productId)
  @ValidateNested({ each: true })
  @Type(() => PedidoProductoItemDto)
  productos?: PedidoProductoItemDto[];
}
