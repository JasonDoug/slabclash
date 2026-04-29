import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CalcRatingDto } from './dto/calc-rating.dto';
import { CalcRatingResponseDto } from './dto/calc-rating-response.dto';

@Controller('v1/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('calc')
  @HttpCode(200)
  async calc(@Body() dto: CalcRatingDto): Promise<CalcRatingResponseDto> {
    return this.ratingService.calculate(dto);
  }
}
