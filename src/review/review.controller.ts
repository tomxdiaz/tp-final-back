import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { ReviewDto } from './dto/review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Dejar una reseña para una actividad' })
  @ApiCreatedResponse({ type: ReviewDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({
    description: 'No tenés una reserva confirmada en esta actividad',
  })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiConflictResponse({
    description: 'Ya dejaste una reseña para esta actividad',
  })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.create(appUser.id, dto);
  }
}
