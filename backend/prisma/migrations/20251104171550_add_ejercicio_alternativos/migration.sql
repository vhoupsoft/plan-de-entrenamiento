-- CreateTable
CREATE TABLE "ejercicio_alternativos" (
    "id" SERIAL NOT NULL,
    "ejercicioId" INTEGER NOT NULL,
    "ejercicioAlternativoId" INTEGER NOT NULL,

    CONSTRAINT "ejercicio_alternativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ejercicio_alternativos_ejercicioId_ejercicioAlternativoId_key" ON "ejercicio_alternativos"("ejercicioId", "ejercicioAlternativoId");

-- AddForeignKey
ALTER TABLE "ejercicio_alternativos" ADD CONSTRAINT "ejercicio_alternativos_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicio_alternativos" ADD CONSTRAINT "ejercicio_alternativos_ejercicioAlternativoId_fkey" FOREIGN KEY ("ejercicioAlternativoId") REFERENCES "ejercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
