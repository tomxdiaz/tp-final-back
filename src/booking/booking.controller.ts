import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { BookingDto } from './dto/booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('booking')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('my')
  @ApiOperation({ summary: 'Obtener mis reservas como usuario' })
  @ApiOkResponse({ type: [BookingDto] })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async getMyBookings(@CurrentAppUser appUser: AppUser): Promise<BookingDto[]> {
    return await this.bookingService.getMyBookings(appUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una reserva propia por ID' })
  @ApiOkResponse({ type: BookingDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la reserva' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async getMyBookingById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<BookingDto> {
    return await this.bookingService.getMyBookingById(id, appUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una reserva' })
  @ApiCreatedResponse({ type: BookingDto })
  @ApiBadRequestResponse({ description: 'Sesión no disponible o sin lugares' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingDto> {
    return await this.bookingService.create(appUser.id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar una reserva (solo el dueño del negocio)' })
  @ApiOkResponse({ type: BookingDto })
  @ApiBadRequestResponse({ description: 'La reserva ya está confirmada o está cancelada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño del negocio de la actividad' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<BookingDto> {
    return await this.bookingService.confirm(id, appUser.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una reserva (solo el dueño)' })
  @ApiOkResponse({ type: BookingDto })
  @ApiBadRequestResponse({ description: 'La reserva ya está cancelada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la reserva' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<BookingDto> {
    return await this.bookingService.cancel(id, appUser.id);
  }
}
