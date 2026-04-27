import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@ApiSecurity('x-api-key')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiOkResponse({
    description: 'Servicio disponible',
    schema: {
      example: {
        success: true,
        message: 'Operacion exitosa',
        data: {
          status: 'ok',
          service: 'api-jepo',
          timestamp: '2026-04-26T12:00:00.000Z',
        },
      },
    },
  })
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
