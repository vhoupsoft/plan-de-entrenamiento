import { Router } from 'express';
import { listEtapas, getEtapa, createEtapa, updateEtapa, deleteEtapa } from '../controllers/etapaController';

const router = Router();

router.get('/', listEtapas);
router.get('/:id', getEtapa);
router.post('/', createEtapa);
router.put('/:id', updateEtapa);
router.delete('/:id', deleteEtapa);

export default router;
