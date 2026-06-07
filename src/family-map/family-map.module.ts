import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EmergencyContact } from '../emergency-contacts/entities/emergency-contact.entity';
import { User } from '../users/entities/user.entity';
import { FamilyMapController } from './family-map.controller';
import { FamilyMapService } from './family-map.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, EmergencyContact])],
  controllers: [FamilyMapController],
  providers: [FamilyMapService],
})
export class FamilyMapModule {}
