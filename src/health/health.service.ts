import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'No env NODE_ENV variable set',
    };
  }
}
