import { Router } from 'express';
import { getAlternativos, addAlternativo, removeAlternativo } from '../controllers/ejercicioAlternativoController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/:ejercicioId', getAlternativos);
router.post('/', requireAuth, requireRole('Entrenador', 'Admin'), addAlternativo);
router.delete('/:id', requireAuth, requireRole('Admin'), removeAlternativo);

export default router;
