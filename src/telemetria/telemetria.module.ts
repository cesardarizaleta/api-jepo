import { Module } from '@nestjs/common';
import { TelemetriaController } from './telemetria.controller';
import { TelemetriaService } from './telemetria.service';

@Module({
  controllers: [TelemetriaController],
  providers: [TelemetriaService],
})
export class TelemetriaModule {}
