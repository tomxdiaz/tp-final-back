import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AppUserModule } from './app_user/app_user.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
