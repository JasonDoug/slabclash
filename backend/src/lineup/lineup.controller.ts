import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LineupService } from './lineup.service';
import { CreateLineupDto } from './dto/create-lineup.dto';

interface RequestWithUser extends Request {
  user: { id: string; username: string };
}

@Controller('lineups')
export class LineupController {
  constructor(private readonly lineupService: LineupService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createLineup(
    @Req() req: RequestWithUser,
    @Body() dto: CreateLineupDto,
  ) {
    return this.lineupService.createLineup(req.user.id, dto.name, dto.slots);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':lineupId')
  async getLineup(
    @Req() req: RequestWithUser,
    @Param('lineupId') lineupId: string,
  ) {
    return this.lineupService.getLineup(lineupId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMyLineups(@Req() req: RequestWithUser) {
    return this.lineupService.getUserLineups(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':lineupId')
  async deleteLineup(
    @Req() req: RequestWithUser,
    @Param('lineupId') lineupId: string,
  ) {
    return this.lineupService.deleteLineup(lineupId, req.user.id);
  }
}
