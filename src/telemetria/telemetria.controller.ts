import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';
import { TelemetriaService } from './telemetria.service';

@ApiTags('Telemetria')
@ApiSecurity('x-api-key')
@SkipThrottle()
@Controller('telemetria')
export class TelemetriaController {
  constructor(private readonly telemetriaService: TelemetriaService) {}

  @Public()
  @Post('recolectar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recolectar muestras de sensores y subir dataset a MinIO',
  })
  @ApiBody({ type: RecolectarTelemetriaDto })
  @ApiOkResponse({
    description: 'Muestras subidas al bucket de MinIO',
    schema: {
      example: {
        success: true,
        message: 'Muestras registradas',
        data: {
          muestras_escritas: 50,
          archivo: 'dataset-caida-JesusAraujo-1778787715004.csv',
        },
      },
    },
  })
  async recolectar(@Body() dto: RecolectarTelemetriaDto) {
    const result = await this.telemetriaService.recolectar(dto);
    return {
      message: 'Muestras registradas',
      data: result,
    };
  }
}
