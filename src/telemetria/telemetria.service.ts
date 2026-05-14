import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface MuestraRaw {
  x: unknown;
  y: unknown;
  z: unknown;
  timestamp: unknown;
}

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

  async recolectar(payload: any): Promise<{
    muestras_escritas: number;
    muestras_descartadas: number;
    primer_error_indice: number | null;
  }> {
    const etiqueta: string = payload?.etiqueta ?? 'DESCONOCIDA';
    const muestras: MuestraRaw[] = Array.isArray(payload?.muestras)
      ? payload.muestras
      : [];

    let primerErrorIndice: number | null = null;
    const lineasValidas: string[] = [];
    let descartadas = 0;

    for (let i = 0; i < muestras.length; i++) {
      const m = muestras[i];
      const x = Number(m?.x);
      const y = Number(m?.y);
      const z = Number(m?.z);
      const ts = Number(m?.timestamp);

      if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(ts)) {
        if (primerErrorIndice === null) {
          primerErrorIndice = i;
          this.logger.warn(
            `Muestra corrupta en indice [${i}]: ${JSON.stringify(m)}`,
          );
        }
        descartadas++;
        continue;
      }

      lineasValidas.push(`${ts},${x},${y},${z},${etiqueta}`);
    }

    if (lineasValidas.length > 0) {
      await fs.promises.appendFile(
        this.filePath,
        lineasValidas.join('\n') + '\n',
        'utf-8',
      );
    }

    this.logger.log(
      `[${etiqueta}] Escritas: ${lineasValidas.length} | Descartadas: ${descartadas}` +
        (primerErrorIndice !== null
          ? ` | Primer error en indice: ${primerErrorIndice}`
          : ''),
    );

    return {
      muestras_escritas: lineasValidas.length,
      muestras_descartadas: descartadas,
      primer_error_indice: primerErrorIndice,
    };
  }
}
