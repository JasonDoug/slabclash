import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production',
    });
  }

  async validate(payload: { userId: string; username: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Passport automatically attaches this returned object to the Request (req.user)
    return { userId: payload.userId, username: payload.username };
  }
}
