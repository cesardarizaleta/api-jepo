import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.validateUniqueEmail(createUserDto.email);
    const user = this.usersRepository.create({
      ...createUserDto,
      token_fcm: createUserDto.token_fcm ?? null,
    });
    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.validateUniqueEmail(updateUserDto.email);
    }

    const merged = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(merged);
  }

  async updateToken(id: number, updateTokenDto: UpdateTokenDto): Promise<User> {
    const user = await this.findOne(id);
    user.token_fcm = updateTokenDto.token_fcm;
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
  }
}
