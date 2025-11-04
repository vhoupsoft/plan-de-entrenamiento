const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './prisma/.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Creando usuario Admin ===\n');
  
  // Verificar si ya existe un usuario admin
  const existingAdmin = await prisma.persona.findFirst({
    where: { usuario: 'admin' }
  });
  
  if (existingAdmin) {
    console.log('⚠️  Ya existe un usuario con username "admin" (ID:', existingAdmin.id, ')');
    console.log('Nombre:', existingAdmin.nombre);
    
    // Verificar si tiene el rol Admin
    const adminRole = await prisma.rol.findFirst({
      where: { descripcion: 'Admin' }
    });
    
    if (adminRole) {
      const hasAdminRole = await prisma.rolUsuario.findFirst({
        where: { usuarioId: existingAdmin.id, rolId: adminRole.id }
      });
      
      if (hasAdminRole) {
        console.log('✅ El usuario ya tiene el rol Admin asignado');
        return;
      } else {
        console.log('⚠️  El usuario NO tiene el rol Admin, asignando...');
        await prisma.rolUsuario.create({
          data: { usuarioId: existingAdmin.id, rolId: adminRole.id }
        });
        console.log('✅ Rol Admin asignado correctamente');
        return;
      }
    }
  }
  
  // Crear nuevo usuario admin
  console.log('Creando nuevo usuario admin...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const newAdmin = await prisma.persona.create({
    data: {
      dni: '00000000',
      nombre: 'Administrador',
      usuario: 'admin',
      clave: hashedPassword,
      esAlumno: false,
      esEntrenador: false,
      alumnoActivo: false,
      entrenadorActivo: false,
    }
  });
  
  console.log('✅ Usuario creado:', newAdmin);
  
  // Buscar o crear el rol Admin
  let adminRole = await prisma.rol.findFirst({
    where: { descripcion: 'Admin' }
  });
  
  if (!adminRole) {
    console.log('Creando rol Admin...');
    adminRole = await prisma.rol.create({
      data: { descripcion: 'Admin' }
    });
    console.log('✅ Rol Admin creado:', adminRole);
  } else {
    console.log('Rol Admin encontrado:', adminRole);
  }
  
  // Asignar rol Admin al usuario
  const roleAssignment = await prisma.rolUsuario.create({
    data: {
      usuarioId: newAdmin.id,
      rolId: adminRole.id
    }
  });
  
  console.log('✅ Rol Admin asignado al usuario:', roleAssignment);
  
  console.log('\n=== Usuario Admin creado correctamente ===');
  console.log('Usuario: admin');
  console.log('Clave: admin123');
  console.log('\n⚠️  IMPORTANTE: Cambiá la clave después de iniciar sesión\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
