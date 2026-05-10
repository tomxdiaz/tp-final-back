import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({
    description: 'Inicio de sesión correcto',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para iniciar sesión',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    const access_token = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );
    return { access_token };
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Registrar un nuevo usuario con rol global USER' })
  @ApiCreatedResponse({
    description: 'Usuario registrado correctamente',
    schema: {
      example: {
        message: 'Usuario registrado correctamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos para registrar usuario o usuario ya existente',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado del servidor',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
    const message = await this.authService.signUp(
      signUpDto.email,
      signUpDto.password,
    );
    return { message };
  }
}
