import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';
import { TelemetriaService } from './telemetria.service';

type RequestWithUser = Request & {
  user: { sub: number; email: string };
};

@ApiTags('Telemetria')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@SkipThrottle()
@UseGuards(JwtAuthGuard)
@Controller('telemetria')
export class TelemetriaController {
  constructor(private readonly telemetriaService: TelemetriaService) {}

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
          archivo: 'dataset-caida-5-1778787715004.csv',
        },
      },
    },
  })
  async recolectar(
    @Body() dto: RecolectarTelemetriaDto,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.telemetriaService.recolectar(dto, req.user.sub);
    return {
      message: 'Muestras registradas',
      data: result,
    };
  }
}
