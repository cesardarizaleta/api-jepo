import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { RecolectarTelemetriaDto } from './dto/recolectar-telemetria.dto';

const CSV_HEADER = 'timestamp,ax,ay,az,gx,gy,gz,etiqueta\n';

@Injectable()
export class TelemetriaService {
  private readonly logger = new Logger(TelemetriaService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly usuario: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      endpoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      region: this.config.get<string>('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    this.usuario = this.config.get<string>('MINIO_DEFAULT_USER', 'JesusAraujo');
  }

  async recolectar(
    dto: RecolectarTelemetriaDto,
  ): Promise<{ muestras_escritas: number; archivo: string }> {
    const { etiqueta, muestras } = dto;

    const descripcion = etiqueta.toLowerCase().trim().replace(/\s+/g, '');
    const timestamp = Date.now();
    const archivo = `dataset-${descripcion}-${this.usuario}-${timestamp}.csv`;

    const lines = muestras
      .map(
        (m) =>
          `${m.t},${m.ax},${m.ay},${m.az},${m.gx},${m.gy},${m.gz},${etiqueta}`,
      )
      .join('\n');

    const csvContent = CSV_HEADER + lines + '\n';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: archivo,
        Body: csvContent,
        ContentType: 'text/csv',
      }),
    );

    this.logger.log(
      `[${etiqueta}] ${muestras.length} muestras -> s3://${this.bucket}/${archivo}`,
    );

    return { muestras_escritas: muestras.length, archivo };
  }
}
