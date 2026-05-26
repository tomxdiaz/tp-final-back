import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ format: 'uuid' })
  app_user_id!: string;

  @ApiProperty({ example: 1 })
  activity_session_id!: number;

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
