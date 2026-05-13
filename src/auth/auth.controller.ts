import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type RequestWithUser = Request & {
  user: {
    sub: number;
    email: string;
  };
};

@ApiTags('Auth')
@ApiSecurity('x-api-key')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Registrar usuario y generar token JWT' })
  @ApiCreatedResponse({ description: 'Registro exitoso' })
  @Post('register')
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return { message: 'Registro exitoso', data: result };
  }

  @Public()
  @ApiOperation({ summary: 'Iniciar sesion y obtener token JWT' })
  @ApiOkResponse({ description: 'Login exitoso' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return { message: 'Login exitoso', data: result };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar codigo OTP para recuperar contrasena',
  })
  @ApiOkResponse({
    description: 'Respuesta generica (anti-enumeracion)',
    schema: {
      example: {
        success: true,
        message: 'Si la cuenta existe, recibiras un codigo de verificacion',
        data: null,
      },
    },
  })
  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    const result = await this.authService.forgotPassword(dto, {
      ip: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    });
    return { message: result.message, data: null };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contrasena validando el codigo OTP' })
  @ApiOkResponse({ description: 'Contrasena actualizada' })
  @ApiUnauthorizedResponse({ description: 'Codigo invalido o expirado' })
  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return { message: result.message, data: null };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiOkResponse({ description: 'Sesion valida' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido o expirado',
  })
  @Get('me')
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findOne(request.user.sub);
    return { message: 'Sesion valida', data: user };
  }
}
