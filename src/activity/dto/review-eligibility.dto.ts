import { ApiProperty } from '@nestjs/swagger';

export class ReviewEligibilityDto {
  @ApiProperty({
    example: true,
    description:
      'Indica si el usuario autenticado tiene una reserva confirmada en la actividad, habilitando dejar una reseña',
  })
  has_confirmed_booking!: boolean;
}
