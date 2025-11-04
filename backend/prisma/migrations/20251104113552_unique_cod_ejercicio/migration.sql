/*
  Warnings:

  - A unique constraint covering the columns `[codEjercicio]` on the table `ejercicios` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ejercicios_codEjercicio_key" ON "ejercicios"("codEjercicio");
