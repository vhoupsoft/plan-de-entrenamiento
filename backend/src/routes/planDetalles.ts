import { Router } from 'express';
import { listPlanDetalles, getPlanDetalle, createPlanDetalle, updatePlanDetalle, deletePlanDetalle } from '../controllers/planDetalleController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listPlanDetalles);
router.get('/:id', getPlanDetalle);
router.post('/', requireAuth, requireRole('Entrenador', 'Admin'), createPlanDetalle);
router.put('/:id', requireAuth, requireRole('Entrenador', 'Admin'), updatePlanDetalle);
router.delete('/:id', requireAuth, requireRole('Admin'), deletePlanDetalle);

export default router;
