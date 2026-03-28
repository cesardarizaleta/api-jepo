import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'api-jepo',
      timestamp: new Date().toISOString(),
    };
  }
}
