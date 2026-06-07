import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Minimal shape of a file received via multer (memory storage).
 * Declared locally to avoid depending on @types/multer.
 */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
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

  /**
   * Uploads image files to the given storage bucket and returns their public URLs.
   * Uses the admin (service role) client, so storage RLS is bypassed.
   */
  async uploadImages(
    files: UploadedImage[],
    folder: string,
    bucket = 'activity-images',
  ): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const storage = this.adminClient.storage.from(bucket);
    const urls: string[] = [];

    for (const file of files) {
      const ext = this.resolveExtension(file);
      const path = `${folder}/${randomUUID()}${ext}`;

      const { error } = await storage.upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

      if (error) {
        this.logger.error(`Error uploading image to storage: ${error.message}`);
        throw new InternalServerErrorException(
          'Error inesperado al subir las imágenes',
        );
      }

      const { data } = storage.getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  private resolveExtension(file: UploadedImage): string {
    const fromName = file.originalname?.includes('.')
      ? `.${file.originalname.split('.').pop()!.toLowerCase()}`
      : '';
    if (fromName) return fromName;

    const fromMime = file.mimetype?.split('/').pop();
    return fromMime ? `.${fromMime}` : '';
  }
}
