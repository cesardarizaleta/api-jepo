import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';

const CSV_HEADER = 'timestamp,ax,ay,az,gx,gy,gz,etiqueta\n';

@Injectable()
export class TelemetriaService {
  private readonly logger = new Logger(TelemetriaService.name);

  async recolectar(dto: RecolectarTelemetriaDto): Promise<number> {
    const { etiqueta, muestras } = dto;

    const etiquetaLimpia = etiqueta.toLowerCase().trim().replace(/\s+/g, '');
    const fileName = `dataset_${etiquetaLimpia}.csv`;
    const filePath = path.resolve(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, CSV_HEADER, 'utf-8');
      this.logger.log(`Archivo CSV creado: ${fileName}`);
    }

    const lines = muestras
      .map(
        (m) =>
          `${m.t},${m.ax},${m.ay},${m.az},${m.gx},${m.gy},${m.gz},${etiqueta}`,
      )
      .join('\n');

    await fs.promises.appendFile(filePath, lines + '\n', 'utf-8');

    this.logger.log(
      `[${etiqueta}] ${muestras.length} muestras -> ${fileName}`,
    );

    return muestras.length;
  }
}
