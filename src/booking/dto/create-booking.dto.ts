import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  activity_session_id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  number_of_people!: number;

  @ApiPropertyOptional({ example: 'Somos dos adultos y una niña' })
  @IsOptional()
  @IsString()
  customer_notes?: string;
}
