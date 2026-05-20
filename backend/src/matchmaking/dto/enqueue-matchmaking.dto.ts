import { IsEnum, IsString } from 'class-validator';

export enum MatchType {
  casual = 'casual',
  ranked = 'ranked',
}

export class EnqueueMatchmakingDto {
  @IsString()
  lineupId: string;

  @IsEnum(MatchType)
  matchType: MatchType;
}
