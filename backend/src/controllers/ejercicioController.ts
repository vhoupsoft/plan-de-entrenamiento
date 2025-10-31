import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listEjercicios = async (req: Request, res: Response) => {
  try {
    const ejercicios = await prisma.ejercicio.findMany({ orderBy: { codEjercicio: 'asc' } });
    res.json(ejercicios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getEjercicio = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ej = await prisma.ejercicio.findUnique({ where: { id } });
    if (!ej) return res.status(404).json({ error: 'No encontrado' });
    res.json(ej);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createEjercicio = async (req: Request, res: Response) => {
  try {
    const { codEjercicio, descripcion, imagenes, links } = req.body;
    if (!codEjercicio || !descripcion) return res.status(400).json({ error: 'Faltan datos' });

    const existing = await prisma.ejercicio.findFirst({ where: { codEjercicio } });
    if (existing) return res.status(400).json({ error: 'Código ya existe' });

    const ej = await prisma.ejercicio.create({ 
      data: { 
        codEjercicio, 
        descripcion,
        imagenes: imagenes || null,
        links: links || null
      } as any
    });
    res.status(201).json(ej);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updateEjercicio = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { codEjercicio, descripcion, imagenes, links } = req.body;
    // if codEjercicio is provided, ensure it's not used by another record
    if (codEjercicio) {
      const exists = await prisma.ejercicio.findFirst({ where: { codEjercicio, NOT: { id } } as any });
      if (exists) return res.status(400).json({ error: 'Código ya existe' });
    }

    const data: any = { codEjercicio, descripcion, imagenes, links };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // ensure record exists
    const found = await prisma.ejercicio.findUnique({ where: { id } });
    if (!found) return res.status(404).json({ error: 'No encontrado' });

    const ej = await prisma.ejercicio.update({ where: { id }, data });
    res.json(ej);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deleteEjercicio = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.ejercicio.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
