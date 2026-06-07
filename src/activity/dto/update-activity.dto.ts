import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'Trekking en la Patagonia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Una experiencia increíble' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  category_id?: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'starting_hour debe tener formato HH:MM',
  })
  starting_hour?: string;

  @ApiPropertyOptional({ example: 'Buenos Aires, Argentina' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/img1.jpg'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 'Acceso norte del parque' })
  @IsOptional()
  @IsString()
  meeting_point?: string;

  @ApiPropertyOptional({ example: -41.1335 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -71.3103 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ enum: ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'] })
  @IsOptional()
  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'])
  difficulty?: 'BAJA' | 'MEDIA' | 'ALTA' | 'EXTREMA';

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({ example: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: [1, 3, 5] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days_of_week?: number[];

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  min_age?: number;
}
