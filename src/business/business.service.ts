import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BusinessDto } from './dto/business.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import type { Tables } from '../supabase/database.types';

type Business = Tables<'business'>;

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateBusinessDto): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .insert({
        app_user_id: userId,
        business_name: dto.business_name,
        description: dto.description ?? null,
        contact_email: dto.contact_email ?? null,
        contact_phone: dto.contact_phone ?? null,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error creating business: ${error.message}`);
      if (error.code === '23505') {
        throw new ConflictException(
          'Ya existe un perfil de negocio para este usuario',
        );
      }
      throw new InternalServerErrorException(
        'Error inesperado al crear el perfil de negocio',
      );
    }

    return this.toBusinessDto(data);
  }

  async findMyProfile(userId: string): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .select('*')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding business: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener el perfil de negocio',
      );
    }

    if (!data) throw new NotFoundException('Perfil de negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateBusinessDto,
  ): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: Partial<Business> = {};
    if (dto.business_name !== undefined)
      updates.business_name = dto.business_name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.contact_email !== undefined)
      updates.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined)
      updates.contact_phone = dto.contact_phone;

    const { data, error } = await supabase
      .from('business')
      .update(updates)
      .eq('app_user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating business: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al actualizar el perfil de negocio',
      );
    }

    if (!data) throw new NotFoundException('Perfil de negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async findAll(): Promise<BusinessDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .select('*')
      .eq('verified', true)
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding all businesses: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener los negocios',
      );
    }

    return (data ?? []).map((b) => this.toBusinessDto(b));
  }

  async findAllAdmin(): Promise<BusinessDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding all businesses (admin): ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener los negocios',
      );
    }

    return (data ?? []).map((b) => this.toBusinessDto(b));
  }

  async findPublicById(businessId: number): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .select('*')
      .eq('id', businessId)
      .eq('verified', true)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding business by id: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener el negocio',
      );
    }

    if (!data) throw new NotFoundException('Negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async verifyBusiness(businessId: number): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .update({ verified: true })
      .eq('id', businessId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error verifying business: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al verificar el negocio',
      );
    }

    if (!data) throw new NotFoundException('Negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async deactivateBusiness(businessId: number): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: business, error: bError } = await supabase
      .from('business')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (bError) {
      this.logger.error(`Error finding business: ${bError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener el negocio',
      );
    }
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const { data: activities, error: aError } = await supabase
      .from('activity')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (aError) {
      this.logger.error(`Error finding activities: ${aError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las actividades',
      );
    }

    const activityIds = (activities ?? []).map((a) => a.id);

    if (activityIds.length > 0) {
      const now = new Date().toISOString();

      const { data: sessions, error: sError } = await supabase
        .from('activity_session')
        .select('id')
        .in('activity_id', activityIds)
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
          .eq('status', 'PENDING');

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

      const { error: daError } = await supabase
        .from('activity')
        .update({ is_active: false })
        .in('id', activityIds);

      if (daError) {
        this.logger.error(`Error deactivating activities: ${daError.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al desactivar las actividades',
        );
      }
    }

    const { data, error } = await supabase
      .from('business')
      .update({ verified: false })
      .eq('id', businessId)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error deactivating business: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al desactivar el negocio',
      );
    }

    return this.toBusinessDto(data);
  }

  private toBusinessDto(business: Business): BusinessDto {
    return {
      id: business.id,
      app_user_id: business.app_user_id,
      business_name: business.business_name,
      description: business.description ?? null,
      contact_email: business.contact_email ?? null,
      contact_phone: business.contact_phone ?? null,
      verified: business.verified,
      created_at: business.created_at,
      updated_at: business.updated_at,
    };
  }
}
