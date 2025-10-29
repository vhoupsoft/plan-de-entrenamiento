import { Router } from 'express';
import { listPlanes, getPlan, createPlan, updatePlan, deletePlan } from '../controllers/planController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listPlanes);
router.get('/:id', getPlan);
// Creating/updating/deleting plans should be done by authenticated trainers or admins
router.post('/', requireAuth, requireRole('Entrenador', 'Admin'), createPlan);
router.put('/:id', requireAuth, requireRole('Entrenador', 'Admin'), updatePlan);
router.delete('/:id', requireAuth, requireRole('Admin'), deletePlan);

export default router;
