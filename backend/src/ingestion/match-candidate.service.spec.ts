import { Test, TestingModule } from '@nestjs/testing';
import { MatchCandidateService } from './match-candidate.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('MatchCandidateService', () => {
  let service: MatchCandidateService;

  const mockReferenceData = [
    {
      playerId: 'p1',
      playerName: 'Marcus Ramirez',
      year: 2018,
      setName: 'Topps',
    },
    {
      playerId: 'p2',
      playerName: 'Shohei Ohtani',
      year: 2018,
      setName: 'Topps Heritage',
    },
    {
      playerId: 'p3',
      playerName: 'Mike Trout',
      year: 2011,
      setName: 'Topps Update',
    },
  ];

  beforeEach(async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(mockReferenceData),
    );
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchCandidateService],
    }).compile();

    service = module.get<MatchCandidateService>(MatchCandidateService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findCandidates', () => {
    it('should find a clear match for Marcus Ramirez', async () => {
      const ocrText = '2018 Topps Marcus Ramirez #42';
      const results = await service.findCandidates(ocrText);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].playerName).toBe('Marcus Ramirez');
      expect(results[0].year).toBe(2018);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should boost confidence with exact year match', async () => {
      // "Marcus" might match poorly, but 2018 helps
      const ocrText = 'Marcus 2018';
      const results = await service.findCandidates(ocrText);

      expect(results[0].playerName).toBe('Marcus Ramirez');
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    it('should return empty array for completely unrelated text', async () => {
      const ocrText = 'Unknown Player from 1950';
      const results = await service.findCandidates(ocrText);

      expect(results.length).toBe(0);
    });

    it('should handle fuzzy names', async () => {
      const ocrText = 'Shoey Otani 2018';
      const results = await service.findCandidates(ocrText);

      expect(results[0].playerName).toBe('Shohei Ohtani');
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });
  });
});
