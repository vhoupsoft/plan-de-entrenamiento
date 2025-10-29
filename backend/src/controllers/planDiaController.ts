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
