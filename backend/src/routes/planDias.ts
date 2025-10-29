import { Router } from 'express';
import { listPlanDias, getPlanDia, createPlanDia, updatePlanDia, deletePlanDia } from '../controllers/planDiaController';

const router = Router();

router.get('/', listPlanDias);
router.get('/:id', getPlanDia);
router.post('/', createPlanDia);
router.put('/:id', updatePlanDia);
router.delete('/:id', deletePlanDia);

export default router;
