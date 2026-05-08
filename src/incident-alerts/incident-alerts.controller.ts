import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateIncidentAlertDto } from './dto/create-incident-alert.dto';
import { UpdateIncidentAlertDto } from './dto/update-incident-alert.dto';
import { IncidentAlertsService } from './incident-alerts.service';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@ApiTags('Alertas de incidentes')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('alertas')
export class IncidentAlertsController {
  constructor(private readonly incidentAlertsService: IncidentAlertsService) {}

  @ApiOperation({
    summary: 'Crear alerta de incidente del usuario autenticado',
  })
  @ApiCreatedResponse({
    description: 'Alerta creada',
    schema: {
      example: {
        success: true,
        message: 'Alerta creada',
        data: {
          alerta: {
            id: 100,
            id_usuario: 1,
            latitud: 10.50234567,
            longitud: -66.91234567,
            url_audio_contexto:
              'https://storage.jepo.com/audio/contexto-123.mp3',
            fecha_hora: '2026-05-08T10:30:00.000Z',
            es_proactiva: true,
          },
          contactosNotificar: [
            {
              id: 10,
              nombre_contacto: 'Juan Lopez',
              telefono_contacto: '+584141234567',
              prioridad: 1,
            },
          ],
          notificaciones: [
            {
              contactoId: 10,
              enviado: true,
              detalle: 'Mensaje enviado por Evolution API',
            },
          ],
        },
      },
    },
  })
  @Post()
  @ApiBody({ type: CreateIncidentAlertDto })
  @ApiOkResponse({ description: 'Alerta creada' })
  async create(
    @Req() request: RequestWithUser,
    @Body() createAlertDto: CreateIncidentAlertDto,
  ) {
    const result = await this.incidentAlertsService.create(
      request.user.sub,
      createAlertDto,
    );
    return {
      message: 'Alerta creada',
      data: {
        alerta: result.alerta,
        contactosNotificar: result.contactosNotificar,
        notificaciones: result.notificaciones,
      },
    };
  }

  @ApiOperation({ summary: 'Listar alertas del usuario autenticado' })
  @ApiOkResponse({
    description: 'Alertas obtenidas',
    schema: {
      example: {
        success: true,
        message: 'Alertas obtenidas',
        data: [
          {
            id: 100,
            id_usuario: 1,
            latitud: 10.50234567,
            longitud: -66.91234567,
            url_audio_contexto:
              'https://storage.jepo.com/audio/contexto-123.mp3',
            fecha_hora: '2026-05-08T10:30:00.000Z',
            es_proactiva: true,
          },
        ],
      },
    },
  })
  @Get()
  @ApiOkResponse({ description: 'Alertas obtenidas' })
  async findAll(@Req() request: RequestWithUser) {
    const alerts = await this.incidentAlertsService.findAllByUser(
      request.user.sub,
    );
    return { message: 'Alertas obtenidas', data: alerts };
  }

  @ApiOperation({ summary: 'Obtener alerta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 100 })
  @ApiOkResponse({
    description: 'Alerta obtenida',
    schema: {
      example: {
        success: true,
        message: 'Alerta obtenida',
        data: {
          id: 100,
          id_usuario: 1,
          latitud: 10.50234567,
          longitud: -66.91234567,
          url_audio_contexto: 'https://storage.jepo.com/audio/contexto-123.mp3',
          fecha_hora: '2026-05-08T10:30:00.000Z',
          es_proactiva: true,
        },
      },
    },
  })
  @Get(':id')
  @ApiOperation({ summary: 'Obtener alerta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Alerta obtenida' })
  async findOne(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const alert = await this.incidentAlertsService.findOneByUser(
      request.user.sub,
      id,
    );
    return { message: 'Alerta obtenida', data: alert };
  }

  @ApiOperation({ summary: 'Actualizar alerta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 100 })
  @ApiOkResponse({
    description: 'Alerta actualizada',
    schema: {
      example: {
        success: true,
        message: 'Alerta actualizada',
        data: {
          id: 100,
          id_usuario: 1,
          latitud: 10.5,
          longitud: -66.9,
          url_audio_contexto:
            'https://storage.jepo.com/audio/contexto-actualizado.mp3',
          fecha_hora: '2026-05-08T11:05:00.000Z',
          es_proactiva: false,
        },
      },
    },
  })
  @Patch(':id')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateIncidentAlertDto })
  @ApiOkResponse({ description: 'Alerta actualizada' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlertDto: UpdateIncidentAlertDto,
  ) {
    const alert = await this.incidentAlertsService.update(
      request.user.sub,
      id,
      updateAlertDto,
    );
    return { message: 'Alerta actualizada', data: alert };
  }

  @ApiOperation({ summary: 'Eliminar alerta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 100 })
  @ApiOkResponse({
    description: 'Alerta eliminada',
    schema: {
      example: {
        success: true,
        message: 'Alerta eliminada',
        data: null,
      },
    },
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar alerta por ID (soft delete)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Alerta eliminada' })
  async remove(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.incidentAlertsService.remove(request.user.sub, id);
    return { message: 'Alerta eliminada', data: null };
  }
}
