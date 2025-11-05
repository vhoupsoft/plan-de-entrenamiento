const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.persona.findMany({
    include: {
      rolesUsuario: {
        include: {
          rol: true
        }
      }
    }
  });
  
  console.log('\n=== Usuarios y sus roles ===\n');
  
  for (const user of usuarios) {
    console.log(`ID: ${user.id}`);
    console.log(`Nombre: ${user.nombre}`);
    console.log(`Usuario: ${user.usuario}`);
    console.log(`Es Alumno: ${user.esAlumno}`);
    console.log(`Es Entrenador: ${user.esEntrenador}`);
    console.log(`Roles asignados (${user.rolesUsuario.length}):`);
    user.rolesUsuario.forEach(ra => {
      console.log(`  - ${ra.rol.descripcion} (Rol ID: ${ra.rolId})`);
    });
    console.log('---\n');
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
