import { Type } from 'class-transformer';
import {
  ArrayUnique,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PedidoProductoItemDto } from './pedido-producto-item.dto.js';

export class CreatePedidoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  estado?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: PedidoProductoItemDto) => item.productId)
  @ValidateNested({ each: true })
  @Type(() => PedidoProductoItemDto)
  productos!: PedidoProductoItemDto[];
}
