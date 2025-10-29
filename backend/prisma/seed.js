const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './prisma/.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  const roles = ['Admin', 'Entrenador', 'Alumno'];
  for (const descripcion of roles) {
    const exists = await prisma.rol.findFirst({ where: { descripcion } });
    if (!exists) {
      await prisma.rol.create({ data: { descripcion } });
    }
  }
  console.log('Roles created/ensured:', roles.join(', '));

  const adminUserData = {
    dni: '00000000',
    nombre: 'Administrador',
    usuario: 'admin',
    clave: await bcrypt.hash(process.env.SEED_ADMIN_PASS || 'adminpass', 10),
    esAlumno: false,
    esEntrenador: false,
    alumnoActivo: false,
    entrenadorActivo: false,
  };

  const admin = await prisma.persona.upsert({
    where: { usuario: adminUserData.usuario },
    update: { nombre: adminUserData.nombre },
    create: adminUserData,
  });

  console.log('Admin user ensured:', admin.usuario, 'id=', admin.id);

  const adminRol = await prisma.rol.findFirst({ where: { descripcion: 'Admin' } });
  if (!adminRol) throw new Error('Admin role not found after upsert');

  const asign = await prisma.rolUsuario.findFirst({ where: { rolId: adminRol.id, usuarioId: admin.id } });
  if (!asign) {
    await prisma.rolUsuario.create({ data: { rolId: adminRol.id, usuarioId: admin.id } });
    console.log('Assigned Admin role to user', admin.usuario);
  } else {
    console.log('Admin role already assigned to user', admin.usuario);
  }

  console.log('Seed finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
