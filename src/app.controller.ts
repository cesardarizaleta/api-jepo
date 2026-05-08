import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@ApiSecurity('x-api-key')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verificar estado de la API' })
  @ApiOkResponse({
    description: 'Estado general del servicio',
    schema: {
      example: {
        success: true,
        message: 'Operacion exitosa',
        data: {
          status: 'ok',
          service: 'api-jepo',
          timestamp: '2026-05-08T14:00:00.000Z',
        },
      },
    },
  })
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
