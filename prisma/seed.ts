import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const roomDefs: {
  name: string;
  description: string;
  type: string;
  capacity: number;
  accessible: boolean;
  underMaintenance: boolean;
  images: string[];
}[] = [
  {
    name: "Salle 1",
    description: "Petite salle 2D avec sièges classiques",
    type: "2D",
    capacity: 18,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 2",
    description: "Salle 2D Dolby Atmos",
    type: "2D",
    capacity: 24,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 3",
    description: "Salle 3D nouvelle génération",
    type: "3D",
    capacity: 28,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 4",
    description: "Salle 3D avec lunettes fournies",
    type: "3D",
    capacity: 22,
    accessible: false,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 5",
    description: "Salle IMAX immersive",
    type: "IMAX",
    capacity: 30,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 6",
    description: "Salle VIP avec fauteuils inclinables",
    type: "VIP",
    capacity: 16,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 7",
    description: "Salle 4DX avec effets sensoriels",
    type: "4DX",
    capacity: 20,
    accessible: false,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 8",
    description: "Salle 2D standard",
    type: "2D",
    capacity: 26,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
  {
    name: "Salle 9",
    description: "Salle 2D petite capacité",
    type: "2D",
    capacity: 15,
    accessible: true,
    underMaintenance: true,
    images: [],
  },
  {
    name: "Salle 10",
    description: "Salle 3D premium",
    type: "3D",
    capacity: 25,
    accessible: true,
    underMaintenance: false,
    images: [],
  },
];

const movieDefs: { title: string; description: string; durationMin: number; genre: string; releasedAt: Date }[] = [
  {
    title: "Inception",
    description: "Un voleur s'introduit dans les rêves.",
    durationMin: 148,
    genre: "Science-fiction",
    releasedAt: new Date("2010-07-21"),
  },
  {
    title: "The Dark Knight",
    description: "Batman affronte le Joker à Gotham.",
    durationMin: 152,
    genre: "Action",
    releasedAt: new Date("2008-08-13"),
  },
  {
    title: "Interstellar",
    description: "Voyage interstellaire pour sauver l'humanité.",
    durationMin: 169,
    genre: "Science-fiction",
    releasedAt: new Date("2014-11-05"),
  },
  {
    title: "Le Voyage de Chihiro",
    description: "Une fillette dans un monde d'esprits.",
    durationMin: 125,
    genre: "Animation",
    releasedAt: new Date("2002-04-10"),
  },
  {
    title: "Parasite",
    description: "Une famille pauvre s'infiltre chez des riches.",
    durationMin: 132,
    genre: "Thriller",
    releasedAt: new Date("2019-06-05"),
  },
  {
    title: "Amélie",
    description: "Une jeune femme bouleverse la vie autour d'elle.",
    durationMin: 122,
    genre: "Comédie",
    releasedAt: new Date("2001-04-25"),
  },
  {
    title: "Dune: Part Two",
    description: "Suite de l'épopée sur Arrakis.",
    durationMin: 166,
    genre: "Science-fiction",
    releasedAt: new Date("2024-02-28"),
  },
  {
    title: "Oppenheimer",
    description: "Le père de la bombe atomique.",
    durationMin: 180,
    genre: "Biographie",
    releasedAt: new Date("2023-07-19"),
  },
  {
    title: "Past Lives",
    description: "Deux amis d'enfance se retrouvent 20 ans plus tard.",
    durationMin: 105,
    genre: "Drame",
    releasedAt: new Date("2023-09-13"),
  },
  {
    title: "The Substance",
    description: "Une star vieillissante teste un produit étrange.",
    durationMin: 141,
    genre: "Horreur",
    releasedAt: new Date("2024-11-06"),
  },
];

const userDefs: { email: string; password: string; role: UserRole; balanceCents: number }[] = [
  { email: "superadmin@cinema.test", password: "superadmin123", role: UserRole.SUPER_ADMIN, balanceCents: 0 },
  { email: "admin@cinema.test", password: "admin123", role: UserRole.ADMIN, balanceCents: 0 },
  { email: "alice@cinema.test", password: "alice123", role: UserRole.CLIENT, balanceCents: 5000 },
  { email: "bob@cinema.test", password: "bob123", role: UserRole.CLIENT, balanceCents: 1500 },
];

async function reset() {
  console.log("Wiping existing data...");
  await prisma.ticketUsage.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.session.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.room.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.employeeShift.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  console.log("Seeding users...");
  for (const def of userDefs) {
    const passwordHash = await argon2.hash(def.password);
    await prisma.user.create({
      data: { email: def.email, passwordHash, role: def.role, balanceCents: def.balanceCents },
    });
  }
}

async function seedRooms() {
  console.log("Seeding rooms...");
  await prisma.room.createMany({ data: roomDefs });
}

async function seedMovies() {
  console.log("Seeding movies...");
  await prisma.movie.createMany({ data: movieDefs });
}

function* weekdaysFrom(start: Date, count: number): Generator<Date> {
  let cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  let yielded = 0;
  while (yielded < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      yield new Date(cursor);
      yielded++;
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
}

const CLOSE_MINUTES = 20 * 60;
const minutesOfUtcDay = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();

async function seedSessions() {
  console.log("Seeding sessions for the next month of weekdays...");
  const movies = await prisma.movie.findMany();
  const rooms = await prisma.room.findMany({ where: { underMaintenance: false } });

  const slots = [
    { hour: 10, minute: 0 },
    { hour: 13, minute: 0 },
    { hour: 16, minute: 0 },
    { hour: 19, minute: 0 },
  ];

  interface SessionRow {
    movieId: string;
    roomId: string;
    startsAt: Date;
    endsAt: Date;
    priceCents: number;
  }
  const created: SessionRow[] = [];
  let cycle = 0;

  for (const day of weekdaysFrom(new Date(), 22)) {
    for (const slot of slots) {
      const movie = movies[cycle % movies.length]!;
      const room = rooms[cycle % rooms.length]!;
      cycle++;

      const startsAt = new Date(day);
      startsAt.setUTCHours(slot.hour, slot.minute, 0, 0);
      const endsAt = new Date(startsAt.getTime() + (movie.durationMin + 30) * 60 * 1000);
      if (minutesOfUtcDay(endsAt) > CLOSE_MINUTES) continue;

      const sameMovieOverlap = created.some(
        (s) => s.movieId === movie.id && s.startsAt < endsAt && s.endsAt > startsAt,
      );
      if (sameMovieOverlap) continue;

      const sameRoomOverlap = created.some((s) => s.roomId === room.id && s.startsAt < endsAt && s.endsAt > startsAt);
      if (sameRoomOverlap) continue;

      created.push({ movieId: movie.id, roomId: room.id, startsAt, endsAt, priceCents: 1000 });
    }
  }

  await prisma.session.createMany({ data: created });
  console.log(`  ${created.length.toString()} sessions created`);
}

async function main() {
  await reset();
  await seedUsers();
  await seedRooms();
  await seedMovies();
  await seedSessions();
  console.log("Done.");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
