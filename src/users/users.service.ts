import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordService } from '../common/security/password.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type SafeUser = Omit<User, 'password_hash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    await this.validateUniqueEmail(createUserDto.email);

    const passwordHash = await this.passwordService.hash(createUserDto.password);
    const user = this.usersRepository.create({
      nombre: createUserDto.nombre,
      apellido: createUserDto.apellido,
      email: createUserDto.email,
      telefono: createUserDto.telefono,
      password_hash: passwordHash,
      token_fcm: createUserDto.token_fcm ?? null,
    });

    const saved = await this.usersRepository.save(user);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<SafeUser[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password_hash')
      .where('usuario.email = :email', { email })
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.validateUniqueEmail(updateUserDto.email);
    }

    const { password, ...restUpdateUserDto } = updateUserDto;
    const payload: Partial<User> = {
      ...restUpdateUserDto,
    };

    if (password) {
      payload.password_hash = await this.passwordService.hash(password);
    }

    const merged = this.usersRepository.merge(user, payload);
    const saved = await this.usersRepository.save(merged);
    return this.findOne(saved.id);
  }

  async updateToken(
    id: number,
    updateTokenDto: UpdateTokenDto,
  ): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
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
