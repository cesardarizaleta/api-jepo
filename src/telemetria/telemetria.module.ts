import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TelemetriaController } from './telemetria.controller';
import { TelemetriaService } from './telemetria.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TelemetriaController],
  providers: [TelemetriaService],
})
export class TelemetriaModule {}
