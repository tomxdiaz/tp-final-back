import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryDto } from '../../category/dto/category.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class ActivityDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  business_id!: number;

  @ApiProperty({ example: 'Trekking en la Patagonia' })
  title!: string;

  @ApiPropertyOptional({ example: 'Una experiencia increíble' })
  description!: string | null;

  @ApiProperty({ example: 1 })
  category_id!: number;

  @ApiPropertyOptional({ type: () => CategoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryDto)
  category?: CategoryDto;

  @ApiProperty({ example: '09:00:00' })
  starting_hour!: string;

  @ApiPropertyOptional({ example: 'Acceso norte del parque' })
  meeting_point!: string | null;

  @ApiPropertyOptional({ example: -41.1335 })
  latitude!: number | null;

  @ApiPropertyOptional({ example: -71.3103 })
  longitude!: number | null;

  @ApiPropertyOptional({ enum: ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'] })
  difficulty!: 'BAJA' | 'MEDIA' | 'ALTA' | 'EXTREMA' | null;

  @ApiPropertyOptional({ example: 120 })
  duration_minutes!: number | null;

  @ApiProperty({ example: 5000 })
  base_price!: number;

  @ApiProperty({ example: 'ARS' })
  currency!: string;

  @ApiProperty({ example: [1, 3, 5], description: '0=domingo, 6=sábado' })
  days_of_week!: number[];

  @ApiPropertyOptional({ example: 18 })
  min_age!: number | null;

  @ApiPropertyOptional({ example: 10 })
  max_participants!: number | null;

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
