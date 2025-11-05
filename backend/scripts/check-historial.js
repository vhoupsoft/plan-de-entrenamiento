const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar ejercicio "Jalón al pecho"
  const ejercicio = await prisma.ejercicio.findFirst({
    where: {
      codEjercicio: {
        contains: 'Jalón',
        mode: 'insensitive'
      }
    }
  });
  
  console.log('Ejercicio encontrado:', ejercicio);
  
  if (ejercicio) {
    // Buscar planDetalles asociados
    const detalles = await prisma.planDetalle.findMany({
      where: { ejercicioId: ejercicio.id },
      include: {
        planDia: {
          include: {
            plan: {
              include: {
                alumno: true
              }
            }
          }
        }
      }
    });
    
    console.log('\nDetalles encontrados:', detalles.length);
    
    for (const detalle of detalles) {
      console.log(`\n--- PlanDetalle ID: ${detalle.id} ---`);
      console.log(`Alumno: ${detalle.planDia.plan.alumno.nombre}`);
      console.log(`Plan: ${detalle.planDia.plan.titulo}`);
      console.log(`Día: ${detalle.planDia.numeroDia}`);
      console.log(`Valores base: series=${detalle.series}, reps=${detalle.repeticiones}, tiempo=${detalle.tiempoEnSeg}, carga=${detalle.carga}`);
      
      // Buscar historial
      const historial = await prisma.planDetalleHistorial.findMany({
        where: { planDetalleId: detalle.id },
        orderBy: { fechaDesde: 'desc' }
      });
      
      console.log(`Historial (${historial.length} registros):`);
      historial.forEach(h => {
        console.log(`  - ID: ${h.id}, Fecha: ${h.fechaDesde.toISOString().split('T')[0]}, series=${h.series}, reps=${h.repeticiones}, tiempo=${h.tiempoEnSeg}, carga=${h.carga}`);
      });
    }
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
