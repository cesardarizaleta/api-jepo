import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';

const CSV_HEADER = 'timestamp,ax,ay,az,gx,gy,gz,etiqueta\n';

@Injectable()
export class TelemetriaService implements OnModuleInit {
  private readonly logger = new Logger(TelemetriaService.name);
  private readonly filePath = path.resolve(
    process.cwd(),
    'dataset_jepo.csv',
  );

  onModuleInit() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, CSV_HEADER, 'utf-8');
      this.logger.log(`Archivo CSV creado: ${this.filePath}`);
    }
  }

  async recolectar(dto: RecolectarTelemetriaDto): Promise<number> {
    const { etiqueta, muestras } = dto;

    const lines = muestras
      .map(
        (m) =>
          `${m.t},${m.ax},${m.ay},${m.az},${m.gx},${m.gy},${m.gz},${etiqueta}`,
      )
      .join('\n');

    await fs.promises.appendFile(this.filePath, lines + '\n', 'utf-8');

    this.logger.log(
      `Escritas ${muestras.length} muestras [${etiqueta}]`,
    );

    return muestras.length;
  }
}
