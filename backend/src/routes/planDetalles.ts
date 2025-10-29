import { Router } from 'express';
import { listPlanDetalles, getPlanDetalle, createPlanDetalle, updatePlanDetalle, deletePlanDetalle } from '../controllers/planDetalleController';

const router = Router();

router.get('/', listPlanDetalles);
router.get('/:id', getPlanDetalle);
router.post('/', createPlanDetalle);
router.put('/:id', updatePlanDetalle);
router.delete('/:id', deletePlanDetalle);

export default router;
