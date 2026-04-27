import {
  Body,
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario y emitir JWT' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'Registro exitoso',
    schema: {
      example: {
        success: true,
        message: 'Registro exitoso',
        data: {
          access_token: '<jwt>',
          token_type: 'Bearer',
          expires_in: '15m',
          user: {
            id: 1,
            nombre: 'Cesar',
            apellido: 'Perez',
            email: 'cesar@correo.com',
            telefono: '+56912345678',
            token_fcm: null,
          },
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Registro exitoso',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y emitir JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      example: {
        success: true,
        message: 'Login exitoso',
        data: {
          access_token: '<jwt>',
          token_type: 'Bearer',
          expires_in: '15m',
          user: {
            id: 1,
            nombre: 'Cesar',
            apellido: 'Perez',
            email: 'cesar@correo.com',
            telefono: '+56912345678',
            token_fcm: null,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login exitoso',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Obtener sesion actual' })
  @ApiOkResponse({
    description: 'Sesion valida',
    schema: {
      example: {
        success: true,
        message: 'Sesion valida',
        data: {
          id: 1,
          nombre: 'Cesar',
          apellido: 'Perez',
          email: 'cesar@correo.com',
          telefono: '+56912345678',
          token_fcm: 'fcm_device_token_abc123456789',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, invalido o expirado' })
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findOne(request.user.sub);
    return {
      message: 'Sesion valida',
      data: user,
    };
  }
}
