import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { OptionalSupabaseAuthGuard } from './guards/optional-supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard, OptionalSupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, OptionalSupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
