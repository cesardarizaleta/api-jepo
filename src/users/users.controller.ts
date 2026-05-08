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
import {
<<<<<<< HEAD
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
=======
  ApiBody,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiSecurity('x-api-key')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Crear usuario' })
  @ApiCreatedResponse({
    description: 'Usuario creado',
    schema: {
      example: {
        success: true,
        message: 'Usuario creado',
        data: {
          id: 1,
          cedula: 12123456,
          nombre: 'Maria',
          apellido: 'Perez',
          email: 'maria.perez@jepo.com',
          telefono: '+584121112233',
          token_fcm: null,
        },
      },
    },
  })
  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'Usuario creado' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { message: 'Usuario creado', data: user };
  }

  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({
    description: 'Usuarios obtenidos',
    schema: {
      example: {
        success: true,
        message: 'Usuarios obtenidos',
        data: [
          {
            id: 1,
            cedula: 12123456,
            nombre: 'Maria',
            apellido: 'Perez',
            email: 'maria.perez@jepo.com',
            telefono: '+584121112233',
          },
        ],
      },
    },
  })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { message: 'Usuarios obtenidos', data: users };
  }

  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Usuario obtenido',
    schema: {
      example: {
        success: true,
        message: 'Usuario obtenido',
        data: {
          id: 1,
          cedula: 12123456,
          nombre: 'Maria',
          apellido: 'Perez',
          email: 'maria.perez@jepo.com',
          telefono: '+584121112233',
          token_fcm: 'fcm_token_ABC123XYZ',
        },
      },
    },
  })
  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Usuario obtenido' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return { message: 'Usuario obtenido', data: user };
  }

  @ApiOperation({ summary: 'Actualizar usuario por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Usuario actualizado',
    schema: {
      example: {
        success: true,
        message: 'Usuario actualizado',
        data: {
          id: 1,
          cedula: 12123456,
          nombre: 'Maria Elena',
          apellido: 'Perez',
          email: 'maria.actualizada@jepo.com',
          telefono: '+584241112233',
        },
      },
    },
  })
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuario actualizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return { message: 'Usuario actualizado', data: user };
  }

  @ApiOperation({ summary: 'Actualizar token FCM de usuario' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Token FCM actualizado',
    schema: {
      example: {
        success: true,
        message: 'Token FCM actualizado',
        data: {
          id: 1,
          token_fcm: 'fcm_token_movil_usuario_001',
        },
      },
    },
  })
  @Patch(':id/token-fcm')
  @ApiOperation({ summary: 'Actualizar token FCM del usuario' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateTokenDto })
  @ApiOkResponse({ description: 'Token FCM actualizado' })
  async updateToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTokenDto: UpdateTokenDto,
  ) {
    const user = await this.usersService.updateToken(id, updateTokenDto);
    return { message: 'Token FCM actualizado', data: user };
  }

  @ApiOperation({ summary: 'Eliminar usuario por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Usuario eliminado',
    schema: {
      example: {
        success: true,
        message: 'Usuario eliminado',
        data: null,
      },
    },
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Usuario eliminado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado', data: null };
  }
}
