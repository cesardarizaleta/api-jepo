import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
  private static readonly HASH_PREFIX = 'scrypt';
  private static readonly SALT_SIZE = 16;
  private static readonly KEY_LENGTH = 64;

  constructor(private readonly configService: ConfigService) {}

  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(PasswordService.SALT_SIZE).toString('hex');
    const derived = await this.deriveKey(plainPassword, salt);
    return `${PasswordService.HASH_PREFIX}$${salt}$${derived.toString('hex')}`;
  }

  async compare(plainPassword: string, storedHash: string): Promise<boolean> {
    const [prefix, salt, hashHex] = storedHash.split('$');
    if (
      prefix !== PasswordService.HASH_PREFIX ||
      !salt ||
      !hashHex ||
      hashHex.length % 2 !== 0
    ) {
      return false;
    }

    const currentDerived = await this.deriveKey(
      plainPassword,
      salt,
      hashHex.length / 2,
    );
    const storedBuffer = Buffer.from(hashHex, 'hex');

    if (storedBuffer.length !== currentDerived.length) {
      return false;
    }

    return timingSafeEqual(currentDerived, storedBuffer);
  }

  private async deriveKey(
    plainPassword: string,
    salt: string,
    keyLength: number = PasswordService.KEY_LENGTH,
  ): Promise<Buffer> {
    const pepper = this.configService.get<string>('PASSWORD_PEPPER', '');
    return (await scrypt(`${plainPassword}${pepper}`, salt, keyLength)) as Buffer;
  }
}
