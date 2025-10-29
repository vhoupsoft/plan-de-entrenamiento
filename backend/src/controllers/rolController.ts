import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.rol.findMany({ orderBy: { descripcion: 'asc' } });
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getRol = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rol = await prisma.rol.findUnique({ where: { id } });
    if (!rol) return res.status(404).json({ error: 'No encontrado' });
    res.json(rol);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createRol = async (req: Request, res: Response) => {
  try {
    const { descripcion } = req.body;
    if (!descripcion) return res.status(400).json({ error: 'Faltan datos' });
    const existing = await prisma.rol.findFirst({ where: { descripcion } });
    if (existing) return res.status(400).json({ error: 'Rol ya existe' });
    const rol = await prisma.rol.create({ data: { descripcion } });
    res.status(201).json(rol);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updateRol = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { descripcion } = req.body;
    const updated = await prisma.rol.update({ where: { id }, data: { descripcion } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deleteRol = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.rol.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
