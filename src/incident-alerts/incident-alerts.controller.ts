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

  @Post()
  @ApiOperation({
    summary: 'Crear alerta de incidente',
    description:
      'Cuando es_proactiva=true, retorna contactosNotificar y dispara notificaciones en background.',
  })
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

  @Get()
  @ApiOperation({ summary: 'Listar alertas del usuario autenticado' })
  @ApiOkResponse({ description: 'Alertas obtenidas' })
  async findAll(@Req() request: RequestWithUser) {
    const alerts = await this.incidentAlertsService.findAllByUser(
      request.user.sub,
    );
    return { message: 'Alertas obtenidas', data: alerts };
  }

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

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar alerta por ID' })
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
