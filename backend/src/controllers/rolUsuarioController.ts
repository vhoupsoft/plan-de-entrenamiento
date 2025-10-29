import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listRolUsuarios = async (req: Request, res: Response) => {
  try {
    const items = await prisma.rolUsuario.findMany({ include: { rol: true, usuario: true } });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getRolUsuario = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.rolUsuario.findUnique({ where: { id }, include: { rol: true, usuario: true } });
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createRolUsuario = async (req: Request, res: Response) => {
  try {
    const { rolId, usuarioId } = req.body;
    if (!rolId || !usuarioId) return res.status(400).json({ error: 'Faltan datos' });

    const exists = await prisma.rolUsuario.findFirst({ where: { rolId: Number(rolId), usuarioId: Number(usuarioId) } });
    if (exists) return res.status(400).json({ error: 'Asignación ya existe' });

    const item = await prisma.rolUsuario.create({ data: { rolId: Number(rolId), usuarioId: Number(usuarioId) } });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deleteRolUsuario = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.rolUsuario.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
