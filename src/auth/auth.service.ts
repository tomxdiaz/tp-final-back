import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(email: string, password: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    if (!email || !password) {
      throw new BadRequestException('Email y password son requeridos');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.warn(`Sign in failed: ${error.message}`);

      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!data.session?.access_token) {
      this.logger.error('No access token returned from Supabase');

      throw new InternalServerErrorException(
        'Error inesperado al iniciar sesión',
      );
    }

    return data.session.access_token;
  }

  async signUp(email: string, password: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    if (!email || !password) {
      throw new BadRequestException('Email y password son requeridos');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      this.logger.warn(`Sign up failed: ${error.message}`);

      throw new BadRequestException(
        'Datos inválidos para registrar usuario o usuario ya existente',
      );
    }

    return 'User registered successfully. Please check your email to confirm your account.';
  }
}
