-- CreateTable
CREATE TABLE "plan_detalle_historial" (
    "id" SERIAL NOT NULL,
    "planDetalleId" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "tiempoEnSeg" INTEGER NOT NULL,
    "carga" DOUBLE PRECISION NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_detalle_historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_detalle_historial_planDetalleId_fechaDesde_idx" ON "plan_detalle_historial"("planDetalleId", "fechaDesde");

-- AddForeignKey
ALTER TABLE "plan_detalle_historial" ADD CONSTRAINT "plan_detalle_historial_planDetalleId_fkey" FOREIGN KEY ("planDetalleId") REFERENCES "plan_detalles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
