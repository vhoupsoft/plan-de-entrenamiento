const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './prisma/.env' });

const prisma = new PrismaClient();

async function main() {
  const userId = 25; // Change this to the user ID you want to check
  
  console.log('\n=== Checking User Roles ===\n');
  
  // Get user info
  const user = await prisma.persona.findUnique({ 
    where: { id: userId },
    select: { id: true, nombre: true, usuario: true, esEntrenador: true, esAlumno: true }
  });
  
  if (!user) {
    console.log(`User with ID ${userId} not found`);
    return;
  }
  
  console.log('User:', user);
  
  // Get all roles
  console.log('\n=== All Roles in Database ===');
  const allRoles = await prisma.rol.findMany();
  allRoles.forEach(r => console.log(`ID: ${r.id}, Descripcion: "${r.descripcion}"`));
  
  // Get user's role assignments
  console.log('\n=== User Role Assignments ===');
  const roleAssignments = await prisma.rolUsuario.findMany({
    where: { usuarioId: userId },
    include: { rol: true }
  });
  
  if (roleAssignments.length === 0) {
    console.log('No roles assigned to this user!');
  } else {
    roleAssignments.forEach(ra => {
      console.log(`RolUsuario ID: ${ra.id}, RolId: ${ra.rolId}, Rol: "${ra.rol.descripcion}"`);
    });
  }
  
  // Test the middleware logic
  console.log('\n=== Testing Middleware Logic ===');
  const testResult = await prisma.rolUsuario.findFirst({
    where: { 
      usuarioId: userId, 
      rol: { descripcion: { in: ['Entrenador', 'Admin'] } } 
    },
    include: { rol: true },
  });
  
  if (testResult) {
    console.log('✓ User would pass requireRole("Entrenador", "Admin")');
    console.log('  Found role:', testResult.rol.descripcion);
  } else {
    console.log('✗ User would NOT pass requireRole("Entrenador", "Admin")');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
