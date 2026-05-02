import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { EnqueueMatchmakingDto, MatchType } from './dto/enqueue-matchmaking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/matchmaking')
@UseGuards(JwtAuthGuard)
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('enqueue')
  async enqueue(@Req() req: any, @Body() dto: EnqueueMatchmakingDto) {
    const userId = req.user.userId;
    return this.matchmakingService.enqueue(userId, dto.lineupId, dto.matchType);
  }

  @Get('status')
  async getStatus(@Req() req: any) {
    const userId = req.user.userId;
    return this.matchmakingService.getStatus(userId);
  }

  @Post('cancel')
  async cancel(@Req() req: any) {
    const userId = req.user.userId;
    const removed = await this.matchmakingService.removeFromQueue(userId);
    return { cancelled: removed };
  }
}
