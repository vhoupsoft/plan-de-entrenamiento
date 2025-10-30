import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listPlanDias = async (req: Request, res: Response) => {
  try {
    const { planId } = req.query;
    const where = planId ? { planId: Number(planId) } : undefined;
    const dias = await prisma.planDia.findMany({ where, orderBy: { nroDia: 'asc' } });
    res.json(dias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getPlanDia = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const dia = await prisma.planDia.findUnique({ where: { id }, include: { detalles: true } });
    if (!dia) return res.status(404).json({ error: 'No encontrado' });
    res.json(dia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createPlanDia = async (req: Request, res: Response) => {
  try {
    const { planId, nroDia, descripcion } = req.body;
    if (!planId || nroDia === undefined) return res.status(400).json({ error: 'Faltan datos' });
    // ensure nroDia is not duplicated within the same plan
    const existing = await prisma.planDia.findFirst({ where: { planId: Number(planId), nroDia: Number(nroDia) } });
    if (existing) return res.status(400).json({ error: 'NroDia ya existe en el plan' });
    const dia = await prisma.planDia.create({ data: { planId: Number(planId), nroDia: Number(nroDia), descripcion } });
    res.status(201).json(dia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updatePlanDia = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nroDia, descripcion } = req.body;
    // ensure record exists
    const found = await prisma.planDia.findUnique({ where: { id } });
    if (!found) return res.status(404).json({ error: 'No encontrado' });

    // determine planId to check uniqueness (use provided planId if client allowed to change it, otherwise existing)
    const planIdToUse = (req.body.planId !== undefined) ? Number(req.body.planId) : found.planId;

    // if nroDia provided, ensure no other day in the same plan has that nroDia
    if (nroDia !== undefined) {
      const exists = await prisma.planDia.findFirst({ where: { planId: planIdToUse, nroDia: Number(nroDia), NOT: { id } } as any });
      if (exists) return res.status(400).json({ error: 'NroDia ya existe en el plan' });
    }

    const data: any = { nroDia, descripcion };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const updated = await prisma.planDia.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deletePlanDia = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.planDia.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
