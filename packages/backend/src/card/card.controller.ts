import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':cardId')
  async getCard(@Request() req, @Param('cardId') cardId: string) {
    return this.cardService.getCard(req.user.id, cardId);
  }
}
