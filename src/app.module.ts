import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AppUserModule } from './app_user/app_user.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { ActivityModule } from './activity/activity.module';
import { BookingModule } from './booking/booking.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.ENV_FILE || `.env.${process.env.NODE_ENV || 'dev'}`,
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
    }),
    SupabaseModule,
    HealthModule,
    AuthModule,
    AppUserModule,
    NewsletterModule,
    BusinessModule,
    AdminModule,
    ActivityModule,
    BookingModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
