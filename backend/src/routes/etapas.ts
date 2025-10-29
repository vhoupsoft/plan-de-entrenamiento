import { Router } from 'express';
import { listEtapas, getEtapa, createEtapa, updateEtapa, deleteEtapa } from '../controllers/etapaController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listEtapas);
router.get('/:id', getEtapa);
router.post('/', requireAuth, requireRole('Admin'), createEtapa);
router.put('/:id', requireAuth, requireRole('Admin'), updateEtapa);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteEtapa);

export default router;
