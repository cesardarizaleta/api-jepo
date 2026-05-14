import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';

@Injectable()
export class TelemetriaService implements OnModuleInit {
  private readonly logger = new Logger(TelemetriaService.name);
  private readonly filePath = path.resolve(
    process.cwd(),
    'dataset_jepo.csv',
  );

  onModuleInit() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, 'timestamp,x,y,z,etiqueta\n', 'utf-8');
      this.logger.log(`Archivo CSV creado: ${this.filePath}`);
    }
  }

  async recolectar(dto: RecolectarTelemetriaDto): Promise<number> {
    const lines = dto.muestras
      .map((m) => `${m.timestamp},${m.x},${m.y},${m.z},${dto.etiqueta}`)
      .join('\n');

    await fs.promises.appendFile(this.filePath, lines + '\n', 'utf-8');

    this.logger.log(
      `Escritas ${dto.muestras.length} muestras [${dto.etiqueta}]`,
    );

    return dto.muestras.length;
  }
}
