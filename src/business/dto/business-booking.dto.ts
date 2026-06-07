import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingAppUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Juan' })
  first_name!: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  last_name!: string | null;
}

export class BookingActivityDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Trekking al Fitz Roy' })
  title!: string;
}

export class BookingActivitySessionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '2024-07-15T09:00:00Z' })
  datetime!: string;

  @ApiProperty({ type: BookingActivityDto })
  activity!: BookingActivityDto;
}

export class BusinessBookingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: BookingAppUserDto })
  app_user!: BookingAppUserDto;

  @ApiProperty({ type: BookingActivitySessionDto })
  activity_session!: BookingActivitySessionDto;

  @ApiProperty({ example: 2 })
  number_of_people!: number;

  @ApiProperty({ example: 10000 })
  total_price!: number;

  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED';

  @ApiPropertyOptional({ example: 'Somos dos adultos y una niña' })
  customer_notes!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
