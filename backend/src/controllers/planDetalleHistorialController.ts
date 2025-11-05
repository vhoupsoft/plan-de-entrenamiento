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

export const createHistorial = async (req: any, res: Response) => {
  try {
    const planDetalleId = Number(req.params.id);
    const { series, repeticiones, tiempoEnSeg, carga, fechaDesde } = req.body;
    console.log('[createHistorial] planDetalleId:', planDetalleId, 'body:', req.body);
    
    if (!fechaDesde) return res.status(400).json({ error: 'fechaDesde es requerida' });

    // Buscar planDetalle con su plan y alumno
    const pd = await prisma.planDetalle.findUnique({ 
      where: { id: planDetalleId },
      include: {
        planDia: {
          include: {
            plan: true
          }
        }
      }
    });
    
    if (!pd) {
      console.log('[createHistorial] PlanDetalle no encontrado:', planDetalleId);
      return res.status(404).json({ error: 'PlanDetalle no encontrado' });
    }

    // Verificar permisos: Entrenador/Admin pueden modificar cualquier historial, Alumno solo el suyo
    const userId = req.user?.sub ? Number(req.user.sub) : null;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar si tiene rol Admin o Entrenador
    const adminOrEntrenador = await prisma.rolUsuario.findFirst({
      where: { 
        usuarioId: userId, 
        rol: { descripcion: { in: ['Admin', 'Entrenador'] } } 
      }
    });

    // Si no es Admin/Entrenador, verificar que sea el alumno dueño del plan
    if (!adminOrEntrenador) {
      if (pd.planDia.plan.alumnoId !== userId) {
        console.log('[createHistorial] Acceso denegado: usuario', userId, 'no es dueño del plan');
        return res.status(403).json({ error: 'No autorizado para modificar este historial' });
      }
    }

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

    console.log('[createHistorial] Historial creado:', row);
    res.status(201).json(row);
  } catch (err) {
    console.error('createHistorial ERROR:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getActualForDate = async (req: Request, res: Response) => {
  try {
    const planDetalleId = Number(req.params.id);
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    console.log('[getActualForDate] planDetalleId:', planDetalleId, 'date:', date);

    const row = await prisma.planDetalleHistorial.findFirst({
      where: {
        planDetalleId,
        fechaDesde: { lte: date }
      },
      orderBy: { fechaDesde: 'desc' }
    });

    console.log('[getActualForDate] resultado:', row);
    if (!row) return res.status(404).json({ error: 'No hay historial para la fecha indicada' });
    res.json(row);
  } catch (err) {
    console.error('getActualForDate ERROR:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
