import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObject = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(responseObject.message)) {
          details = responseObject.message;
          message = responseObject.error ?? 'Error de validacion';
        } else if (typeof responseObject.message === 'string') {
          message = responseObject.message;
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      errors: details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
