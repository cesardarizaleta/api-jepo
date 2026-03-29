import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyContact } from '../emergency-contacts/entities/emergency-contact.entity';
import { User } from '../users/entities/user.entity';
import { IncidentAlertsController } from './incident-alerts.controller';
import { IncidentAlertsService } from './incident-alerts.service';
import { IncidentAlert } from './entities/incident-alert.entity';
import { EvolutionNotificationService } from './services/evolution-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentAlert, User, EmergencyContact])],
  controllers: [IncidentAlertsController],
  providers: [IncidentAlertsService, EvolutionNotificationService],
})
export class IncidentAlertsModule {}
