import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListCardsQueryDto } from './dto/card-queries.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    username: string;
  };
}

@Controller('v1/users')
export class UserCardsController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId/cards')
  async listUserCards(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Query() query: ListCardsQueryDto,
  ) {
    return this.cardService.listCards(userId, req.user.id, query);
  }
}
