import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCardMetadataDto } from './dto/card-queries.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    username: string;
  };
}

@Controller('v1/cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':cardId')
  async getCard(@Request() req: RequestWithUser, @Param('cardId') cardId: string) {
    return this.cardService.getCardWithBreakdown(req.user.id, cardId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':cardId/metadata')
  async updateMetadata(
    @Request() req: RequestWithUser,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardMetadataDto,
  ) {
    return this.cardService.updateCardMetadata(req.user.id, cardId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':cardId/flag')
  async flagCard(
    @Request() req: RequestWithUser,
    @Param('cardId') cardId: string,
    @Body('reason') reason: string,
  ) {
    return this.cardService.flagCard(req.user.id, cardId, reason);
  }
}
