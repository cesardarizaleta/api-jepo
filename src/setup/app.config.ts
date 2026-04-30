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
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(), new TimeoutInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
