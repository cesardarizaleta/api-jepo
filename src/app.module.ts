import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { UsersModule } from './users/users.module';
import { UsersApiModule } from './users/users-api.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { FamilyMapModule } from './family-map/family-map.module';
import { IncidentAlertsModule } from './incident-alerts/incident-alerts.module';
import { SecurityModule } from './common/security/security.module';
import { EvolutionModule } from './common/evolution/evolution.module';
import { MailerModule } from './common/mailer/mailer.module';
import { VerificationModule } from './common/verification/verification.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './setup/health/health.module';
import { TelemetriaModule } from './telemetria/telemetria.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('THROTTLE_TTL', 60000)),
          limit: Number(configService.get('THROTTLE_LIMIT', 60)),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DB_URL', '');

        if (!dbUrl) {
          throw new Error('DB_URL is required');
        }

        const parsedUrl = new URL(dbUrl);

        return {
          type: 'postgres',
          url: dbUrl,
          schema:
            parsedUrl.searchParams.get('schema') ?? 'asistencia_proactiva',
          autoLoadEntities: true,
          synchronize: parsedUrl.searchParams.get('sync') === 'true',
        };
      },
    }),
    SecurityModule,
    EvolutionModule,
    MailerModule,
    VerificationModule,
    AuthModule,
    HealthModule,
    EmergencyContactsModule,
    FamilyMapModule,
    IncidentAlertsModule,
    UsersModule,
    UsersApiModule,
    TelemetriaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
