import { Router } from 'express';
import { listRolUsuarios, getRolUsuario, createRolUsuario, deleteRolUsuario, getRolesByUsuario, getUsersByRol } from '../controllers/rolUsuarioController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', requireAuth, requireRole('Admin'), listRolUsuarios);
router.get('/by-usuario/:usuarioId', requireAuth, requireRole('Admin'), getRolesByUsuario);
router.get('/by-rol/:rolId', requireAuth, requireRole('Admin'), getUsersByRol);
router.get('/:id', requireAuth, requireRole('Admin'), getRolUsuario);
router.post('/', requireAuth, requireRole('Admin'), createRolUsuario);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteRolUsuario);

export default router;
