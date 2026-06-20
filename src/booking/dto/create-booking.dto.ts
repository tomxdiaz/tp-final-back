import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookingPersonDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '45746767' })
  @IsString()
  dni!: string;
}

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

  @ApiPropertyOptional({ type: [BookingPersonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingPersonDto)
  participants?: BookingPersonDto[];
}
