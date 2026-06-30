import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryDto } from '../../category/dto/category.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ReviewDto } from '../../review/dto/review.dto';

export class ActivityBusinessDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ format: 'uuid' })
  app_user_id!: string;

  @ApiProperty({ example: 'Aventuras del Sur' })
  business_name!: string;

  @ApiPropertyOptional({ example: 'Ofrecemos excursiones en la Patagonia' })
  description!: string | null;

  @ApiPropertyOptional({ example: 'contacto@aventurasur.com' })
  contact_email!: string | null;

  @ApiPropertyOptional({ example: '+54911234567' })
  contact_phone!: string | null;

  @ApiProperty({ example: false })
  verified!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}

export class ActivitySessionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '2024-06-15T09:00:00.000Z' })
  datetime!: string;

  @ApiProperty({ example: 3 })
  booked_spots!: number;

  @ApiProperty({ enum: ['AVAILABLE', 'CANCELLED', 'COMPLETED'] })
  status!: 'AVAILABLE' | 'CANCELLED' | 'COMPLETED';

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}

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

  @ApiPropertyOptional({ example: 'Buenos Aires, Argentina' })
  location!: string | null;

  @ApiProperty({ example: ['https://example.com/img1.jpg'], isArray: true })
  images!: string[];

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

  @ApiPropertyOptional({ type: () => ActivitySessionDto, isArray: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivitySessionDto)
  sessions?: ActivitySessionDto[];

  @ApiPropertyOptional({ type: () => ActivityBusinessDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivityBusinessDto)
  business?: ActivityBusinessDto;

  @ApiPropertyOptional({ type: () => ReviewDto, isArray: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];
}
