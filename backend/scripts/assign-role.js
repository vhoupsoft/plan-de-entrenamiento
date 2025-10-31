const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './prisma/.env' });

const prisma = new PrismaClient();

async function main() {
  const userId = 25; // User ID to assign role
  const roleName = 'Entrenador'; // Role to assign
  
  console.log(`\n=== Assigning "${roleName}" role to user ${userId} ===\n`);
  
  // Get user
  const user = await prisma.persona.findUnique({ 
    where: { id: userId },
    select: { id: true, nombre: true, usuario: true }
  });
  
  if (!user) {
    console.log(`❌ User with ID ${userId} not found`);
    return;
  }
  
  console.log('User found:', user);
  
  // Get role
  const role = await prisma.rol.findFirst({
    where: { descripcion: roleName }
  });
  
  if (!role) {
    console.log(`❌ Role "${roleName}" not found`);
    return;
  }
  
  console.log('Role found:', role);
  
  // Check if already assigned
  const existing = await prisma.rolUsuario.findFirst({
    where: { usuarioId: userId, rolId: role.id }
  });
  
  if (existing) {
    console.log(`ℹ️  Role already assigned (RolUsuario ID: ${existing.id})`);
  } else {
    // Assign role
    const assignment = await prisma.rolUsuario.create({
      data: { usuarioId: userId, rolId: role.id }
    });
    
    console.log(`✅ Role assigned successfully! (RolUsuario ID: ${assignment.id})`);
  }
  
  // Verify
  console.log('\n=== Verification ===');
  const roleAssignments = await prisma.rolUsuario.findMany({
    where: { usuarioId: userId },
    include: { rol: true }
  });
  
  console.log('User now has the following roles:');
  roleAssignments.forEach(ra => {
    console.log(`  - ${ra.rol.descripcion}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
