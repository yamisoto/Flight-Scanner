// Seeds the airport and airline reference tables from the TypeScript
// datasets in src/lib/data, which stay the source of truth. Safe to re-run:
// rows are upserted by IATA code.
//   npx prisma db seed
import { PrismaClient } from "@prisma/client";
import { AIRLINES } from "../src/lib/data/airlines";
import { AIRPORTS } from "../src/lib/data/airports";

const prisma = new PrismaClient();

async function main() {
  for (const a of AIRPORTS) {
    const data = { icao: a.icao, name: a.name, city: a.city, state: a.state, verified: a.verified };
    await prisma.airport.upsert({ where: { iata: a.iata }, create: { iata: a.iata, ...data }, update: data });
  }
  let airlines = 0;
  for (const a of AIRLINES) {
    if (!a.iata) continue; // the table is keyed by IATA code; airlines without one stay in code only
    const data = { name: a.name, icao: a.icao, operationalStatus: a.operationalStatus, verified: a.verified };
    await prisma.airline.upsert({ where: { iata: a.iata }, create: { iata: a.iata, ...data }, update: data });
    airlines++;
  }
  console.log(`Seeded ${AIRPORTS.length} airports and ${airlines} airlines.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
