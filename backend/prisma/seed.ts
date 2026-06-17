import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfig = {
  version: '1.0.0',
  isActive: true,
  weights: {
    playerStats: 0.4,
    marketValueCents: 0.2,
    conditionEstimatedScore: 0.2,
    rarity: 0.1,
    momentum: 0.1,
  },
  normalizationBounds: {
    playerStats: { min: 0, max: 100 },
    marketValueCents: { min: 0, max: 1000000 },
    conditionEstimatedScore: { min: 0, max: 100 },
    rarity: { min: 1, max: 5 },
    momentum: { min: -10, max: 10 },
  },
};

async function main() {
  // Upsert default config, deactivate others
  await prisma.ratingConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  await prisma.ratingConfig.upsert({
    where: { version: defaultConfig.version },
    update: { ...defaultConfig, isActive: true },
    create: defaultConfig,
  });

  console.log('Seeded default rating config version 1.0.0');

  // Seed reference players
  const players = [
    { id: 'p1', name: 'Marcus Ramirez' },
    { id: 'p2', name: 'Shohei Ohtani' },
    { id: 'p3', name: 'Mike Trout' },
    { id: 'p4', name: 'Ronald Acuña Jr.' },
    { id: 'p5', name: 'Juan Soto' },
  ];

  for (const player of players) {
    await prisma.player.upsert({
      where: { id: player.id },
      update: { name: player.name },
      create: player,
    });
  }
  console.log(`Seeded ${players.length} reference players`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
