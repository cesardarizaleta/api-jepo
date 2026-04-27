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
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { EmergencyContactsService } from './emergency-contacts.service';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@ApiTags('Contactos de emergencia')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('usuarios/contactos')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear contacto de emergencia del usuario autenticado' })
  @ApiBody({ type: CreateEmergencyContactDto })
  @ApiOkResponse({ description: 'Contacto de emergencia creado' })
  async create(
    @Req() request: RequestWithUser,
    @Body() createContactDto: CreateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.create(
      request.user.sub,
      createContactDto,
    );
    return { message: 'Contacto de emergencia creado', data: contact };
  }

  @Get()
  @ApiOperation({ summary: 'Listar contactos de emergencia del usuario autenticado' })
  @ApiOkResponse({ description: 'Contactos obtenidos' })
  async findAll(@Req() request: RequestWithUser) {
    const contacts =
      await this.emergencyContactsService.findAllByUser(request.user.sub);
    return { message: 'Contactos obtenidos', data: contacts };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Contacto obtenido' })
  async findOne(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const contact = await this.emergencyContactsService.findOneByUser(
      request.user.sub,
      id,
    );
    return { message: 'Contacto obtenido', data: contact };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateEmergencyContactDto })
  @ApiOkResponse({ description: 'Contacto actualizado' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.update(
      request.user.sub,
      id,
      updateContactDto,
    );
    return { message: 'Contacto actualizado', data: contact };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar contacto de emergencia por ID (soft delete)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Contacto eliminado' })
  async remove(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.emergencyContactsService.remove(request.user.sub, id);
    return { message: 'Contacto eliminado', data: null };
  }
}
