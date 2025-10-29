import { Router } from 'express';
import { listRoles, getRol, createRol, updateRol, deleteRol } from '../controllers/rolController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listRoles);
router.get('/:id', getRol);
router.post('/', requireAuth, requireRole('Admin'), createRol);
router.put('/:id', requireAuth, requireRole('Admin'), updateRol);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteRol);

export default router;
