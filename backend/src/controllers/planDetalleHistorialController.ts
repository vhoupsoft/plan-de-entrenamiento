import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const listHistorial = async (req: Request, res: Response) => {
  try {
    const planDetalleId = Number(req.params.id);
    const rows = await prisma.planDetalleHistorial.findMany({
      where: { planDetalleId },
      orderBy: { fechaDesde: 'desc' }
    });
    res.json(rows);
  } catch (err) {
    console.error('listHistorial', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createHistorial = async (req: Request, res: Response) => {
  try {
    const planDetalleId = Number(req.params.id);
    const { series, repeticiones, tiempoEnSeg, carga, fechaDesde } = req.body;
    if (!fechaDesde) return res.status(400).json({ error: 'fechaDesde es requerida' });

    const pd = await prisma.planDetalle.findUnique({ where: { id: planDetalleId } });
    if (!pd) return res.status(404).json({ error: 'PlanDetalle no encontrado' });

    const row = await prisma.planDetalleHistorial.create({
      data: {
        planDetalleId,
        series: series ?? pd.series,
        repeticiones: repeticiones ?? pd.repeticiones,
        tiempoEnSeg: tiempoEnSeg ?? pd.tiempoEnSeg,
        carga: carga ?? pd.carga,
        fechaDesde: new Date(fechaDesde),
      }
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('createHistorial', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getActualForDate = async (req: Request, res: Response) => {
  try {
    const planDetalleId = Number(req.params.id);
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();

    const row = await prisma.planDetalleHistorial.findFirst({
      where: {
        planDetalleId,
        fechaDesde: { lte: date }
      },
      orderBy: { fechaDesde: 'desc' }
    });

    if (!row) return res.status(404).json({ error: 'No hay historial para la fecha indicada' });
    res.json(row);
  } catch (err) {
    console.error('getActualForDate', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
