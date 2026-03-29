import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmergencyContact } from '../../emergency-contacts/entities/emergency-contact.entity';
import { IncidentAlert } from '../entities/incident-alert.entity';

export type EvolutionSendResult = {
  contactId: number;
  telefono: string;
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

@Injectable()
export class EvolutionNotificationService {
  private readonly logger = new Logger(EvolutionNotificationService.name);
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

  async notifyEmergencyContacts(
    alert: IncidentAlert,
    userFullName: string,
    contacts: EmergencyContact[],
  ): Promise<EvolutionSendResult[]> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'Evolution API no configurada. Se omite envio de notificaciones.',
      );
      return contacts.map((contact) => ({
        contactId: contact.id,
        telefono: contact.telefono_contacto,
        success: false,
        error: 'EVOLUTION_API no configurada',
      }));
    }

    const message = this.buildAlertMessage(alert, userFullName);

    // Ejecutar envíos en paralelo y recoger resultados
    const tasks = contacts.map(async (contact) => {
      const phone = this.normalizePhone(contact.telefono_contacto);
      if (!phone) {
        return {
          contactId: contact.id,
          telefono: contact.telefono_contacto,
          success: false,
          error: 'Telefono de contacto invalido',
        } as EvolutionSendResult;
      }

      const sendResult = await this.sendText(phone, message);
      return {
        contactId: contact.id,
        telefono: contact.telefono_contacto,
        success: sendResult.success,
        providerMessageId: sendResult.providerMessageId,
        error: sendResult.error,
      } as EvolutionSendResult;
    });

    const settled = await Promise.allSettled(tasks);
    const results: EvolutionSendResult[] = settled.map((s, idx) => {
      if (s.status === 'fulfilled') {
        return s.value as EvolutionSendResult;
      }
      // Fallback en caso de error inesperado
      const contact = contacts[idx];
      return {
        contactId: contact?.id ?? -1,
        telefono: contact?.telefono_contacto ?? '',
        success: false,
        error: String((s as PromiseRejectedResult).reason ?? 'Error desconocido'),
      } as EvolutionSendResult;
    });

    return results;
  }

  private isConfigured(): boolean {
    return Boolean(this.baseUrl && this.instance && this.apiKey);
  }

  private buildAlertMessage(alert: IncidentAlert, userFullName: string): string {
    const mapsLink = `https://maps.google.com/?q=${alert.latitud},${alert.longitud}`;
    return [
      '🚨 *ALERTA DE EMERGENCIA*',
      '',
      `👤 Persona: *${userFullName}*`,
      `🕒 Fecha: ${alert.fecha_hora.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
      })}`,
      '',
      `📍 Ubicación: ${mapsLink}`,
      '',
      '⚠️ Por favor, intenta comunicarte de inmediato.',
    ].join('\n');
  }

  private normalizePhone(phone: string): string {
    const normalized = phone.replace(/\D/g, '');
    return normalized;
  }

  private async sendText(
    number: string,
    text: string,
  ): Promise<{
    success: boolean;
    providerMessageId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({ number, text }),
        },
      );

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
      return {
        success: false,
        error: message,
      };
    }
  }

  private extractMessageId(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const payloadRecord = payload as Record<string, unknown>;
    if (typeof payloadRecord.id === 'string') {
      return payloadRecord.id;
    }

    const key = payloadRecord.key;
    if (key && typeof key === 'object') {
      const keyRecord = key as Record<string, unknown>;
      if (typeof keyRecord.id === 'string') {
        return keyRecord.id;
      }
    }

    return undefined;
  }
}
