import { Injectable, Logger } from '@nestjs/common';
import { EvolutionService } from '../../common/evolution/evolution.service';
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

  constructor(private readonly evolutionService: EvolutionService) {}

  async notifyEmergencyContacts(
    alert: IncidentAlert,
    userFullName: string,
    contacts: EmergencyContact[],
  ): Promise<EvolutionSendResult[]> {
    if (!this.evolutionService.isConfigured()) {
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

    const tasks = contacts.map(async (contact) => {
      const sendResult = await this.evolutionService.sendText(
        contact.telefono_contacto,
        message,
      );
      return {
        contactId: contact.id,
        telefono: contact.telefono_contacto,
        success: sendResult.success,
        providerMessageId: sendResult.providerMessageId,
        error: sendResult.error,
      } as EvolutionSendResult;
    });

    const settled = await Promise.allSettled(tasks);
    return settled.map((s, idx) => {
      if (s.status === 'fulfilled') {
        return s.value;
      }
      const contact = contacts[idx];
      return {
        contactId: contact?.id ?? -1,
        telefono: contact?.telefono_contacto ?? '',
        success: false,
        error: String(s.reason ?? 'Error desconocido'),
      } as EvolutionSendResult;
    });
  }

  private buildAlertMessage(
    alert: IncidentAlert,
    userFullName: string,
  ): string {
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
}
