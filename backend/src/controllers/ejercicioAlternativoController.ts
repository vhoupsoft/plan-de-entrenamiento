import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Obtener alternativos de un ejercicio
export const getAlternativos = async (req: Request, res: Response) => {
  try {
    const ejercicioId = Number(req.params.ejercicioId);
    const alternativos = await prisma.ejercicioAlternativo.findMany({
      where: { ejercicioId },
      include: {
        alternativo: true
      }
    });
    res.json(alternativos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Agregar alternativo
export const addAlternativo = async (req: Request, res: Response) => {
  try {
    const { ejercicioId, ejercicioAlternativoId } = req.body;
    if (!ejercicioId || !ejercicioAlternativoId) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Verificar que no exista ya
    const exists = await prisma.ejercicioAlternativo.findFirst({
      where: {
        ejercicioId: Number(ejercicioId),
        ejercicioAlternativoId: Number(ejercicioAlternativoId)
      }
    });

    if (exists) {
      return res.status(400).json({ error: 'Ya existe esta relación' });
    }

    const alternativo = await prisma.ejercicioAlternativo.create({
      data: {
        ejercicioId: Number(ejercicioId),
        ejercicioAlternativoId: Number(ejercicioAlternativoId)
      },
      include: {
        alternativo: true
      }
    });

    res.status(201).json(alternativo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar alternativo
export const removeAlternativo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.ejercicioAlternativo.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
