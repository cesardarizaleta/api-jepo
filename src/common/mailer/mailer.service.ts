import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export type MailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

@Injectable()
export class MailerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;
  private fromAddress = '';
  private appName = 'Jepo';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('MAIL_PORT', '465'));
    const user = this.configService.get<string>('MAIL_USER', '');
    const pass = this.configService.get<string>('MAIL_PASSWORD', '');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Jepo');
    const fromAddressEnv = this.configService.get<string>('MAIL_FROM', '');

    if (!user || !pass) {
      this.logger.warn(
        'MAIL_USER/MAIL_PASSWORD no configurados. El envio de correos esta deshabilitado.',
      );
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465, // SSL directo en 465, STARTTLS en 587
      auth: { user, pass },
    });

    this.fromAddress = `${fromName} <${fromAddressEnv || user}>`;
    this.appName = fromName;

    this.logger.log(`MailerService listo (host=${host}, port=${port})`);
  }

  async onModuleDestroy(): Promise<void> {
    this.transporter?.close();
  }

  async sendMail(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<MailSendResult> {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Servicio de correo no configurado',
      );
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Fallo enviando correo a ${params.to}: ${message}`);
      throw new InternalServerErrorException(
        'No fue posible enviar el correo electronico',
      );
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<MailSendResult> {
    const subject = `${this.appName} - Codigo de recuperacion de contraseña`;
    const text = [
      `Tu codigo de verificacion de ${this.appName} es: ${otp}`,
      '',
      'Este codigo expira en 15 minutos.',
      'Si no solicitaste este cambio, ignora este mensaje.',
    ].join('\n');

    const html = this.buildPasswordResetHtml(otp);
    return this.sendMail({ to, subject, text, html });
  }

  private buildPasswordResetHtml(otp: string): string {
    const appName = this.escape(this.appName);
    const safeOtp = this.escape(otp);
    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} - Recuperacion de contraseña</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(17,24,39,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Alerta de seguridad</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;">${appName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">Recuperacion de contraseña</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;">
                  Recibimos una solicitud para restablecer la contrasena de tu cuenta en ${appName}.
                  Usa el siguiente codigo de verificacion para continuar. Este codigo
                  <strong>expira en 15 minutos</strong>.
                </p>
                <div style="margin:24px 0;padding:20px;border:1px dashed #c7d2fe;border-radius:10px;background-color:#eef2ff;text-align:center;">
                  <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#4338ca;margin-bottom:8px;">Codigo de verificacion</div>
                  <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#1e293b;font-family:'Courier New',monospace;">${safeOtp}</div>
                </div>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;">
                  Por tu seguridad, nunca compartas este codigo con nadie. El equipo de ${appName}
                  jamas te pedira este codigo por telefono, correo o mensajeria.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                  Si no solicitaste este cambio, ignora este mensaje y tu contrasena seguira intacta.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px 32px;border-top:1px solid #e5e7eb;background-color:#f9fafb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  &copy; ${new Date().getFullYear()} ${appName}. Sistema de Asistencia Proactiva.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
