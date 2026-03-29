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

@UseGuards(JwtAuthGuard)
@Controller('usuarios/contactos')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Post()
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
  async findAll(@Req() request: RequestWithUser) {
    const contacts =
      await this.emergencyContactsService.findAllByUser(request.user.sub);
    return { message: 'Contactos obtenidos', data: contacts };
  }

  @Get(':id')
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
  async remove(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.emergencyContactsService.remove(request.user.sub, id);
    return { message: 'Contacto eliminado', data: null };
  }
}
