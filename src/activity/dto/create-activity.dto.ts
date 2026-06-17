import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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

/** Wraps a single multipart value into an array (FormData sends 1 item as a scalar). */
const toArray = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null) return value;
  return Array.isArray(value) ? value : [value];
};

/** Coerces multipart string values (and arrays of them) into numbers. */
const toNumberArray = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null) return value;
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((v) => Number(v));
};

export class CreateActivityDto {
  @ApiProperty({ example: 'Trekking en la Patagonia' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Una experiencia increíble' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id!: number;

  @ApiProperty({ example: '09:00', description: 'Formato HH:MM' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'starting_hour debe tener formato HH:MM',
  })
  starting_hour!: string;

  @ApiPropertyOptional({ example: 'Buenos Aires, Argentina' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'Archivos de imagen a subir (multipart)',
  })
  @IsOptional()
  images?: unknown;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/img1.jpg'],
    description: 'URLs de imágenes ya existentes que se quieren conservar',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUrl({}, { each: true })
  existingImages?: string[];

  @ApiPropertyOptional({ example: 'Acceso norte del parque' })
  @IsOptional()
  @IsString()
  meeting_point?: string;

  @ApiPropertyOptional({ example: -41.1335 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -71.3103 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ enum: ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'] })
  @IsOptional()
  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'])
  difficulty?: 'BAJA' | 'MEDIA' | 'ALTA' | 'EXTREMA';

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base_price!: number;

  @ApiPropertyOptional({ example: 'ARS', default: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: [1, 3, 5], description: '0=domingo, 6=sábado' })
  @Transform(toNumberArray)
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days_of_week!: number[];

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_age?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_participants?: number;
}
