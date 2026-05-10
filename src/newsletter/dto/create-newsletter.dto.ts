import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email del usuario que quiere suscribirse',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
