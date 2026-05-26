import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ActivityDto } from './dto/activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import type { Tables } from '../supabase/database.types';

type Activity = Tables<'activity'>;

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateActivityDto): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('id, verified')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException('Error inesperado al verificar el negocio');
    }
    if (!business) {
      throw new BadRequestException('Necesitás tener un perfil de negocio para crear actividades');
    }
    if (!business.verified) {
      throw new BadRequestException('Tu perfil de negocio debe estar verificado para crear actividades');
    }

    const { data, error } = await supabase
      .from('activity')
      .insert({
        business_id: business.id,
        title: dto.title,
        description: dto.description ?? null,
        category_id: dto.category_id,
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
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error creating activity: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al crear la actividad');
    }

    await this.createSessionsForActivity(data.id, data.days_of_week, data.starting_hour);

    return this.toActivityDto(data);
  }

  async findAllPublic(): Promise<ActivityDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: businesses, error: bError } = await supabase
      .from('business')
      .select('id')
      .eq('verified', true);

    if (bError) {
      this.logger.error(`Error finding verified businesses: ${bError.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener las actividades');
    }

    const ids = (businesses ?? []).map((b) => b.id);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .eq('is_active', true)
      .in('business_id', ids)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding activities: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener las actividades');
    }

    return (data ?? []).map((a) => this.toActivityDto(a));
  }

  async findById(activityId: number): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding activity by id: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener la actividad');
    }
    if (!data) throw new NotFoundException('Actividad no encontrada');

    return this.toActivityDto(data);
  }

  async update(activityId: number, userId: string, dto: UpdateActivityDto): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    await this.verifyOwnership(activityId, userId);

    const updates: Partial<Activity> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.category_id !== undefined) updates.category_id = dto.category_id;
    if (dto.starting_hour !== undefined) updates.starting_hour = dto.starting_hour;
    if (dto.meeting_point !== undefined) updates.meeting_point = dto.meeting_point;
    if (dto.latitude !== undefined) updates.latitude = dto.latitude;
    if (dto.longitude !== undefined) updates.longitude = dto.longitude;
    if (dto.difficulty !== undefined) updates.difficulty = dto.difficulty;
    if (dto.duration_minutes !== undefined) updates.duration_minutes = dto.duration_minutes;
    if (dto.base_price !== undefined) updates.base_price = dto.base_price;
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.days_of_week !== undefined) updates.days_of_week = dto.days_of_week;
    if (dto.min_age !== undefined) updates.min_age = dto.min_age;
    if (dto.max_participants !== undefined) updates.max_participants = dto.max_participants;

    const { data, error } = await supabase
      .from('activity')
      .update(updates)
      .eq('id', activityId)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error updating activity: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar la actividad');
    }

    return this.toActivityDto(data);
  }

  async renew(activityId: number, userId: string): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const activity = await this.verifyOwnership(activityId, userId);

    await this.createSessionsForActivity(activity.id, activity.days_of_week, activity.starting_hour);

    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      this.logger.error(`Error fetching activity after renew: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al renovar la actividad');
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
      throw new InternalServerErrorException('Error inesperado al obtener las sesiones');
    }

    const sessionIds = (sessions ?? []).map((s) => s.id);

    if (sessionIds.length > 0) {
      const { error: cbError } = await supabase
        .from('booking')
        .update({ status: 'CANCELLED' })
        .in('activity_session_id', sessionIds)
        .eq('status', 'PENDING');

      if (cbError) {
        this.logger.error(`Error cancelling bookings: ${cbError.message}`);
        throw new InternalServerErrorException('Error inesperado al cancelar las reservas');
      }

      const { error: dsError } = await supabase
        .from('activity_session')
        .delete()
        .in('id', sessionIds);

      if (dsError) {
        this.logger.error(`Error deleting sessions: ${dsError.message}`);
        throw new InternalServerErrorException('Error inesperado al eliminar las sesiones');
      }
    }

    const { data, error } = await supabase
      .from('activity')
      .update({ is_active: false })
      .eq('id', activityId)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error deactivating activity: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al desactivar la actividad');
    }

    return this.toActivityDto(data);
  }

  async activate(activityId: number, userId: string): Promise<ActivityDto> {
    const supabase = this.supabaseService.getAdminClient();

    const activity = await this.verifyOwnership(activityId, userId);

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('verified')
      .eq('id', activity.business_id)
      .single();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException('Error inesperado al verificar el negocio');
    }
    if (!business.verified) {
      throw new BadRequestException('El perfil de negocio debe estar verificado para activar actividades');
    }

    const { data, error } = await supabase
      .from('activity')
      .update({ is_active: true })
      .eq('id', activityId)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error activating activity: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al activar la actividad');
    }

    await this.createSessionsForActivity(data.id, data.days_of_week, data.starting_hour);

    return this.toActivityDto(data);
  }

  private async verifyOwnership(activityId: number, userId: string): Promise<Activity> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: activity, error } = await supabase
      .from('activity')
      .select('*')
      .eq('id', activityId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding activity: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener la actividad');
    }
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('app_user_id')
      .eq('id', activity.business_id)
      .single();

    if (bError || !business) {
      throw new InternalServerErrorException('Error inesperado al verificar el propietario');
    }
    if (business.app_user_id !== userId) {
      throw new ForbiddenException('No tenés permiso para modificar esta actividad');
    }

    return activity;
  }

  private async createSessionsForActivity(
    activityId: number,
    daysOfWeek: number[],
    startingHour: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const dates = this.generateSessionDates(daysOfWeek, startingHour);
    if (dates.length === 0) return;

    const sessions = dates.map((date) => ({
      activity_id: activityId,
      datetime: date.toISOString(),
    }));

    const { error } = await supabase
      .from('activity_session')
      .upsert(sessions, { onConflict: 'activity_id,datetime', ignoreDuplicates: true });

    if (error) {
      this.logger.error(`Error creating sessions: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al crear las sesiones');
    }
  }

  private generateSessionDates(daysOfWeek: number[], startingHour: string): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 30);

    const [hours, minutes] = startingHour.split(':').map(Number);

    const current = new Date(now);
    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (daysOfWeek.includes(current.getDay())) {
        const sessionDate = new Date(current);
        sessionDate.setHours(hours, minutes, 0, 0);
        if (sessionDate > now) {
          dates.push(sessionDate);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private toActivityDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      business_id: activity.business_id,
      title: activity.title,
      description: activity.description ?? null,
      category_id: activity.category_id,
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
    };
  }
}
