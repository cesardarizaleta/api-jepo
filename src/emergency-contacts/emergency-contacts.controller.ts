import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { VerifyEmergencyContactDto } from './dto/verify-emergency-contact.dto';
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

  @ApiOperation({
    summary:
      'Crear contacto de emergencia (PENDING + envia OTP al contacto por WhatsApp)',
  })
  @ApiCreatedResponse({ description: 'Contacto creado en estado PENDING' })
  @Post()
  @ApiBody({ type: CreateEmergencyContactDto })
  async create(
    @Req() request: RequestWithUser,
    @Body() createContactDto: CreateEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.create(
      request.user.sub,
      createContactDto,
      {
        ip: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
      },
    );
    return { message: 'Contacto de emergencia creado', data: contact };
  }

  @ApiOperation({
    summary: 'Listar contactos de emergencia del usuario autenticado',
  })
  @ApiOkResponse({ description: 'Contactos obtenidos' })
  @Get()
  async findAll(@Req() request: RequestWithUser) {
    const contacts = await this.emergencyContactsService.findAllByUser(
      request.user.sub,
    );
    return { message: 'Contactos obtenidos', data: contacts };
  }

  @ApiOperation({ summary: 'Obtener contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({ description: 'Contacto obtenido' })
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

  @ApiOperation({ summary: 'Actualizar contacto de emergencia por ID' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({ description: 'Contacto actualizado' })
  @Patch(':id')
  @ApiBody({ type: UpdateEmergencyContactDto })
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
  @ApiOkResponse({ description: 'Contacto eliminado' })
  @Delete(':id')
  async remove(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.emergencyContactsService.remove(request.user.sub, id);
    return { message: 'Contacto eliminado', data: null };
  }

  @ApiOperation({
    summary: 'Verificar contacto de emergencia usando el OTP',
  })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({ description: 'Contacto verificado' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':id/verificar')
  @ApiBody({ type: VerifyEmergencyContactDto })
  async verify(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsService.verify(
      request.user.sub,
      id,
      dto.codigo,
    );
    return { message: 'Contacto verificado', data: contact };
  }

  @ApiOperation({
    summary: 'Reenviar codigo OTP al contacto de emergencia (cooldown 60s)',
  })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiOkResponse({ description: 'Codigo reenviado' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':id/reenviar-codigo')
  async resend(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.emergencyContactsService.resendVerification(
      request.user.sub,
      id,
      {
        ip: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
      },
    );
    return { message: result.message, data: null };
  }
}
