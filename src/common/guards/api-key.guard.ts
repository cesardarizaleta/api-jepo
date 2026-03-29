import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private static readonly DEFAULT_HEADER = 'x-api-key';

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Permite acceso a Swagger UI y JSON sin API key para facilitar documentación.
    if (request.path === '/api/docs' || request.path === '/api/docs-json') {
      return true;
    }

    const expectedApiKey = this.configService.get<string>('API_KEY', '');
    if (!expectedApiKey) {
      throw new InternalServerErrorException(
        'API_KEY no configurada en el entorno',
      );
    }

    const headerName = this.configService
      .get<string>('API_KEY_HEADER_NAME', ApiKeyGuard.DEFAULT_HEADER)
      .toLowerCase();

    const received = this.getHeaderValue(request, headerName);
    if (!received || received !== expectedApiKey) {
      throw new UnauthorizedException('API key invalida o ausente');
    }

    return true;
  }

  private getHeaderValue(request: Request, headerName: string): string {
    const header = request.headers[headerName];

    if (Array.isArray(header)) {
      return header[0] ?? '';
    }

    if (typeof header === 'string') {
      return header;
    }

    return '';
  }
}
