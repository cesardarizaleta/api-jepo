import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  controllers: [UsersController],
})
export class UsersApiModule {}
