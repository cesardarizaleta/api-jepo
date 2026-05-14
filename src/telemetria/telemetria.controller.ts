import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';
import { TelemetriaService } from './telemetria.service';

@ApiTags('Telemetria')
@ApiSecurity('x-api-key')
@Controller('telemetria')
export class TelemetriaController {
  constructor(private readonly telemetriaService: TelemetriaService) {}

  @Public()
  @Post('recolectar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recolectar muestras de sensores para dataset HAR',
  })
  @ApiBody({ type: RecolectarTelemetriaDto })
  @ApiOkResponse({
    description: 'Muestras guardadas en dataset_jepo.csv',
    schema: {
      example: {
        success: true,
        message: 'Muestras registradas',
        data: { muestras_escritas: 50 },
      },
    },
  })
  async recolectar(@Body() dto: RecolectarTelemetriaDto) {
    const count = await this.telemetriaService.recolectar(dto);
    return {
      message: 'Muestras registradas',
      data: { muestras_escritas: count },
    };
  }
}
