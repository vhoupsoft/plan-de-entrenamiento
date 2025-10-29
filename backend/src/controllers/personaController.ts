import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient';

export const listPersonas = async (req: Request, res: Response) => {
  try {
    const personas = await prisma.persona.findMany({
      select: {
        id: true,
        dni: true,
        nombre: true,
        esAlumno: true,
        esEntrenador: true,
        alumnoActivo: true,
        entrenadorActivo: true,
        usuario: true,
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(personas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getPersona = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const persona = await prisma.persona.findUnique({
      where: { id },
      select: {
        id: true,
        dni: true,
        nombre: true,
        esAlumno: true,
        esEntrenador: true,
        alumnoActivo: true,
        entrenadorActivo: true,
        usuario: true,
      },
    });
    if (!persona) return res.status(404).json({ error: 'No encontrado' });
    res.json(persona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createPersona = async (req: Request, res: Response) => {
  try {
    const { dni, nombre, usuario, clave, esAlumno, esEntrenador } = req.body;
    if (!dni || !nombre || !usuario || !clave) return res.status(400).json({ error: 'Faltan datos' });

    const existing = await prisma.persona.findFirst({ where: { OR: [{ usuario }, { dni }] } });
    if (existing) return res.status(400).json({ error: 'Usuario o DNI ya existe' });

    const hashed = await bcrypt.hash(clave, 10);
    const persona = await prisma.persona.create({
      data: {
        dni,
        nombre,
        usuario,
        clave: hashed,
        esAlumno: !!esAlumno,
        esEntrenador: !!esEntrenador,
      },
      select: {
        id: true,
        dni: true,
        nombre: true,
        usuario: true,
        esAlumno: true,
        esEntrenador: true,
      },
    });
    res.status(201).json(persona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updatePersona = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nombre, usuario, clave, esAlumno, esEntrenador, alumnoActivo, entrenadorActivo, dni } = req.body;

    const data: any = {
      nombre,
      usuario,
      esAlumno,
      esEntrenador,
      alumnoActivo,
      entrenadorActivo,
      dni,
    };

    if (clave) {
      data.clave = await bcrypt.hash(clave, 10);
    }

    // remove undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const persona = await prisma.persona.update({
      where: { id },
      data,
      select: {
        id: true,
        dni: true,
        nombre: true,
        usuario: true,
        esAlumno: true,
        esEntrenador: true,
      },
    });

    res.json(persona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deletePersona = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.persona.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
