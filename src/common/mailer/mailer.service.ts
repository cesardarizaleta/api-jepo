import { Injectable, Logger } from '@nestjs/common';

export type MailSendResult = {
  success: boolean;
  error?: string;
};

/**
 * Servicio de envío de correos basado en Nodemailer.
 * Stub inyectable: la implementación concreta de transporte (SMTP, SES, etc.)
 * se conectará cuando se definan las credenciales del proveedor.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendMail(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<MailSendResult> {
    // TODO: reemplazar por transporte real de Nodemailer (SMTP/SES/etc.).
    this.logger.log(`Email simulado a ${params.to} [${params.subject}]`);
    return { success: true };
  }
}
