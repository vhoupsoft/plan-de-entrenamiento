import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prismaClient';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

describe('PlanDetalle + Historial', () => {
  let token: string;
  let entrenadorId: number;
  let planId: number;
  let planDiaId: number;
  let ejercicioId: number;

  beforeAll(async () => {
    // create role Entrenador if not exists
    let rol = await prisma.rol.findFirst({ where: { descripcion: 'Entrenador' } });
    if (!rol) rol = await prisma.rol.create({ data: { descripcion: 'Entrenador' } });

    const usuario = await prisma.persona.create({
      data: {
        nombre: 'Tester Entrenador',
        usuario: `test_ent_${Date.now()}`,
        dni: '99999999',
        clave: 'x',
        esEntrenador: true,
      },
    });
    entrenadorId = usuario.id;
    await prisma.rolUsuario.create({ data: { rolId: rol.id, usuarioId: entrenadorId } });

    token = jwt.sign({ sub: String(entrenadorId) }, JWT_SECRET);

    // create a plan and a planDia
  const alumno = await prisma.persona.create({ data: { nombre: 'Alumno Test', usuario: `al_${Date.now()}`, dni: `9${Date.now() % 100000000}`, clave: 'x', esAlumno: true } });
    const plan = await prisma.plan.create({ data: { alumnoId: alumno.id, entrenadorId, fechaDesde: new Date(), activo: true } });
    planId = plan.id;
    const dia = await prisma.planDia.create({ data: { planId, nroDia: 1, descripcion: 'Dia 1' } });
    planDiaId = dia.id;

    const ej = await prisma.ejercicio.create({ data: { codEjercicio: `T-${Date.now()}`, descripcion: 'Ej test' } });
    ejercicioId = ej.id;
  });

  afterAll(async () => {
    await prisma.planDetalleHistorial.deleteMany({ where: { } });
    await prisma.planDetalle.deleteMany({ where: { } });
    await prisma.planDia.deleteMany({ where: { } });
    await prisma.plan.deleteMany({ where: { } });
    await prisma.ejercicio.deleteMany({ where: { descripcion: 'Ej test' } });
    await prisma.rolUsuario.deleteMany({ where: { usuarioId: entrenadorId } });
    await prisma.persona.deleteMany({ where: { id: { in: [entrenadorId] } } });
    await prisma.$disconnect();
  });

  test('crear planDetalle crea historial obligatorio', async () => {
    const payload = {
      planDiaId,
      ejercicioId,
      series: 3,
      repeticiones: 10,
      tiempoEnSeg: 0,
      carga: 20,
      orden: 1,
      fechaDesde: (new Date()).toISOString().slice(0,10),
    };

    const res = await request(app)
      .post('/api/plan-detalles')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    const detalleId = res.body.id;
    expect(detalleId).toBeTruthy();

    // check historial exists
    const hist = await prisma.planDetalleHistorial.findFirst({ where: { planDetalleId: detalleId } });
    expect(hist).not.toBeNull();
    expect(hist?.series).toBe(3);
    expect(hist?.carga).toBe(20);
  });
});
