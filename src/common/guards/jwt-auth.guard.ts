import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type JwtPayload = {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
};

type RequestWithUser = Request & {
  user?: JwtPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso ausente');
    }

    const secret = this.configService.get<string>('JWT_SECRET', '');
    if (!secret) {
      throw new UnauthorizedException('JWT no configurado');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Token de acceso invalido o expirado');
    }

    // Invalidación por cambio de contraseña: si el usuario cambió su password
    // después de que se emitió este token, el token queda inválido.
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'password_changed_at'],
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.password_changed_at && payload.iat) {
      const passwordChangedAtSec = Math.floor(
        new Date(user.password_changed_at).getTime() / 1000,
      );
      if (payload.iat < passwordChangedAtSec) {
        throw new UnauthorizedException(
          'Token invalidado por cambio de contrasena',
        );
      }
    }

    request.user = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
