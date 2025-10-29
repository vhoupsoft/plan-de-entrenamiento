-- CreateTable
CREATE TABLE "ejercicios" (
    "id" SERIAL NOT NULL,
    "codEjercicio" VARCHAR(50) NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esAlumno" BOOLEAN NOT NULL DEFAULT false,
    "esEntrenador" BOOLEAN NOT NULL DEFAULT false,
    "alumnoActivo" BOOLEAN NOT NULL DEFAULT true,
    "entrenadorActivo" BOOLEAN NOT NULL DEFAULT true,
    "usuario" TEXT NOT NULL,
    "clave" TEXT NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "entrenadorId" INTEGER NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_dias" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "nroDia" INTEGER NOT NULL,
    "descripcion" VARCHAR(20) NOT NULL,

    CONSTRAINT "plan_dias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_detalles" (
    "id" SERIAL NOT NULL,
    "planDiaId" INTEGER NOT NULL,
    "ejercicioId" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "tiempoEnSeg" INTEGER NOT NULL,
    "carga" DOUBLE PRECISION NOT NULL,
    "orden" INTEGER NOT NULL,
    "etapaId" INTEGER NOT NULL,

    CONSTRAINT "plan_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_usuarios" (
    "id" SERIAL NOT NULL,
    "rolId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "rol_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_dni_key" ON "personas"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "personas_usuario_key" ON "personas"("usuario");

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dias" ADD CONSTRAINT "plan_dias_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_detalles" ADD CONSTRAINT "plan_detalles_planDiaId_fkey" FOREIGN KEY ("planDiaId") REFERENCES "plan_dias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_detalles" ADD CONSTRAINT "plan_detalles_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_detalles" ADD CONSTRAINT "plan_detalles_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuarios" ADD CONSTRAINT "rol_usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuarios" ADD CONSTRAINT "rol_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
