import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from './auth';

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) return res.status(401).json({ error: 'No autenticado' });
      const userId = Number(req.user.sub);

      const asign = await prisma.rolUsuario.findFirst({
        where: { usuarioId: userId, rol: { descripcion: { in: allowedRoles } } },
        include: { rol: true },
      });

      if (!asign) return res.status(403).json({ error: 'No autorizado (rol requerido)' });
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  };
};

// Permite si el usuario tiene alguno de los roles permitidos o si es el mismo usuario que el recurso (por parámetro)
export const requireSelfOrRole = (paramKey: string, ...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) return res.status(401).json({ error: 'No autenticado' });
      const userId = Number(req.user.sub);

      // Si tiene un rol permitido, pasa
      if (allowedRoles && allowedRoles.length > 0) {
        const asign = await prisma.rolUsuario.findFirst({
          where: { usuarioId: userId, rol: { descripcion: { in: allowedRoles } } },
          include: { rol: true },
        });
        if (asign) return next();
      }

      // Si es dueño del recurso (por param)
      const paramVal = Number((req.params as any)[paramKey]);
      if (!isNaN(paramVal) && paramVal === userId) {
        return next();
      }

      return res.status(403).json({ error: 'No autorizado (rol o propietario requerido)' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  };
};
