const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config({ path: './prisma/.env' });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const BASE = process.env.BASE_URL || 'http://localhost:3000';

(async function main(){
  console.log('Starting E2E script...');
  try{
    // Ensure role
    let rol = await prisma.rol.findFirst({ where: { descripcion: 'Entrenador' } });
    if (!rol) rol = await prisma.rol.create({ data: { descripcion: 'Entrenador' } });

    // Create entrenador user
    const entrenador = await prisma.persona.create({
      data: {
        nombre: `E2E Entrenador ${Date.now()}`,
        usuario: `e2e_ent_${Date.now()}`,
        dni: `${Date.now() % 100000000}`,
        clave: 'x',
        esEntrenador: true,
      }
    });
    await prisma.rolUsuario.create({ data: { rolId: rol.id, usuarioId: entrenador.id } });

    // Create alumno
    const alumno = await prisma.persona.create({ data: { nombre: `E2E Alumno ${Date.now()}`, usuario: `e2e_al_${Date.now()}`, dni: `${(Date.now()+1) % 100000000}`, clave: 'x', esAlumno: true } });

    // Create plan and day
    const plan = await prisma.plan.create({ data: { alumnoId: alumno.id, entrenadorId: entrenador.id, fechaDesde: new Date(), activo: true } });
    const dia = await prisma.planDia.create({ data: { planId: plan.id, nroDia: 1, descripcion: 'E2E Dia 1' } });

    // Create ejercicio
    const ej = await prisma.ejercicio.create({ data: { codEjercicio: `E2E-${Date.now()}`, descripcion: 'E2E ejercicio' } });

    // Generate token
    const token = jwt.sign({ sub: String(entrenador.id) }, JWT_SECRET);

    // Prepare payload for plan-detalle including fechaDesde (today)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const dd = String(today.getDate()).padStart(2,'0');
    const fechaStr = `${yyyy}-${mm}-${dd}`;

    const payload = {
      planDiaId: dia.id,
      ejercicioId: ej.id,
      series: 4,
      repeticiones: 8,
      tiempoEnSeg: 0,
      carga: 30,
      orden: 1,
      fechaDesde: fechaStr,
    };

    console.log('Posting plan-detalle to', `${BASE}/api/plan-detalles`);
    const res = await fetch(`${BASE}/api/plan-detalles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    console.log('POST /api/plan-detalles status', res.status);
    console.log('Response body:', body);

    if (res.status !== 201) {
      throw new Error('Failed to create planDetalle');
    }

    const detalleId = body.id;

    // fetch actual historial via endpoint
    const res2 = await fetch(`${BASE}/api/plan-detalles/${detalleId}/actual`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const actual = await res2.json();
    console.log('GET /api/plan-detalles/:id/actual status', res2.status);
    console.log('Actual historial:', actual);

    // DB check
    const hists = await prisma.planDetalleHistorial.findMany({ where: { planDetalleId: detalleId } });
    console.log('Historial rows in DB for detalle:', hists.length, hists.map(h => ({id: h.id, fechaDesde: h.fechaDesde.toISOString(), series: h.series, carga: h.carga}))); 

    console.log('E2E script completed successfully. Cleaning up created records...');

    // Cleanup: remove detalle, historial, dia, plan, rolUsuario, personas, ejercicio
    try {
      await prisma.planDetalleHistorial.deleteMany({ where: { planDetalleId: detalleId } });
    } catch (e) { console.warn('cleanup historial failed', e); }
    try {
      await prisma.planDetalle.deleteMany({ where: { id: detalleId } });
    } catch (e) { console.warn('cleanup detalle failed', e); }
    try {
      await prisma.planDia.delete({ where: { id: dia.id } });
    } catch (e) { console.warn('cleanup dia failed', e); }
    try {
      await prisma.plan.delete({ where: { id: plan.id } });
    } catch (e) { console.warn('cleanup plan failed', e); }

    try {
      await prisma.rolUsuario.deleteMany({ where: { usuarioId: { in: [alumno.id, entrenador.id] } } });
    } catch (e) { console.warn('cleanup rolUsuario failed', e); }

    try {
      await prisma.persona.deleteMany({ where: { id: { in: [alumno.id, entrenador.id] } } });
    } catch (e) { console.warn('cleanup persona failed', e); }

    try {
      await prisma.ejercicio.delete({ where: { id: ej.id } });
    } catch (e) { console.warn('cleanup ejercicio failed', e); }

    console.log('Cleanup attempts finished.');
  } catch (err) {
    console.error('E2E script error:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
