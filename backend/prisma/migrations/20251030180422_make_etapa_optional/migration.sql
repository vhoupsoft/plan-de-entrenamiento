-- DropForeignKey
ALTER TABLE "public"."plan_detalles" DROP CONSTRAINT "plan_detalles_etapaId_fkey";

-- AlterTable
ALTER TABLE "plan_detalles" ALTER COLUMN "etapaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "plan_detalles" ADD CONSTRAINT "plan_detalles_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
