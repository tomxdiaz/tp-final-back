import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../supabase/database.types';

type Newsletter = Tables<'newsletter'>;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async subscribe(email: string): Promise<string> {
    const supabase = this.supabaseService.getAdminClient();

    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail) {
      throw new BadRequestException('El email es requerido');
    }

    const { error } = await supabase.from('newsletter').upsert(
      {
        email: normalizedEmail,
      } satisfies Partial<Newsletter>,
      {
        onConflict: 'email',
        ignoreDuplicates: true,
      },
    );

    if (error) {
      this.logger.error(`Error subscribing to newsletter: ${error.message}`);

      if (this.isInvalidInputError(error)) {
        throw new BadRequestException('Email inválido para suscribirse');
      }

      throw new InternalServerErrorException(
        'Error inesperado al suscribirse al newsletter',
      );
    }

    return 'Suscripción registrada correctamente';
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isInvalidInputError(error: { code?: string; message?: string }) {
    return (
      error.code === '22P02' ||
      error.message?.toLowerCase().includes('invalid input syntax')
    );
  }
}
