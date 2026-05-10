import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'Suscribirse al newsletter',
    description:
      'Registra un email en el newsletter. Si el email ya existe, la operación se considera exitosa igualmente.',
  })
  @ApiBody({ type: CreateNewsletterDto })
  @ApiOkResponse({
    description: 'Suscripción registrada correctamente',
    schema: {
      example: {
        message: 'Suscripción registrada correctamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Email inválido o faltante',
    schema: {
      example: {
        message: ['email must be an email'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
    schema: {
      example: {
        message: 'Error inesperado al suscribirse al newsletter',
        error: 'Internal Server Error',
        statusCode: 500,
      },
    },
  })
  async subscribe(
    @Body() createNewsletterDto: CreateNewsletterDto,
  ): Promise<{ message: string }> {
    const response = await this.newsletterService.subscribe(
      createNewsletterDto.email,
    );

    return { message: response };
  }
}
