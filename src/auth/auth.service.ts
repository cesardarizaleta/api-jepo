import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from '../common/security/password.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.buildAuthResponse(user.id, user.email, user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);
    if (!user?.password_hash) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isValidPassword = await this.passwordService.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const safeUser = await this.usersService.findOne(user.id);
    return this.buildAuthResponse(user.id, user.email, safeUser);
  }

  private async buildAuthResponse(
    userId: number,
    userEmail: string,
    user: unknown,
  ) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email: userEmail,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user,
    };
  }
}
