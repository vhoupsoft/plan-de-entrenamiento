(async () => {
  const base = 'http://localhost:3000/api';
  const log = (...args) => console.log(...args);

  async function req(method, path, body) {
    try {
      const headers = body ? { 'Content-Type': 'application/json' } : {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(base + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let data = text;
      try { data = JSON.parse(text); } catch (e) {}
      log(`${method} ${path} -> ${res.status}`, data);
      return { status: res.status, data };
    } catch (err) {
      log(`ERROR ${method} ${path}`, err.message || err);
      return { status: 0, data: null };
    }
  }

  // Keep track of created ids for cleanup
  const created = { personas: [], etapas: [], planes: [], dias: [] };

  // Authenticate as seeded admin (fallback password 'adminpass')
  let token = null;
  log('\n-- Auth: logging as admin --');
  const loginRes = await req('POST', '/auth/login', { usuario: 'admin', clave: process.env.SEED_ADMIN_PASS || 'adminpass' });
  if (loginRes.status === 200 && loginRes.data && loginRes.data.token) {
    token = loginRes.data.token;
    log('Logged in as admin, token received');
  } else {
    log('Login failed or no token received; protected endpoints will return 401');
  }

  // Persona tests
  log('\n-- Personas test --');
  const pA = await req('POST', '/personas', { dni: '1111', nombre: 'Persona A', usuario: 'personaA', clave: 'pass123' });
  if (pA.status === 201 && pA.data && pA.data.id) created.personas.push(pA.data.id);
  const pB = await req('POST', '/personas', { dni: '2222', nombre: 'Persona B', usuario: 'personaB', clave: 'pass123' });
  if (pB.status === 201 && pB.data && pB.data.id) created.personas.push(pB.data.id);

  // Attempt to update B to have usuario of A -> should fail 400
  if (pB.data && pB.data.id && pA.data && pA.data.usuario) {
    await req('PUT', `/personas/${pB.data.id}`, { usuario: pA.data.usuario });
    await req('PUT', `/personas/${pB.data.id}`, { dni: pA.data.dni });
  } else {
    log('Skipping persona update checks due to earlier creation failure');
  }

  // Etapa tests
  log('\n-- Etapas test --');
  const eA = await req('POST', '/etapas', { descripcion: 'EtapaX', orden: 1 });
  if (eA.status === 201 && eA.data && eA.data.id) created.etapas.push(eA.data.id);
  const eB = await req('POST', '/etapas', { descripcion: 'EtapaY', orden: 2 });
  if (eB.status === 201 && eB.data && eB.data.id) created.etapas.push(eB.data.id);

  if (eB.data && eB.data.id && eA.data && eA.data.descripcion) {
    await req('PUT', `/etapas/${eB.data.id}`, { descripcion: eA.data.descripcion });
  } else {
    log('Skipping etapa update checks due to earlier creation failure');
  }

  // PlanDia tests
  log('\n-- PlanDias test --');
  // Need a plan: use created personas as alumno and entrenador
  if (created.personas.length >= 2) {
    const alumnoId = created.personas[0];
    const entrenadorId = created.personas[1];
    const plan = await req('POST', '/planes', { alumnoId, entrenadorId, activo: false });
    if (plan.status === 201 && plan.data && plan.data.id) created.planes.push(plan.data.id);

    if (plan.data && plan.data.id) {
      const planId = plan.data.id;
      const d1 = await req('POST', '/plan-dias', { planId, nroDia: 1, descripcion: 'Dia 1' });
      if (d1.status === 201 && d1.data && d1.data.id) created.dias.push(d1.data.id);
      const d2 = await req('POST', '/plan-dias', { planId, nroDia: 2, descripcion: 'Dia 2' });
      if (d2.status === 201 && d2.data && d2.data.id) created.dias.push(d2.data.id);

      // Attempt to update d2 to nroDia 1 -> should fail 400
      if (d2.data && d2.data.id) {
        await req('PUT', `/plan-dias/${d2.data.id}`, { nroDia: 1 });
      }
    }
  } else {
    log('Not enough personas to create a plan; skipping PlanDias checks');
  }

  // Cleanup created resources (best-effort, ignore failures)
  log('\n-- Cleanup created resources (best effort) --');
  for (const id of created.dias) {
    await req('DELETE', `/plan-dias/${id}`);
  }
  for (const id of created.planes) {
    await req('DELETE', `/planes/${id}`);
  }
  for (const id of created.etapas) {
    await req('DELETE', `/etapas/${id}`);
  }
  for (const id of created.personas) {
    await req('DELETE', `/personas/${id}`);
  }

  log('\n-- Tests finished --');
})();
