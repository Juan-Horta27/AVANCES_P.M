-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('paciente', 'profesional');

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "rol" "rol_usuario" NOT NULL DEFAULT 'paciente';
