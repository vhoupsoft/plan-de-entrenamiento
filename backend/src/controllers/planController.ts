import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Helper to deactivate previous active plans for the same alumno
const deactivatePreviousActivePlans = async (alumnoId: number) => {
  const now = new Date();
  await prisma.plan.updateMany({
    where: { alumnoId, activo: true },
    data: { activo: false, fechaHasta: now },
  });
};

export const listPlanes = async (req: Request, res: Response) => {
  try {
    const planes = await prisma.plan.findMany({
      include: { alumno: true, entrenador: true, dias: true },
      orderBy: { fechaDesde: 'desc' },
    });
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const plan = await prisma.plan.findUnique({ where: { id }, include: { dias: { include: { detalles: true } } } });
    if (!plan) return res.status(404).json({ error: 'No encontrado' });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { alumnoId, entrenadorId, activo } = req.body;
    if (!alumnoId || !entrenadorId) return res.status(400).json({ error: 'Faltan datos' });

    if (activo) {
      // deactivate previous active plans for the alumno
      await deactivatePreviousActivePlans(Number(alumnoId));
    }

    const now = new Date();
    const plan = await prisma.plan.create({
      data: {
        alumnoId: Number(alumnoId),
        entrenadorId: Number(entrenadorId),
        fechaDesde: activo ? now : now,
        fechaHasta: null,
        activo: !!activo,
      },
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { activo } = req.body;

    const data: any = { ...req.body };
    // if activating this plan, deactivate others
    if (activo) {
      const plan = await prisma.plan.findUnique({ where: { id } });
      if (plan) await deactivatePreviousActivePlans(plan.alumnoId);
      data.fechaDesde = data.fechaDesde || new Date();
      data.fechaHasta = null;
    } else if (activo === false) {
      data.fechaHasta = new Date();
    }

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const updated = await prisma.plan.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.plan.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
