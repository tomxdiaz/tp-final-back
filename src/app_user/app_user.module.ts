import { Module } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserController } from './app_user.controller';
import { AppUserAdminController } from './app_user-admin.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AppUserController, AppUserAdminController],
  providers: [AppUserService],
  exports: [AppUserService],
})
export class AppUserModule {}
