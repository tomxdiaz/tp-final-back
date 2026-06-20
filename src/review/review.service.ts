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

    const { data: activity, error: aError } = await supabase
      .from('activity')
      .select('id, business_id')
      .eq('id', dto.activity_id)
      .maybeSingle();

    if (aError) {
      this.logger.error(`Error finding activity: ${aError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar la actividad',
      );
    }
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const { data: booking, error: bkError } = await supabase
      .from('booking')
      .select('id, activity_session!inner(activity_id)')
      .eq('app_user_id', userId)
      .eq('activity_session.activity_id', dto.activity_id)
      .eq('status', 'CONFIRMED')
      .limit(1)
      .maybeSingle();

    if (bkError) {
      this.logger.error(`Error checking booking: ${bkError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar la reserva',
      );
    }
    if (!booking) {
      throw new ForbiddenException(
        'Necesitás una reserva confirmada en esta actividad para dejar una reseña',
      );
    }

    const { data: review, error: rError } = await supabase
      .from('review')
      .insert({
        app_user_id: userId,
        business_id: activity.business_id,
        activity_id: dto.activity_id,
        rating: dto.rating,
        comment: dto.comment ?? null,
      })
      .select()
      .single();

    if (rError) {
      this.logger.error(`Error creating review: ${rError.message}`);
      if (rError.code === '23505') {
        throw new ConflictException(
          'Ya dejaste una reseña para esta actividad',
        );
      }
      throw new InternalServerErrorException(
        'Error inesperado al crear la reseña',
      );
    }

    return {
      id: review.id,
      activity_id: review.activity_id,
      business_id: review.business_id,
      app_user_id: review.app_user_id,
      rating: review.rating,
      comment: review.comment ?? null,
      created_at: review.created_at,
      updated_at: review.updated_at,
    };
  }
}
