import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EvolutionSendTextResult = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseUrl: string;
  private readonly instance: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .get<string>('EVOLUTION_API_BASE_URL', '')
      .replace(/\/$/, '');
    this.instance = this.configService.get<string>('EVOLUTION_INSTANCE', '');
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY', '');
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.instance && this.apiKey);
  }

  normalizePhone(phone: string): string {
    return (phone ?? '').replace(/\D/g, '');
  }

  async sendText(
    phone: string,
    text: string,
  ): Promise<EvolutionSendTextResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'Evolution API no configurada. Se omite envio de mensaje.',
      );
      return { success: false, error: 'EVOLUTION_API no configurada' };
    }

    const number = this.normalizePhone(phone);
    if (!number) {
      return { success: false, error: 'Telefono invalido' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.baseUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({ number, text }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseBody = await response.text();
        this.logger.error(
          `Error Evolution API (${response.status}): ${responseBody}`,
        );
        return {
          success: false,
          error: `Evolution API respondio ${response.status}`,
        };
      }

      const payload: unknown = await response.json();
      return {
        success: true,
        providerMessageId: this.extractMessageId(payload),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Fallo enviando mensaje por Evolution API: ${message}`);
      return { success: false, error: message };
    }
  }

  private extractMessageId(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const record = payload as Record<string, unknown>;
    if (typeof record.id === 'string') return record.id;
    const key = record.key;
    if (key && typeof key === 'object') {
      const keyRecord = key as Record<string, unknown>;
      if (typeof keyRecord.id === 'string') return keyRecord.id;
    }
    return undefined;
  }
}
