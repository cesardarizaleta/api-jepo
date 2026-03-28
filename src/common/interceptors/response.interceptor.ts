import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type WrappedData = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<WrappedData> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'success' in value &&
          'message' in value &&
          'data' in value
        ) {
          return value as WrappedData;
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          'message' in value &&
          'data' in value
        ) {
          const payload = value as { message: string; data: unknown };
          return {
            success: true,
            message: payload.message,
            data: payload.data,
          };
        }

        return {
          success: true,
          message: 'Operacion exitosa',
          data: value,
        };
      }),
    );
  }
}
