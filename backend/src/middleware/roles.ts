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
