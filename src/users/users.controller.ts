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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { message: 'Usuario creado', data: user };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { message: 'Usuarios obtenidos', data: users };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return { message: 'Usuario obtenido', data: user };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return { message: 'Usuario actualizado', data: user };
  }

  @Patch(':id/token-fcm')
  async updateToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTokenDto: UpdateTokenDto,
  ) {
    const user = await this.usersService.updateToken(id, updateTokenDto);
    return { message: 'Token FCM actualizado', data: user };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado', data: null };
  }
}
