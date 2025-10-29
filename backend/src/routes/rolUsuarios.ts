import { Router } from 'express';
import { listRolUsuarios, getRolUsuario, createRolUsuario, deleteRolUsuario } from '../controllers/rolUsuarioController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', requireAuth, requireRole('Admin'), listRolUsuarios);
router.get('/:id', requireAuth, requireRole('Admin'), getRolUsuario);
router.post('/', requireAuth, requireRole('Admin'), createRolUsuario);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteRolUsuario);

export default router;
