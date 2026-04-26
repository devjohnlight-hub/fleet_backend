-- CreateEnum
CREATE TYPE "VehiculeType" AS ENUM ('moto', 'voiture', 'camion', 'bus', 'autre');

-- CreateEnum
CREATE TYPE "VehiculeStatus" AS ENUM ('actif', 'maintenance', 'hors_service');

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" TEXT NOT NULL,
    "fleetOwnerId" TEXT NOT NULL,
    "type" "VehiculeType" NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" "VehiculeStatus" NOT NULL DEFAULT 'actif',
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_immatriculation_key" ON "Vehicule"("immatriculation");
