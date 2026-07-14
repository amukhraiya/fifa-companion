import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('Seeding database...');

  // 1. Clean existing records (in order of dependency)
  await prisma.event.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.travelPlan.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.seatLock.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.matchTeam.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.restaurant.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.conversationTurn.deleteMany({});
  await prisma.fanMemory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.knowledgeChunk.deleteMany({});

  // 2. Create Users
  const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');

  const fanUser = await prisma.user.create({
    data: {
      email: 'fan@fifa.com',
      passwordHash,
      role: 'Fan',
      memory: {
        create: {
          favoriteTeam: 'Argentina',
          favoritePlayers: ['Lionel Messi'],
          language: 'en',
          budget: 5000,
          travelStyle: 'Luxury',
          foodPreference: 'Vegan',
          accessibilityNeeds: 'None',
          seatPreference: 'Midfield',
          atmospherePreference: 'Loud',
          groupType: 'Family',
          pastTicketsSummary: 'Attended 2018 World Cup Group Stages',
          travelHistorySummary: 'Visited Russia and Brazil',
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fifa.com',
      passwordHash,
      role: 'Admin',
    },
  });

  // 3. Create Cities
  const lusail = await prisma.city.create({ data: { name: 'Lusail' } });
  const doha = await prisma.city.create({ data: { name: 'Doha' } });

  // 4. Create Venues
  const lusailStadium = await prisma.venue.create({
    data: {
      name: 'Lusail Stadium',
      cityId: lusail.id,
      info: 'Capacity: 88,966. Host of the 2022 World Cup Final. Features high-tech solar cooling technology.',
    },
  });

  const alBaytStadium = await prisma.venue.create({
    data: {
      name: 'Al Bayt Stadium',
      cityId: doha.id,
      info: 'Capacity: 68,895. Designed to resemble a traditional nomad tent. Located in Al Khor (seeded under Doha area).',
    },
  });

  // 5. Create Teams & Players
  const argentina = await prisma.team.create({
    data: {
      name: 'Argentina',
      players: {
        create: [
          { name: 'Lionel Messi' },
          { name: 'Angel Di Maria' },
          { name: 'Emiliano Martinez' },
        ],
      },
    },
  });

  const france = await prisma.team.create({
    data: {
      name: 'France',
      players: {
        create: [
          { name: 'Kylian Mbappe' },
          { name: 'Antoine Griezmann' },
          { name: 'Hugo Lloris' },
        ],
      },
    },
  });

  // 6. Create Match & Join Table
  const worldCupFinal = await prisma.match.create({
    data: {
      venueId: lusailStadium.id,
      date: new Date('2022-12-18T18:00:00Z'),
    },
  });

  await prisma.matchTeam.createMany({
    data: [
      { matchId: worldCupFinal.id, teamId: argentina.id },
      { matchId: worldCupFinal.id, teamId: france.id },
    ],
  });

  // 7. Create Seats
  const sections = ['Category 1', 'Category 2', 'Category 3'];
  const rows = ['A', 'B', 'C'];
  const seatsData = [];

  for (const section of sections) {
    for (const row of rows) {
      for (let number = 1; number <= 5; number++) {
        seatsData.push({
          matchId: worldCupFinal.id,
          section,
          row,
          number: number.toString(),
          price: section === 'Category 1' ? 450.0 : section === 'Category 2' ? 250.0 : 150.0,
          status: 'Available',
        });
      }
    }
  }

  await prisma.seat.createMany({ data: seatsData });

  // 8. Create Restaurants
  await prisma.restaurant.createMany({
    data: [
      {
        name: 'The Golden Falcon',
        cityId: doha.id,
        dietaryTags: JSON.stringify(['halal', 'vegan-options', 'gluten-free']),
        priceTier: '$$$',
        rating: 4.8,
      },
      {
        name: 'Marina Bites',
        cityId: lusail.id,
        dietaryTags: JSON.stringify(['seafood', 'halal']),
        priceTier: '$$',
        rating: 4.2,
      },
    ],
  });

  // 9. Create Knowledge Chunks (embeddings left as null, to be filled by AI service)
  await prisma.knowledgeChunk.createMany({
    data: [
      {
        sourceType: 'VenueInfo',
        title: 'Lusail Stadium Gates and Access',
        content: 'Lusail Stadium gates open 4 hours prior to kickoff. Public transport (Lusail Metro QNB station) is the recommended route. Expect strict security checkpoints.',
        metadata: JSON.stringify({ author: 'FIFA Operations', updated: '2022-12-01' }),
      },
      {
        sourceType: 'FifaFAQ',
        title: 'FIFA Ticketing Resale Rules',
        content: 'Tickets purchased through unauthorized channels are invalid. Official resale platform allows ticket transfers for up to 10% processing fee.',
        metadata: JSON.stringify({ category: 'Ticketing', legalFlag: true }),
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('Database successfully seeded!');
  // eslint-disable-next-line no-console
  console.log(`Seeded Fan User ID: ${fanUser.id}`);
  // eslint-disable-next-line no-console
  console.log(`Seeded Admin User ID: ${adminUser.id}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
