import {
  Body,
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Registro exitoso',
      data: result,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login exitoso',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findOne(request.user.sub);
    return {
      message: 'Sesion valida',
      data: user,
    };
  }
}
