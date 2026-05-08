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
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { EmergencyContactsService } from './emergency-contacts.service';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@ApiTags('Contactos de Emergencia')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('usuarios/contactos')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @ApiOperation({ summary: 'Crear contacto de emergencia del usuario autenticado' })
  @ApiCreatedResponse({
    description: 'Contacto de emergencia creado',
    schema: {
      example: {
        success: true,
        message: 'Contacto de emergencia creado',
        data: {
          id: 10,
          id_usuario: 1,
          nombre_contacto: 'Juan Lopez',
          telefono_contacto: '+584141234567',
          prioridad: 1,
        },
      },
    },
  })
  @Post()
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

  @ApiOperation({ summary: 'Listar contactos de emergencia del usuario autenticado' })
  @ApiOkResponse({
    description: 'Contactos obtenidos',
    schema: {
      example: {
        success: true,
        message: 'Contactos obtenidos',
        data: [
          {
            id: 10,
            id_usuario: 1,
            nombre_contacto: 'Juan Lopez',
            telefono_contacto: '+584141234567',
            prioridad: 1,
          },
        ],
      },
    },
  })
  @Get()
  @ApiOkResponse({ description: 'Contactos obtenidos' })
  async findAll(@Req() request: RequestWithUser) {
    const contacts =
      await this.emergencyContactsService.findAllByUser(request.user.sub);
    return { message: 'Contactos obtenidos', data: contacts };
  }

  @ApiOperation({ summary: 'Obtener contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Contacto obtenido',
    schema: {
      example: {
        success: true,
        message: 'Contacto obtenido',
        data: {
          id: 10,
          id_usuario: 1,
          nombre_contacto: 'Juan Lopez',
          telefono_contacto: '+584141234567',
          prioridad: 1,
        },
      },
    },
  })
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

  @ApiOperation({ summary: 'Actualizar contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Contacto actualizado',
    schema: {
      example: {
        success: true,
        message: 'Contacto actualizado',
        data: {
          id: 10,
          id_usuario: 1,
          nombre_contacto: 'Carlos Romero',
          telefono_contacto: '+584121998877',
          prioridad: 2,
        },
      },
    },
  })
  @Patch(':id')
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

  @ApiOperation({ summary: 'Eliminar contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Contacto eliminado',
    schema: {
      example: {
        success: true,
        message: 'Contacto eliminado',
        data: null,
      },
    },
  })
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
