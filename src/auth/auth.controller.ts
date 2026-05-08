import { Body, Controller, Get, Req, UseGuards, Post } from '@nestjs/common';
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
  @ApiCreatedResponse({
    description: 'Registro exitoso',
    schema: {
      example: {
        success: true,
        message: 'Registro exitoso',
        data: {
          access_token: '<jwt_token>',
          user: {
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
    },
  })
  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ description: 'Registro exitoso' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Registro exitoso',
      data: result,
    };
  }

  @Public()
  @ApiOperation({ summary: 'Iniciar sesion y obtener token JWT' })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      example: {
        success: true,
        message: 'Login exitoso',
        data: {
          access_token: '<jwt_token>',
          user: {
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
    },
  })
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login exitoso' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login exitoso',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiOkResponse({
    description: 'Sesion valida',
    schema: {
      example: {
        success: true,
        message: 'Sesion valida',
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
  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obtener sesion actual' })
  @ApiOkResponse({ description: 'Sesion valida' })
  @ApiUnauthorizedResponse({ description: 'Token ausente, invalido o expirado' })
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findOne(request.user.sub);
    return {
      message: 'Sesion valida',
      data: user,
    };
  }
}
