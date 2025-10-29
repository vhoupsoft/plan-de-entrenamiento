import { Router } from 'express';
import { listPlanes, getPlan, createPlan, updatePlan, deletePlan } from '../controllers/planController';

const router = Router();

router.get('/', listPlanes);
router.get('/:id', getPlan);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
