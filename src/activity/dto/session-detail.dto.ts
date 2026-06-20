import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionDetailActivityDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Trekking al Fitz Roy' })
  title!: string;

  @ApiPropertyOptional({ example: 'Una caminata increíble' })
  description!: string | null;

  @ApiProperty({ example: 15000 })
  base_price!: number;

  @ApiProperty({ example: 'ARS' })
  currency!: string;

  @ApiPropertyOptional({ example: 10 })
  max_participants!: number | null;

  @ApiPropertyOptional({ example: 'El Chaltén, Santa Cruz' })
  location!: string | null;

  @ApiPropertyOptional({ example: 480 })
  duration_minutes!: number | null;

  @ApiPropertyOptional({ enum: ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA'] })
  difficulty!: string | null;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiPropertyOptional({ example: 'Parking del parque nacional' })
  meeting_point!: string | null;
}

export class SessionDetailBookingPersonDto {
  @ApiProperty({ example: 'Juan Pérez' })
  name!: string;

  @ApiProperty({ example: '45746767' })
  dni!: string;
}

export class SessionDetailBookingUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'usuario@email.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Juan' })
  first_name!: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  last_name!: string | null;
}

export class SessionDetailBookingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: SessionDetailBookingUserDto })
  app_user!: SessionDetailBookingUserDto;

  @ApiProperty({ example: 2 })
  number_of_people!: number;

  @ApiProperty({ example: 30000 })
  total_price!: number;

  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED';

  @ApiPropertyOptional({ example: 'Somos dos adultos y una niña' })
  customer_notes!: string | null;

  @ApiPropertyOptional({ type: [SessionDetailBookingPersonDto] })
  participants!: SessionDetailBookingPersonDto[] | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}

export class SessionDetailDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  activity_id!: number;

  @ApiProperty({ example: '2024-07-15T09:00:00Z' })
  datetime!: string;

  @ApiProperty({ example: 3 })
  booked_spots!: number;

  @ApiPropertyOptional({ example: 7, nullable: true })
  remaining_spots!: number | null;

  @ApiProperty({ enum: ['AVAILABLE', 'CANCELLED', 'COMPLETED'] })
  status!: 'AVAILABLE' | 'CANCELLED' | 'COMPLETED';

  @ApiProperty({ type: SessionDetailActivityDto })
  activity!: SessionDetailActivityDto;

  @ApiProperty({ type: [SessionDetailBookingDto] })
  bookings!: SessionDetailBookingDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
