import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateIncidentAlertDto } from './dto/create-incident-alert.dto';
import { UpdateIncidentAlertDto } from './dto/update-incident-alert.dto';
import { IncidentAlertsService } from './incident-alerts.service';

@Controller('alertas')
export class IncidentAlertsController {
  constructor(private readonly incidentAlertsService: IncidentAlertsService) {}

  @Post()
  async create(@Body() createAlertDto: CreateIncidentAlertDto) {
    const result = await this.incidentAlertsService.create(createAlertDto);
    return {
      message: 'Alerta creada',
      data: {
        alerta: result.alerta,
        contactosNotificar: result.contactosNotificar,
      },
    };
  }

  @Get()
  async findAll() {
    const alerts = await this.incidentAlertsService.findAll();
    return { message: 'Alertas obtenidas', data: alerts };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const alert = await this.incidentAlertsService.findOne(id);
    return { message: 'Alerta obtenida', data: alert };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlertDto: UpdateIncidentAlertDto,
  ) {
    const alert = await this.incidentAlertsService.update(id, updateAlertDto);
    return { message: 'Alerta actualizada', data: alert };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.incidentAlertsService.remove(id);
    return { message: 'Alerta eliminada', data: null };
  }
}
