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
    const { planDiaId, ejercicioId, series, repeticiones, tiempoEnSeg, carga, orden, etapaId } = req.body;
    if (!planDiaId || !ejercicioId) return res.status(400).json({ error: 'Faltan datos' });
    const data = {
      planDiaId: Number(planDiaId),
      ejercicioId: Number(ejercicioId),
      series: series ? Number(series) : 0,
      repeticiones: repeticiones ? Number(repeticiones) : 0,
      tiempoEnSeg: tiempoEnSeg ? Number(tiempoEnSeg) : 0,
      carga: carga ? Number(carga) : 0,
      orden: orden ? Number(orden) : 0,
      etapaId: etapaId ? Number(etapaId) : undefined,
    } as any;
    if (data.etapaId === undefined) delete data.etapaId;
    const detalle = await prisma.planDetalle.create({ data });
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
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
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
