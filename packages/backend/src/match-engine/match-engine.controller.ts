import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchEngineService } from './match-engine.service';
import { ResolveMatchDto } from './dto/resolve-match.dto';
import { ResolutionResult } from './interfaces/resolution-result.interface';

@Controller('v1/match')
@UseGuards(JwtAuthGuard)
export class MatchEngineController {
  constructor(private readonly matchEngineService: MatchEngineService) {}

  @Post('resolve')
  async resolve(@Body() dto: ResolveMatchDto, @Req() req: any): Promise<ResolutionResult> {
    void req; // JWT guard ensures authentication
    dto.validate();
    return this.matchEngineService.resolveMatch(dto);
  }
}
