import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listPlanDetalles = async (req: Request, res: Response) => {
  try {
    const { planDiaId } = req.query;
    const where = planDiaId ? { planDiaId: Number(planDiaId) } : undefined;
    const detalles = await prisma.planDetalle.findMany({ where, orderBy: { orden: 'asc' } });
    res.json(detalles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getPlanDetalle = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const detalle = await prisma.planDetalle.findUnique({ where: { id } });
    if (!detalle) return res.status(404).json({ error: 'No encontrado' });
    res.json(detalle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createPlanDetalle = async (req: Request, res: Response) => {
  try {
    const { planDiaId, ejercicioId, series, repeticiones, tiempoEnSeg, carga, orden, etapaId, fechaDesde } = req.body;
    if (!planDiaId || !ejercicioId) return res.status(400).json({ error: 'Faltan datos' });
    
    const seriesVal = series ? Number(series) : 0;
    const repeticionesVal = repeticiones ? Number(repeticiones) : 0;
    const tiempoEnSegVal = tiempoEnSeg ? Number(tiempoEnSeg) : 0;
    const cargaVal = carga ? Number(carga) : 0;
    
    const data = {
      planDiaId: Number(planDiaId),
      ejercicioId: Number(ejercicioId),
      series: seriesVal,
      repeticiones: repeticionesVal,
      tiempoEnSeg: tiempoEnSegVal,
      carga: cargaVal,
      orden: orden ? Number(orden) : 0,
      etapaId: etapaId && etapaId !== '' ? Number(etapaId) : null,
    } as any;
    if (data.etapaId === null) delete data.etapaId;
    
    // Crear detalle y registro inicial en historial en una transacción para que sea obligatorio
    const fechaInicial = fechaDesde ? new Date(fechaDesde) : new Date();
    const [detalle] = await prisma.$transaction([
      prisma.planDetalle.create({ data }),
      // We'll create the historial in the transaction after getting detalle id
    ]);

    // Now create historial referencing the created detalle within a second transaction step
    // Prisma doesn't support dependent operations inside the same $transaction array easily,
    // so use a nested transaction to ensure atomicity by running an interactive transaction.
    await prisma.$transaction(async (tx) => {
      // Re-create the detalle record inside the interactive transaction to ensure consistency
      // (we'll update the existing one instead of creating duplicates)
      await tx.planDetalle.update({ where: { id: detalle.id }, data: {} });
      await tx.planDetalleHistorial.create({
        data: {
          planDetalleId: detalle.id,
          series: seriesVal,
          repeticiones: repeticionesVal,
          tiempoEnSeg: tiempoEnSegVal,
          carga: cargaVal,
          fechaDesde: fechaInicial,
        },
      });
    });

    res.status(201).json(detalle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updatePlanDetalle = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body } as any;
    // Extract optional fechaDesde for historial
    const fechaDesde = payload.fechaDesde;
    delete payload.fechaDesde;
    // Convert etapaId: if empty string, set to null
    if ('etapaId' in payload) {
      payload.etapaId = payload.etapaId && payload.etapaId !== '' ? Number(payload.etapaId) : null;
    }
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    // If fechaDesde is provided and any of the tracked fields changed, run in transaction to update and create historial
    const trackedFields = ['series', 'repeticiones', 'tiempoEnSeg', 'carga'];
    const isTrackedChanging = trackedFields.some((f) => f in payload);

    if (fechaDesde && isTrackedChanging) {
      const fecha = new Date(fechaDesde);
      const updated = await prisma.$transaction(async (tx) => {
        const upd = await tx.planDetalle.update({ where: { id }, data: payload });
        await tx.planDetalleHistorial.create({
          data: {
            planDetalleId: id,
            series: typeof payload.series !== 'undefined' ? Number(payload.series) : upd.series,
            repeticiones: typeof payload.repeticiones !== 'undefined' ? Number(payload.repeticiones) : upd.repeticiones,
            tiempoEnSeg: typeof payload.tiempoEnSeg !== 'undefined' ? Number(payload.tiempoEnSeg) : upd.tiempoEnSeg,
            carga: typeof payload.carga !== 'undefined' ? Number(payload.carga) : upd.carga,
            fechaDesde: fecha,
          },
        });
        return upd;
      });
      return res.json(updated);
    }

    // default: simple update
    const updated = await prisma.planDetalle.update({ where: { id }, data: payload });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deletePlanDetalle = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.planDetalle.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
