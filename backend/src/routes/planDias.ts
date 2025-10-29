import { Router } from 'express';
import { listPlanDias, getPlanDia, createPlanDia, updatePlanDia, deletePlanDia } from '../controllers/planDiaController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listPlanDias);
router.get('/:id', getPlanDia);
router.post('/', requireAuth, requireRole('Entrenador', 'Admin'), createPlanDia);
router.put('/:id', requireAuth, requireRole('Entrenador', 'Admin'), updatePlanDia);
router.delete('/:id', requireAuth, requireRole('Admin'), deletePlanDia);

export default router;
