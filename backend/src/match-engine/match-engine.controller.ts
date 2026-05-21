import {
  Controller,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchEngineService } from './match-engine.service';
import { ResolveMatchDto } from './dto/resolve-match.dto';
import { ResolutionResult } from './interfaces/resolution-result.interface';
import { PrismaService } from '../prisma/prisma.service';

@Controller('match')
@UseGuards(JwtAuthGuard)
export class MatchEngineController {
  constructor(
    private readonly matchEngineService: MatchEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('resolve')
  async resolve(
    @Body() dto: ResolveMatchDto,
    @Req() req: any,
  ): Promise<ResolutionResult> {
    dto.validate();

    // If using matchId, verify ownership
    if (dto.matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: dto.matchId },
        include: {
          lineupA: true,
          lineupB: true,
        },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      const userId = req.user.id;
      const ownerA = match.lineupA.userId;
      const ownerB = match.lineupB.userId;
      if (userId !== ownerA && userId !== ownerB) {
        throw new NotFoundException('Match not found'); // Hide existence from non-owners
      }

      return this.matchEngineService.resolveMatch(dto, userId);
    }

    return this.matchEngineService.resolveMatch(dto);
  }
}
