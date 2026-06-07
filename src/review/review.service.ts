import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ReviewDto } from './dto/review.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('id')
      .eq('id', dto.business_id)
      .maybeSingle();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar el negocio',
      );
    }
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const { data: booking, error: bookError } = await supabase
      .from('booking')
      .select(
        'id, activity_session!inner(id, activity!inner(id, business_id))',
      )
      .eq('app_user_id', userId)
      .eq('activity_session.activity.business_id', dto.business_id)
      .limit(1)
      .maybeSingle();

    if (bookError) {
      this.logger.error(`Error checking booking: ${bookError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar la reserva',
      );
    }
    if (!booking)
      throw new ForbiddenException(
        'Debés tener una reserva en este negocio para dejar una reseña',
      );

    const { data: review, error: rError } = await supabase
      .from('review')
      .insert({
        app_user_id: userId,
        business_id: dto.business_id,
        rating: dto.rating,
        comment: dto.comment ?? null,
      })
      .select()
      .single();

    if (rError) {
      this.logger.error(`Error creating review: ${rError.message}`);
      if (rError.code === '23505') {
        throw new ConflictException(
          'Ya dejaste una reseña para este negocio',
        );
      }
      throw new InternalServerErrorException(
        'Error inesperado al crear la reseña',
      );
    }

    return {
      id: review.id,
      business_id: review.business_id,
      app_user_id: review.app_user_id,
      rating: review.rating,
      comment: review.comment ?? null,
      created_at: review.created_at,
      updated_at: review.updated_at,
    };
  }
}
