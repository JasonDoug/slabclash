import { Controller, Post, Get, Delete, Body, Param, Req } from '@nestjs/common';
import { LineupService } from './lineup.service';
import { CreateLineupDto } from './dto/create-lineup.dto';

@Controller('v1/lineups')
export class LineupController {
  constructor(private readonly lineupService: LineupService) {}

  @Post()
  async createLineup(@Req() req, @Body() dto: CreateLineupDto) {
    const userId = req.user?.id;
    return this.lineupService.createLineup(userId, dto.name, dto.slots);
  }

  @Get(':lineupId')
  async getLineup(@Req() req, @Param('lineupId') lineupId: string) {
    const userId = req.user?.id;
    return this.lineupService.getLineup(lineupId, userId);
  }

  @Get('user/:userId')
  async getUserLineups(@Param('userId') userId: string) {
    return this.lineupService.getUserLineups(userId);
  }

  @Delete(':lineupId')
  async deleteLineup(@Req() req, @Param('lineupId') lineupId: string) {
    const userId = req.user?.id;
    return this.lineupService.deleteLineup(lineupId, userId);
  }
}
