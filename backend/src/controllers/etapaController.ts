import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listEtapas = async (req: Request, res: Response) => {
  try {
    const etapas = await prisma.etapa.findMany({ orderBy: { orden: 'asc' } });
    res.json(etapas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getEtapa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const e = await prisma.etapa.findUnique({ where: { id } });
    if (!e) return res.status(404).json({ error: 'No encontrado' });
    res.json(e);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createEtapa = async (req: Request, res: Response) => {
  try {
    const { descripcion, orden } = req.body;
    if (!descripcion || orden === undefined) return res.status(400).json({ error: 'Faltan datos' });
    const etapa = await prisma.etapa.create({ data: { descripcion, orden } });
    res.status(201).json(etapa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updateEtapa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { descripcion, orden } = req.body;
    const data: any = { descripcion, orden };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const etapa = await prisma.etapa.update({ where: { id }, data });
    res.json(etapa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deleteEtapa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.etapa.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
