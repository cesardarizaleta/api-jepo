import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FamilyMapService } from './family-map.service';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@ApiTags('Mapa Familiar')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('mapa')
export class FamilyMapController {
  constructor(private readonly familyMapService: FamilyMapService) {}

  @ApiOperation({
    summary:
      'Listar usuarios que tienen al usuario autenticado como contacto de emergencia VERIFIED (grafo de monitoreo)',
  })
  @ApiOkResponse({
    description: 'Usuarios monitoreados',
    schema: {
      example: {
        success: true,
        message: 'Usuarios monitoreados obtenidos',
        data: [
          {
            id: 5,
            nombre: 'Maria',
            apellido: 'Perez',
            telefono: '+584121112233',
            ultima_latitud: 10.50234567,
            ultima_longitud: -66.91234567,
            fecha_ultima_ubicacion: '2026-05-13T14:30:00.000Z',
            tiene_alerta_activa: true,
            prioridad_en_su_lista: 1,
          },
        ],
      },
    },
  })
  @Get('monitoreados')
  async getMonitored(@Req() request: RequestWithUser) {
    const monitored = await this.familyMapService.getMonitoredUsers(
      request.user.sub,
    );
    return { message: 'Usuarios monitoreados obtenidos', data: monitored };
  }
}
