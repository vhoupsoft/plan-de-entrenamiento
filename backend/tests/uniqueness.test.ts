import request from 'supertest';
import app from '../src/app';

describe('Uniqueness checks (integration - app instance)', () => {
  let token: string | null = null;
  const created: { personas: number[]; etapas: number[]; planes: number[]; dias: number[] } = { personas: [], etapas: [], planes: [], dias: [] };

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ usuario: 'admin', clave: 'adminpass' });
    expect([200, 201]).toContain(loginRes.status);
    token = loginRes.body.token;
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    for (const id of created.dias) {
      await request(app).delete(`/api/plan-dias/${id}`).set('Authorization', `Bearer ${token}`);
    }
    for (const id of created.planes) {
      await request(app).delete(`/api/planes/${id}`).set('Authorization', `Bearer ${token}`);
    }
    for (const id of created.etapas) {
      await request(app).delete(`/api/etapas/${id}`).set('Authorization', `Bearer ${token}`);
    }
    for (const id of created.personas) {
      await request(app).delete(`/api/personas/${id}`).set('Authorization', `Bearer ${token}`);
    }
  });

  test('Personas: cannot update to existing usuario or dni', async () => {
    const t = Date.now();
    const aRes = await request(app).post('/api/personas').set('Authorization', `Bearer ${token}`).send({ dni: `9${t}`, nombre: 'P A', usuario: `pa${t}`, clave: 'pass' });
    expect(aRes.status).toBe(201);
    const aId = aRes.body.id; created.personas.push(aId);

    const bRes = await request(app).post('/api/personas').set('Authorization', `Bearer ${token}`).send({ dni: `8${t}`, nombre: 'P B', usuario: `pb${t}`, clave: 'pass' });
    expect(bRes.status).toBe(201);
    const bId = bRes.body.id; created.personas.push(bId);

    const upd1 = await request(app).put(`/api/personas/${bId}`).set('Authorization', `Bearer ${token}`).send({ usuario: aRes.body.usuario });
    expect(upd1.status).toBe(400);
    expect(upd1.body.error).toBeDefined();

    const upd2 = await request(app).put(`/api/personas/${bId}`).set('Authorization', `Bearer ${token}`).send({ dni: aRes.body.dni });
    expect(upd2.status).toBe(400);
    expect(upd2.body.error).toBeDefined();
  });

  test('Etapas: cannot update descripcion to existing one', async () => {
    const resA = await request(app).post('/api/etapas').set('Authorization', `Bearer ${token}`).send({ descripcion: 'EtapaTestA', orden: 1 });
    expect(resA.status).toBe(201);
    created.etapas.push(resA.body.id);

    const resB = await request(app).post('/api/etapas').set('Authorization', `Bearer ${token}`).send({ descripcion: 'EtapaTestB', orden: 2 });
    expect(resB.status).toBe(201);
    created.etapas.push(resB.body.id);

    const upd = await request(app).put(`/api/etapas/${resB.body.id}`).set('Authorization', `Bearer ${token}`).send({ descripcion: resA.body.descripcion });
    expect(upd.status).toBe(400);
    expect(upd.body.error).toBeDefined();
  });

  test('PlanDias: cannot set nroDia duplicated within same plan', async () => {
    const t = Date.now();
    const p1 = await request(app).post('/api/personas').set('Authorization', `Bearer ${token}`).send({ dni: `7${t}`, nombre: 'Alu1', usuario: `alu1${t}`, clave: 'pass' });
    expect(p1.status).toBe(201); created.personas.push(p1.body.id);
    const p2 = await request(app).post('/api/personas').set('Authorization', `Bearer ${token}`).send({ dni: `6${t}`, nombre: 'Entr1', usuario: `ent1${t}`, clave: 'pass' });
    expect(p2.status).toBe(201); created.personas.push(p2.body.id);

    const plan = await request(app).post('/api/planes').set('Authorization', `Bearer ${token}`).send({ alumnoId: p1.body.id, entrenadorId: p2.body.id, activo: false });
    expect(plan.status).toBe(201); created.planes.push(plan.body.id);

    const d1 = await request(app).post('/api/plan-dias').set('Authorization', `Bearer ${token}`).send({ planId: plan.body.id, nroDia: 1, descripcion: 'D1' });
    expect(d1.status).toBe(201); created.dias.push(d1.body.id);
    const d2 = await request(app).post('/api/plan-dias').set('Authorization', `Bearer ${token}`).send({ planId: plan.body.id, nroDia: 2, descripcion: 'D2' });
    expect(d2.status).toBe(201); created.dias.push(d2.body.id);

    const upd = await request(app).put(`/api/plan-dias/${d2.body.id}`).set('Authorization', `Bearer ${token}`).send({ nroDia: 1 });
    expect(upd.status).toBe(400);
    expect(upd.body.error).toBeDefined();
  });
});
