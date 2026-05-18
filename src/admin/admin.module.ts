import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AppUserModule } from '../app_user/app_user.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [SupabaseModule, AuthModule, AppUserModule, BusinessModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
