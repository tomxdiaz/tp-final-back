import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { UploadedImage } from '../supabase/supabase.service';
import { ActivityDto } from './dto/activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import type { Tables } from '../supabase/database.types';
import { BusinessService } from '../business/business.service';

type Activity = Tables<'activity'>;
type ActivitySession = Tables<'activity_session'>;
type Review = Tables<'review'>;

type ActivityWithCategory = Activity & {
  category: {
    id: number;
    name: string;
  } | null;
};

type ActivityBusiness = {
  id: number;
  app_user_id: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

type ActivityWithCategoryAndSessions = ActivityWithCategory & {
  sessions?: ActivitySession[];
  business?: ActivityBusiness | null;
  review?: Review[];
};

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  private readonly activitySelect = `
    *,
    category:category_id (
      id,
      name
    )
  `;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly businessService: BusinessService,
  ) {}

  async create(
    userId: string,
    dto: CreateActivityDto,
    files?: UploadedImage[],
  ): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('id, verified')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar el negocio',
      );
    }
    if (!business) {
      throw new BadRequestException(
        'Necesitás tener un perfil de negocio para crear actividades',
      );
    }
    if (!business.verified) {
      throw new BadRequestException(
        'Tu perfil de negocio debe estar verificado para crear actividades',
      );
    }

    await this.validateCategory(dto.category_id);

    const uploadedUrls = await this.supabaseService.uploadImages(
      files ?? [],
      `business-${business.id}`,
    );
    const images = [...(dto.existingImages ?? []), ...uploadedUrls];

    const { data, error } = await supabase
      .from('activity')
      .insert({
        business_id: business.id,
        title: dto.title,
        description: dto.description ?? null,
        category_id: dto.category_id,
        location: dto.location ?? null,
        images,
        starting_hour: dto.starting_hour,
        meeting_point: dto.meeting_point ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        difficulty: dto.difficulty ?? null,
        duration_minutes: dto.duration_minutes ?? null,
        base_price: dto.base_price,
        currency: dto.currency ?? 'ARS',
        days_of_week: dto.days_of_week,
        min_age: dto.min_age ?? null,
        max_participants: dto.max_participants ?? null,
      })
      .select(this.activitySelect)
      .single();

    if (error) {
      this.logger.error(`Error creating activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al crear la actividad',
      );
    }

    await this.createSessionsForActivity(
      data.id,
      data.days_of_week,
      data.starting_hour,
    );

    return this.toActivityDto(data);
  }

  async findAllPublic(): Promise<ActivityDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: businesses, error: businessError } = await supabase
      .from('business')
      .select('id')
      .eq('verified', true);

    if (businessError) {
      this.logger.error(
        `Error finding verified businesses: ${businessError.message}`,
      );
      throw new InternalServerErrorException(
        'Error inesperado al obtener las actividades',
      );
    }

    const ids = (businesses ?? []).map((b) => b.id);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('activity')
      .select(this.activitySelect)
      .eq('is_active', true)
      .in('business_id', ids)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding activities: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las actividades',
      );
    }

    return (data ?? []).map((a) => this.toActivityDto(a));
  }

  async findAllOfMyBusiness(appUserId: string): Promise<ActivityDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const business = await this.businessService.findMyProfile(appUserId);

    const { data, error } = await supabase
      .from('activity')
      .select(this.activitySelect)
      .eq('business_id', business.id)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(
        `Error finding activities for my business: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error inesperado al obtener las actividades',
      );
    }

    return (data ?? []).map((a) => this.toActivityDto(a));
  }

  async findAllByBusinessPublic(businessId: number): Promise<ActivityDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const business = await this.businessService.findPublicById(businessId);

    const { data, error } = await supabase
      .from('activity')
      .select(this.activitySelect)
      .eq('is_active', true)
      .eq('business_id', business.id)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(
        `Error finding activities for business: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error inesperado al obtener las actividades',
      );
    }

    return (data ?? []).map((a) => this.toActivityDto(a));
  }

  async findById(
    activityId: number,
    userId?: string,
  ): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('activity')
      .select(
        `${this.activitySelect}, sessions:activity_session(*), business(*), review(*)`,
      )
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding activity by id: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    const dto = this.toActivityDto(data);

    if (userId) {
      const { data: booking, error: bkError } = await supabase
        .from('booking')
        .select('id, activity_session!inner(activity_id)')
        .eq('app_user_id', userId)
        .eq('activity_session.activity_id', activityId)
        .eq('status', 'CONFIRMED')
        .limit(1)
        .maybeSingle();

      if (!bkError) {
        dto.has_confirmed_booking = !!booking;
      }
    }

    return dto;
  }

  async findByIdOwner(
    activityId: number,
    userId: string,
  ): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.verifyOwnership(activityId, userId);

    const { data, error } = await supabase
      .from('activity')
      .select(
        `${this.activitySelect}, sessions:activity_session(*), business(*)`,
      )
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding activity by id: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return this.toActivityDto(data);
  }

  async update(
    activityId: number,
    userId: string,
    dto: UpdateActivityDto,
    files?: UploadedImage[],
  ): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const currentActivity = await this.verifyOwnership(activityId, userId);

    if (dto.category_id !== undefined) {
      await this.validateCategory(dto.category_id);
    }

    if (dto.days_of_week !== undefined) {
      const removedDays = currentActivity.days_of_week.filter(
        (d) => !dto.days_of_week!.includes(d),
      );

      if (removedDays.length > 0) {
        const now = new Date().toISOString();

        const { data: futureSessions, error: fsError } = await supabase
          .from('activity_session')
          .select('id, datetime')
          .eq('activity_id', activityId)
          .gt('datetime', now);

        if (fsError) {
          this.logger.error(`Error finding sessions: ${fsError.message}`);
          throw new InternalServerErrorException(
            'Error inesperado al obtener las sesiones',
          );
        }

        const sessionIdsToRemove = (futureSessions ?? [])
          .filter((s) => {
            const dow = new Date(s.datetime).getUTCDay();
            return removedDays.includes(dow);
          })
          .map((s) => s.id);

        if (sessionIdsToRemove.length > 0) {
          const { error: cbError } = await supabase
            .from('booking')
            .update({ status: 'CANCELLED' })
            .in('activity_session_id', sessionIdsToRemove)
            .neq('status', 'CANCELLED');

          if (cbError) {
            this.logger.error(`Error cancelling bookings: ${cbError.message}`);
            throw new InternalServerErrorException(
              'Error inesperado al cancelar las reservas',
            );
          }

          const { error: dsError } = await supabase
            .from('activity_session')
            .delete()
            .in('id', sessionIdsToRemove);

          if (dsError) {
            this.logger.error(`Error deleting sessions: ${dsError.message}`);
            throw new InternalServerErrorException(
              'Error inesperado al eliminar las sesiones',
            );
          }
        }
      }
    }

    const updates: Partial<Activity> = {};

    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.category_id !== undefined) updates.category_id = dto.category_id;
    if (dto.location !== undefined) updates.location = dto.location;

    // Only touch images if the client sent new files or an explicit list of
    // images to keep. Otherwise leave the existing images untouched.
    if ((files && files.length > 0) || dto.existingImages !== undefined) {
      const uploadedUrls = await this.supabaseService.uploadImages(
        files ?? [],
        `business-${currentActivity.business_id}`,
      );
      updates.images = [...(dto.existingImages ?? []), ...uploadedUrls];
    }

    if (dto.starting_hour !== undefined)
      updates.starting_hour = dto.starting_hour;
    if (dto.meeting_point !== undefined)
      updates.meeting_point = dto.meeting_point;
    if (dto.latitude !== undefined) updates.latitude = dto.latitude;
    if (dto.longitude !== undefined) updates.longitude = dto.longitude;
    if (dto.difficulty !== undefined) updates.difficulty = dto.difficulty;
    if (dto.duration_minutes !== undefined)
      updates.duration_minutes = dto.duration_minutes;
    if (dto.base_price !== undefined) updates.base_price = dto.base_price;
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.days_of_week !== undefined) updates.days_of_week = dto.days_of_week;
    if (dto.min_age !== undefined) updates.min_age = dto.min_age;

    const { data, error } = await supabase
      .from('activity')
      .update(updates)
      .eq('id', activityId)
      .select(this.activitySelect)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al actualizar la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return this.toActivityDto(data);
  }

  async renew(activityId: number, userId: string): Promise<ActivityDto> {
    const activity = await this.verifyOwnership(activityId, userId);
    const supabase = this.supabaseService.getAdminClient();

    const now = new Date().toISOString();
    const { error: delError } = await supabase
      .from('activity_session')
      .delete()
      .eq('activity_id', activityId)
      .lt('datetime', now);

    if (delError) {
      this.logger.error(`Error deleting past sessions: ${delError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al limpiar las sesiones pasadas',
      );
    }

    await this.createSessionsForActivity(
      activity.id,
      activity.days_of_week,
      activity.starting_hour,
    );

    const { data, error } = await supabase
      .from('activity')
      .select(
        `${this.activitySelect}, sessions:activity_session(*), business(*)`,
      )
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error renewing activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al renovar la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return this.toActivityDto(data);
  }

  async deactivate(activityId: number, userId: string): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.verifyOwnership(activityId, userId);

    const now = new Date().toISOString();

    const { data: sessions, error: sError } = await supabase
      .from('activity_session')
      .select('id')
      .eq('activity_id', activityId)
      .gt('datetime', now);

    if (sError) {
      this.logger.error(`Error finding sessions: ${sError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las sesiones',
      );
    }

    const sessionIds = (sessions ?? []).map((s) => s.id);

    if (sessionIds.length > 0) {
      const { error: cbError } = await supabase
        .from('booking')
        .update({ status: 'CANCELLED' })
        .in('activity_session_id', sessionIds)
        .neq('status', 'CANCELLED');

      if (cbError) {
        this.logger.error(`Error cancelling bookings: ${cbError.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al cancelar las reservas',
        );
      }

      const { error: dsError } = await supabase
        .from('activity_session')
        .delete()
        .in('id', sessionIds);

      if (dsError) {
        this.logger.error(`Error deleting sessions: ${dsError.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al eliminar las sesiones',
        );
      }
    }

    const { data, error } = await supabase
      .from('activity')
      .update({ is_active: false })
      .eq('id', activityId)
      .select(this.activitySelect)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error deactivating activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al desactivar la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return this.toActivityDto(data);
  }

  async delete(activityId: number, userId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    await this.verifyOwnership(activityId, userId);

    const now = new Date().toISOString();

    const { data: sessions, error: sError } = await supabase
      .from('activity_session')
      .select('id, datetime')
      .eq('activity_id', activityId);

    if (sError) {
      this.logger.error(`Error finding sessions: ${sError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las sesiones',
      );
    }

    const upcomingSessionIds = (sessions ?? [])
      .filter((s) => s.datetime > now)
      .map((s) => s.id);

    if (upcomingSessionIds.length > 0) {
      const { error: cbError } = await supabase
        .from('booking')
        .update({ status: 'CANCELLED' })
        .in('activity_session_id', upcomingSessionIds)
        .neq('status', 'CANCELLED');

      if (cbError) {
        this.logger.error(`Error cancelling bookings: ${cbError.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al cancelar las reservas',
        );
      }
    }

    const allSessionIds = (sessions ?? []).map((s) => s.id);

    if (allSessionIds.length > 0) {
      const { error: dsError } = await supabase
        .from('activity_session')
        .delete()
        .in('id', allSessionIds);

      if (dsError) {
        this.logger.error(`Error deleting sessions: ${dsError.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al eliminar las sesiones',
        );
      }
    }

    const { error: daError } = await supabase
      .from('activity')
      .delete()
      .eq('id', activityId);

    if (daError) {
      this.logger.error(`Error deleting activity: ${daError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al eliminar la actividad',
      );
    }
  }

  async activate(activityId: number, userId: string): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const activity = await this.verifyOwnership(activityId, userId);

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('verified')
      .eq('id', activity.business_id)
      .maybeSingle();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar el negocio',
      );
    }
    if (!business) {
      throw new InternalServerErrorException(
        'Error inesperado al verificar el negocio',
      );
    }
    if (!business.verified) {
      throw new BadRequestException(
        'El perfil de negocio debe estar verificado para activar actividades',
      );
    }

    const { data, error } = await supabase
      .from('activity')
      .update({ is_active: true })
      .eq('id', activityId)
      .select(this.activitySelect)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error activating activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al activar la actividad',
      );
    }

    if (!data) {
      throw new NotFoundException('Actividad no encontrada');
    }

    await this.createSessionsForActivity(
      data.id,
      data.days_of_week,
      data.starting_hour,
    );

    return this.toActivityDto(data);
  }

  private async verifyOwnership(
    activityId: number,
    userId: string,
  ): Promise<Activity> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: activity, error } = await supabase
      .from('activity')
      .select('*')
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding activity: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la actividad',
      );
    }

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('app_user_id')
      .eq('id', activity.business_id)
      .maybeSingle();

    if (bError) {
      this.logger.error(
        `Error finding business for ownership check: ${bError.message}`,
      );
      throw new InternalServerErrorException(
        'Error inesperado al verificar el propietario',
      );
    }
    if (!business) {
      throw new InternalServerErrorException(
        'Error inesperado al verificar el propietario',
      );
    }
    if (business.app_user_id !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para modificar esta actividad',
      );
    }

    return activity;
  }

  private async createSessionsForActivity(
    activityId: number,
    daysOfWeek: number[],
    startingHour: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const datetimes = this.generateSessionDates(daysOfWeek, startingHour);

    if (datetimes.length === 0) return;

    const sessions = datetimes.map((datetime) => ({
      activity_id: activityId,
      datetime,
    }));

    const { error } = await supabase.from('activity_session').upsert(sessions, {
      onConflict: 'activity_id,datetime',
      ignoreDuplicates: true,
    });

    if (error) {
      this.logger.error(`Error creating sessions: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al crear las sesiones',
      );
    }
  }

  private generateSessionDates(
    daysOfWeek: number[],
    startingHour: string,
  ): string[] {
    const dates: string[] = [];

    const now = new Date();

    const end = new Date();
    end.setUTCDate(now.getUTCDate() + 90);

    const current = new Date(now);
    current.setUTCHours(0, 0, 0, 0);

    while (current <= end) {
      if (daysOfWeek.includes(current.getUTCDay())) {
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, '0');
        const day = String(current.getUTCDate()).padStart(2, '0');
        const hour = startingHour.substring(0, 5);

        const datetimeStr = `${year}-${month}-${day}T${hour}:00.000Z`;

        const sessionDate = new Date(datetimeStr);

        if (sessionDate > now) {
          dates.push(datetimeStr);
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  private async validateCategory(categoryId: number): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('category')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error validating category: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al validar la categoría',
      );
    }
    if (!data) {
      throw new BadRequestException(
        `La categoría con id ${categoryId} no existe`,
      );
    }
  }

  private toActivityDto(
    activity: ActivityWithCategoryAndSessions,
  ): ActivityDto {
    return {
      id: activity.id,
      business_id: activity.business_id,
      title: activity.title,
      description: activity.description ?? null,
      category_id: activity.category_id,
      category: activity.category
        ? {
            id: activity.category.id,
            name: activity.category.name,
          }
        : undefined,
      location: activity.location ?? null,
      images: activity.images,
      starting_hour: activity.starting_hour,
      meeting_point: activity.meeting_point ?? null,
      latitude: activity.latitude ?? null,
      longitude: activity.longitude ?? null,
      difficulty: activity.difficulty ?? null,
      duration_minutes: activity.duration_minutes ?? null,
      base_price: activity.base_price,
      currency: activity.currency,
      days_of_week: activity.days_of_week,
      min_age: activity.min_age ?? null,
      max_participants: activity.max_participants ?? null,
      is_active: activity.is_active,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      sessions: activity.sessions
        ?.filter((s) => new Date(s.datetime) > new Date())
        .map((s) => ({
        id: s.id,
        datetime: s.datetime,
        booked_spots: s.booked_spots,
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      business: activity.business
        ? {
            id: activity.business.id,
            app_user_id: activity.business.app_user_id,
            business_name: activity.business.business_name,
            description: activity.business.description,
            contact_email: activity.business.contact_email,
            contact_phone: activity.business.contact_phone,
            verified: activity.business.verified,
            created_at: activity.business.created_at,
            updated_at: activity.business.updated_at,
          }
        : undefined,
      reviews: (activity.review ?? []).map((r) => ({
        id: r.id,
        activity_id: r.activity_id,
        business_id: r.business_id,
        app_user_id: r.app_user_id,
        rating: r.rating,
        comment: r.comment ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    };
  }
}
