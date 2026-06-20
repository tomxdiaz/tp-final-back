import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReviewDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  activity_id!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  business_id!: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  app_user_id!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  rating!: number;

  @ApiPropertyOptional({ example: 'Excelente servicio' })
  @IsOptional()
  @IsString()
  comment!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;

  @ApiPropertyOptional({
    example: { id: 1, title: 'Trekking en la Patagonia' },
  })
  @IsOptional()
  activity?: { id: number; title: string };
}
