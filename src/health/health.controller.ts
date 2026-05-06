import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar el estado de la aplicación' })
  @ApiResponse({ status: 200, description: 'La aplicación está saludable.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  health(): {
    status: string;
    timestamp: string;
    env: string;
  } {
    return this.healthService.health();
  }
}
