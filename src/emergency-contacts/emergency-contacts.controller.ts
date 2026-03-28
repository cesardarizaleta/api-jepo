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
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { EmergencyContactsService } from './emergency-contacts.service';

@Controller('usuarios/:idUsuario/contactos')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Post()
  async create(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Body() createContactDto: CreateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.create(
      idUsuario,
      createContactDto,
    );
    return { message: 'Contacto de emergencia creado', data: contact };
  }

  @Get()
  async findAll(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    const contacts =
      await this.emergencyContactsService.findAllByUser(idUsuario);
    return { message: 'Contactos obtenidos', data: contacts };
  }

  @Get(':id')
  async findOne(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const contact = await this.emergencyContactsService.findOneByUser(
      idUsuario,
      id,
    );
    return { message: 'Contacto obtenido', data: contact };
  }

  @Patch(':id')
  async update(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.update(
      idUsuario,
      id,
      updateContactDto,
    );
    return { message: 'Contacto actualizado', data: contact };
  }

  @Delete(':id')
  async remove(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.emergencyContactsService.remove(idUsuario, id);
    return { message: 'Contacto eliminado', data: null };
  }
}
