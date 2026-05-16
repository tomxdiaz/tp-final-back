import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import type { Tables } from '../supabase/database.types';

type Provider = Tables<'provider'>;

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateProviderDto): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
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
      this.logger.error(`Error creating provider: ${error.message}`);
      if (error.code === '23505') {
        throw new ConflictException('Ya existe un perfil de provider para este usuario');
      }
      throw new InternalServerErrorException('Error inesperado al crear el perfil de provider');
    }

    return this.toProviderDto(data);
  }

  async findMyProfile(userId: string): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
      .select('*')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding provider: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener el perfil de provider');
    }

    if (!data) throw new NotFoundException('Perfil de provider no encontrado');

    return this.toProviderDto(data);
  }

  async updateMyProfile(userId: string, dto: UpdateProviderDto): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: Partial<Provider> = {};
    if (dto.business_name !== undefined) updates.business_name = dto.business_name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.contact_email !== undefined) updates.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) updates.contact_phone = dto.contact_phone;

    const { data, error } = await supabase
      .from('provider')
      .update(updates)
      .eq('app_user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating provider: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar el perfil de provider');
    }

    if (!data) throw new NotFoundException('Perfil de provider no encontrado');

    return this.toProviderDto(data);
  }

  async findPublicById(providerId: string): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
      .select('*')
      .eq('id', providerId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding provider by id: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener el provider');
    }

    if (!data) throw new NotFoundException('Provider no encontrado');

    return this.toProviderDto(data);
  }

  private toProviderDto(provider: Provider): ProviderDto {
    return {
      id: provider.id,
      app_user_id: provider.app_user_id,
      business_name: provider.business_name,
      description: provider.description ?? null,
      contact_email: provider.contact_email ?? null,
      contact_phone: provider.contact_phone ?? null,
      verified: provider.verified,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
    };
  }
}
