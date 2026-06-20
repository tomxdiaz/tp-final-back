import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingAppUserDto } from '../../business/dto/business-booking.dto';
import { BookingPersonDto } from './create-booking.dto';

export class BookingBusinessDto {
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

export class BookingActivityFullDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  business_id!: number;

  @ApiProperty({ example: 'Trekking al Fitz Roy' })
  title!: string;

  @ApiPropertyOptional({ example: 'Una caminata increíble' })
  description!: string | null;

  @ApiProperty({ example: 2 })
  category_id!: number;

  @ApiProperty({ example: '09:00:00' })
  starting_hour!: string;

  @ApiPropertyOptional({ example: 'El Chaltén, Santa Cruz' })
  location!: string | null;

  @ApiProperty({ example: [] })
  images!: string[];

  @ApiPropertyOptional({ example: 'Parking del parque nacional' })
  meeting_point!: string | null;

  @ApiPropertyOptional({ example: -49.3308 })
  latitude!: number | null;

  @ApiPropertyOptional({ example: -72.8868 })
  longitude!: number | null;

  @ApiPropertyOptional({ enum: ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'] })
  difficulty!: string | null;

  @ApiPropertyOptional({ example: 480 })
  duration_minutes!: number | null;

  @ApiProperty({ example: 15000 })
  base_price!: number;

  @ApiProperty({ example: 'ARS' })
  currency!: string;

  @ApiProperty({ example: [1, 3, 5] })
  days_of_week!: number[];

  @ApiPropertyOptional({ example: 12 })
  min_age!: number | null;

  @ApiPropertyOptional({ example: 10 })
  max_participants!: number | null;

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;

  @ApiProperty({ type: BookingBusinessDto })
  business!: BookingBusinessDto;
}

export class BookingActivitySessionFullDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  activity_id!: number;

  @ApiProperty({ example: '2024-07-15T09:00:00Z' })
  datetime!: string;

  @ApiProperty({ example: 3 })
  booked_spots!: number;

  @ApiProperty({ enum: ['AVAILABLE', 'CANCELLED', 'COMPLETED'] })
  status!: 'AVAILABLE' | 'CANCELLED' | 'COMPLETED';

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;

  @ApiProperty({ type: BookingActivityFullDto })
  activity!: BookingActivityFullDto;
}

export class BookingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: BookingAppUserDto })
  app_user!: BookingAppUserDto;

  @ApiProperty({ type: BookingActivitySessionFullDto, nullable: true })
  activity_session!: BookingActivitySessionFullDto | null;

  @ApiProperty({ example: 2 })
  number_of_people!: number;

  @ApiProperty({ example: 10000 })
  total_price!: number;

  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED';

  @ApiPropertyOptional({ example: 'Somos dos adultos y una niña' })
  customer_notes!: string | null;

  @ApiPropertyOptional({ type: [BookingPersonDto] })
  participants!: BookingPersonDto[] | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
