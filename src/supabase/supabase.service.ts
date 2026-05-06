import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

@Injectable()
export class SupabaseService {
  private readonly client: ReturnType<typeof createClient<Database>>;
  private readonly adminClient: ReturnType<typeof createClient<Database>>;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SECRET_KEY',
    );

    const commonOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    };

    this.client = createClient<Database>(url, anonKey, commonOptions);
    this.adminClient = createClient<Database>(
      url,
      serviceRoleKey,
      commonOptions,
    );
  }

  getClient() {
    return this.client;
  }

  getAdminClient() {
    return this.adminClient;
  }
}
