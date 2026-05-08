import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { TimeoutInterceptor } from '../common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(compression());

  const corsEnabled = process.env.CORS_ENABLED !== 'false';
  if (corsEnabled) {
    const corsOrigins = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    app.enableCors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-api-key'],
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(), new TimeoutInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
