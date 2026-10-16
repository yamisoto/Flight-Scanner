-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "iata" TEXT NOT NULL,
    "icao" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airlines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iata" TEXT,
    "icao" TEXT,
    "operationalStatus" TEXT NOT NULL DEFAULT 'unknown',
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_searches" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "tripType" TEXT NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "cabinClass" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_status_observations" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "airlineIata" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "serviceDate" DATE NOT NULL,
    "scheduledDepartureUtc" TIMESTAMP(3) NOT NULL,
    "actualDepartureUtc" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAtUtc" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_status_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "airports_iata_key" ON "airports"("iata");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_iata_key" ON "airlines"("iata");

-- CreateIndex
CREATE INDEX "flight_searches_origin_destination_idx" ON "flight_searches"("origin", "destination");

-- CreateIndex
CREATE INDEX "flight_searches_createdAt_idx" ON "flight_searches"("createdAt");

-- CreateIndex
CREATE INDEX "flight_status_observations_airlineIata_origin_destination_s_idx" ON "flight_status_observations"("airlineIata", "origin", "destination", "scheduledDepartureUtc");

-- CreateIndex
CREATE UNIQUE INDEX "flight_status_observations_flightNumber_origin_serviceDate_key" ON "flight_status_observations"("flightNumber", "origin", "serviceDate");
