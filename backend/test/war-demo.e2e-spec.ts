import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MatchEngineService } from '../src/match-engine/match-engine.service';
import { LineupService } from '../src/lineup/lineup.service';
import { IngestionService } from '../src/ingestion/ingestion.service';
import { S3Service } from '../src/storage/s3.service';
import { CVService } from '../src/ingestion/cv/cv.service';

describe('War Battle Demo (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let lineupService: LineupService;
  let matchEngineService: MatchEngineService;
  let ingestionService: IngestionService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    lineupService = app.get<LineupService>(LineupService);
    matchEngineService = app.get<MatchEngineService>(MatchEngineService);
    ingestionService = app.get<IngestionService>(IngestionService);
  });

  afterAll(async () => {
    // Cleanup in correct order
    await prisma.match.deleteMany({});
    await prisma.lineup.deleteMany({});
    await prisma.cardIngestionJob.deleteMany({});
    await prisma.card.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['userA@demo.com', 'userB@demo.com', 'ingestion@demo.com'] } },
    });
    await app.close();
  });

  it('should demo card ingestion and a 9-card War battle', async () => {
    // 1. Create Players
    const playersData = [];
    for (let i = 1; i <= 20; i++) {
      playersData.push({ id: `p${i}`, name: `Player ${i}` });
    }

    for (const p of playersData) {
      await prisma.player.upsert({
        where: { id: p.id },
        update: {},
        create: p,
      });
    }

    // 2. Create Users
    const userA = await prisma.user.upsert({
      where: { email: 'userA@demo.com' },
      update: {},
      create: {
        username: 'UserA',
        email: 'userA@demo.com',
        passwordHash: 'hash',
      },
    });

    const userB = await prisma.user.upsert({
      where: { email: 'userB@demo.com' },
      update: {},
      create: {
        username: 'UserB',
        email: 'userB@demo.com',
        passwordHash: 'hash',
      },
    });

    // 3. Create 9 cards for each
    const cardsA = [];
    for (let i = 0; i < 9; i++) {
      const card = await prisma.card.create({
        data: {
          userId: userA.id,
          playerId: playersData[i].id,
          year: 2020,
          setName: 'Topps',
          conditionReported: 'mint',
          rarity: 'common',
          imageFrontKey: 'mock',
          playerStats: 80 + i, // 80, 81, 82, 83, 84, 85, 86, 87, 88
          powerScore: 80 + i,
        },
      });
      cardsA.push(card);
    }

    const cardsB = [];
    for (let i = 0; i < 9; i++) {
      const card = await prisma.card.create({
        data: {
          userId: userB.id,
          playerId: playersData[i + 9].id,
          year: 2020,
          setName: 'Topps',
          conditionReported: 'mint',
          rarity: 'common',
          imageFrontKey: 'mock',
          playerStats: 75 + i, // 75, 76, 77, 78, 79, 80, 81, 82, 83
          powerScore: 75 + i,
        },
      });
      cardsB.push(card);
    }

    // 4. Create Lineups
    const slotsA: Record<string, string> = {};
    const slotsB: Record<string, string> = {};
    for (let i = 0; i < 9; i++) {
      slotsA[`pos${i}`] = cardsA[i].id;
      slotsB[`pos${i}`] = cardsB[i].id;
    }

    const lineupA = await lineupService.createLineup(userA.id, 'War Team A', slotsA);
    const lineupB = await lineupService.createLineup(userB.id, 'War Team B', slotsB);

    // 5. Run Match
    const match = await prisma.match.create({
      data: {
        lineupAId: lineupA.id,
        lineupBId: lineupB.id,
        matchType: 'casual',
        matchSeed: 'demo-seed',
        status: 'pending',
      },
    });

    console.log('--- Starting War Battle ---');
    const result = await matchEngineService.resolveMatch({
      matchId: match.id,
      isWar: true,
    }, userA.id);

    console.log('--- Match Result ---');
    console.log(`Winner: ${result.winner}`);
    console.log(`Score: ${result.scoreA} - ${result.scoreB}`);
    
    // Verify each position
    result.perPositionResults.forEach(r => {
      console.log(`Position ${r.position}: ${r.statA} vs ${r.statB} -> Winner ${r.winner}`);
    });

    // 6. Verify transfers
    const finalCardsA = await prisma.card.findMany({ where: { userId: userA.id } });
    const finalCardsB = await prisma.card.findMany({ where: { userId: userB.id } });

    console.log(`Final User A cards: ${finalCardsA.length}`);
    console.log(`Final User B cards: ${finalCardsB.length}`);

    expect(result.winner).toBe('A');
    expect(result.scoreA).toBe(9);
    expect(finalCardsA.length).toBe(18);
    expect(finalCardsB.length).toBe(0);

    // Verify events
    const warTransfers = result.events.filter(e => e.type === 'war_transfer');
    expect(warTransfers.length).toBe(9);
  }, 30000);

  it('should demo the full card ingestion process', async () => {
    // 1. Create User
    const user = await prisma.user.upsert({
      where: { email: 'ingestion@demo.com' },
      update: {},
      create: {
        username: 'IngestionTester',
        email: 'ingestion@demo.com',
        passwordHash: 'hash',
      },
    });

    // 2. Create Upload URL
    console.log('--- Starting Ingestion Demo ---');
    const uploadInfo = await ingestionService.createUploadUrls(user.id, 'trout.jpg');
    console.log(`Scan Job Created: ${uploadInfo.scanJobId}`);

    // 3. Process Scan (Mocking S3 download and OCR)
    const s3Service = app.get(S3Service);
    const cvService = app.get(CVService);
    
    jest.spyOn(s3Service, 'downloadObject').mockResolvedValue(Buffer.from('mock-image'));
    jest.spyOn(cvService, 'extractOCR').mockResolvedValue({ text: '2011 Topps Update Mike Trout' });

    console.log('Processing Scan...');
    const processedJob = await ingestionService.processScanJob(user.id, uploadInfo.scanJobId);
    console.log('Scan Processed. Status:', processedJob.status);
    console.log('OCR Text:', processedJob.ocrText);

    // 4. Confirm Scan
    const candidates = processedJob.candidateMatches as Array<{ playerId: string; playerName: string; year: number; setName: string }>;
    const bestMatch = candidates && candidates.length > 0 ? candidates[0] : null;
    if (bestMatch) {
      console.log(`Confirming match: ${bestMatch.playerName} (${bestMatch.year})`);
      const confirmation = await ingestionService.confirmScanJob(
        user.id,
        uploadInfo.scanJobId,
        bestMatch.playerId,
        bestMatch.year,
        bestMatch.setName,
        undefined,
        'near_mint',
        true
      );
      console.log('Card Confirmed! Card ID:', confirmation.cardId);

      const card = await prisma.card.findUnique({ where: { id: confirmation.cardId } });
      expect(card).toBeDefined();
      expect(card?.userId).toBe(user.id);
      expect(card?.ingestionStatus).toBe('verified');
    } else {
        console.warn('No candidates found for ingestion demo');
    }
  });
});
