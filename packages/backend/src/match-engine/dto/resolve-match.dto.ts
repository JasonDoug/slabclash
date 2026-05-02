import { IsOptional, IsString, ValidateNested, validateSync } from 'class-validator';
import { Type } from 'class-transformer';
import { LineupInputDto } from './lineup-input.dto';

export class ResolveMatchDto {
  @IsOptional()
  @IsString()
  matchId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LineupInputDto)
  lineupA?: LineupInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LineupInputDto)
  lineupB?: LineupInputDto;

  @IsOptional()
  @IsString()
  matchSeed?: string;

  validate() {
    const errors = validateSync(this);
    if (errors.length) return errors;

    const hasMatchId = !!this.matchId;
    const hasLineups = !!this.lineupA && !!this.lineupB && !!this.matchSeed;

    if (hasMatchId === hasLineups) {
      throw new Error('Provide either matchId OR lineupA + lineupB + matchSeed');
    }
    return [];
  }
}
