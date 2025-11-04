import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Helper to deactivate previous active plans for the same alumno
const deactivatePreviousActivePlans = async (alumnoId: number) => {
  const now = new Date();
  await prisma.plan.updateMany({
    where: { alumnoId, activo: true },
    data: { activo: false, fechaHasta: now },
  });
};

export const listPlanes = async (req: Request, res: Response) => {
  try {
    const planes = await prisma.plan.findMany({
      include: { alumno: true, entrenador: true, dias: true },
      orderBy: { fechaDesde: 'desc' },
    });
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const plan = await prisma.plan.findUnique({ where: { id }, include: { dias: { include: { detalles: true } } } });
    if (!plan) return res.status(404).json({ error: 'No encontrado' });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { alumnoId, entrenadorId, activo } = req.body;
    if (!alumnoId || !entrenadorId) return res.status(400).json({ error: 'Faltan datos' });

    if (activo) {
      // deactivate previous active plans for the alumno
      await deactivatePreviousActivePlans(Number(alumnoId));
    }

    const now = new Date();
    const plan = await prisma.plan.create({
      data: {
        alumnoId: Number(alumnoId),
        entrenadorId: Number(entrenadorId),
        fechaDesde: activo ? now : now,
        fechaHasta: null,
        activo: !!activo,
      },
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { activo } = req.body;

    const data: any = { ...req.body };
    // if activating this plan, deactivate others
    if (activo) {
      const plan = await prisma.plan.findUnique({ where: { id } });
      if (plan) await deactivatePreviousActivePlans(plan.alumnoId);
      data.fechaDesde = data.fechaDesde || new Date();
      data.fechaHasta = null;
    } else if (activo === false) {
      data.fechaHasta = new Date();
    }

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const updated = await prisma.plan.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Eliminar en cascada: primero obtener todos los días del plan
    const dias = await prisma.planDia.findMany({
      where: { planId: id },
      include: { detalles: true }
    });

    // Para cada detalle, eliminar su historial
    for (const dia of dias) {
      for (const detalle of dia.detalles) {
        await prisma.planDetalleHistorial.deleteMany({
          where: { planDetalleId: detalle.id }
        });
      }
      // Eliminar los detalles del día
      await prisma.planDetalle.deleteMany({
        where: { planDiaId: dia.id }
      });
    }

    // Eliminar los días
    await prisma.planDia.deleteMany({
      where: { planId: id }
    });

    // Finalmente eliminar el plan
    await prisma.plan.delete({ where: { id } });
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const copyPlan = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Obtener el plan original completo con todos sus días, detalles e historial
    const originalPlan = await prisma.plan.findUnique({
      where: { id },
      include: {
        dias: {
          include: {
            detalles: {
              include: {
                historial: true
              }
            }
          }
        }
      }
    });

    if (!originalPlan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Crear el nuevo plan (copia) - siempre inactivo
    const now = new Date();
    const newPlan = await prisma.plan.create({
      data: {
        alumnoId: originalPlan.alumnoId,
        entrenadorId: originalPlan.entrenadorId,
        fechaDesde: now,
        fechaHasta: null,
        activo: false, // Siempre crear como inactivo
      }
    });

    // Copiar cada día del plan
    for (const dia of originalPlan.dias) {
      const newDia = await prisma.planDia.create({
        data: {
          planId: newPlan.id,
          nroDia: dia.nroDia,
          descripcion: dia.descripcion,
        }
      });

      // Copiar cada detalle del día
      for (const detalle of dia.detalles) {
        const newDetalle = await prisma.planDetalle.create({
          data: {
            planDiaId: newDia.id,
            ejercicioId: detalle.ejercicioId,
            series: detalle.series,
            repeticiones: detalle.repeticiones,
            tiempoEnSeg: detalle.tiempoEnSeg,
            carga: detalle.carga,
            orden: detalle.orden,
            etapaId: detalle.etapaId,
          }
        });

        // Copiar el historial del detalle (último registro)
        if (detalle.historial.length > 0) {
          const ultimoHistorial = detalle.historial[detalle.historial.length - 1];
          await prisma.planDetalleHistorial.create({
            data: {
              planDetalleId: newDetalle.id,
              series: ultimoHistorial.series,
              repeticiones: ultimoHistorial.repeticiones,
              tiempoEnSeg: ultimoHistorial.tiempoEnSeg,
              carga: ultimoHistorial.carga,
              fechaDesde: now,
            }
          });
        }
      }
    }

    // Devolver el plan copiado con toda su estructura
    const copiedPlan = await prisma.plan.findUnique({
      where: { id: newPlan.id },
      include: {
        alumno: true,
        entrenador: true,
        dias: {
          include: {
            detalles: {
              include: {
                ejercicio: true,
                historial: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(copiedPlan);
  } catch (err) {
    console.error('Error al copiar plan:', err);
    res.status(500).json({ error: 'Error del servidor al copiar plan' });
  }
};
