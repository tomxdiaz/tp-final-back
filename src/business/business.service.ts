import {
  ConflictException,
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
        throw new ConflictException('Ya existe un perfil de negocio para este usuario');
      }
      throw new InternalServerErrorException('Error inesperado al crear el perfil de negocio');
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
      throw new InternalServerErrorException('Error inesperado al obtener el perfil de negocio');
    }

    if (!data) throw new NotFoundException('Perfil de negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async updateMyProfile(userId: string, dto: UpdateBusinessDto): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: Partial<Business> = {};
    if (dto.business_name !== undefined) updates.business_name = dto.business_name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.contact_email !== undefined) updates.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) updates.contact_phone = dto.contact_phone;

    const { data, error } = await supabase
      .from('business')
      .update(updates)
      .eq('app_user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating business: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar el perfil de negocio');
    }

    if (!data) throw new NotFoundException('Perfil de negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async findPublicById(businessId: string): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('business')
      .select('*')
      .eq('id', businessId)
      .eq('verified', true)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding business by id: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener el negocio');
    }

    if (!data) throw new NotFoundException('Negocio no encontrado');

    return this.toBusinessDto(data);
  }

  async verifyBusiness(businessId: string): Promise<BusinessDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: Partial<Business> = {};
    updates.verified = true;

    const { data, error } = await supabase
      .from('business')
      .update(updates)
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error verifying business: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al verificar el negocio');
    }

    if (!data) throw new NotFoundException('Negocio no encontrado');

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
