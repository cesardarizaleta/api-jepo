import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { EmergencyContactsController } from './emergency-contacts.controller';
import { EmergencyContactsService } from './emergency-contacts.service';
import { EmergencyContact } from './entities/emergency-contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyContact, User])],
  controllers: [EmergencyContactsController],
  providers: [EmergencyContactsService],
  exports: [EmergencyContactsService, TypeOrmModule],
})
export class EmergencyContactsModule {}
