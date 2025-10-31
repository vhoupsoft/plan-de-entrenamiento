import { Router } from 'express';
import {
  listPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from '../controllers/personaController';
import { requireAuth } from '../middleware/auth';
import { requireRole, requireSelfOrRole } from '../middleware/roles';

const router = Router();

router.get('/', listPersonas);
router.get('/:id', getPersona);
// protect write operations: only authenticated users with Admin role can modify personas
router.post('/', requireAuth, requireRole('Admin'), createPersona);
// Permitir a Admin o al propio usuario editar su registro (con control de campos en el controlador)
router.put('/:id', requireAuth, requireSelfOrRole('id', 'Admin'), updatePersona);
router.delete('/:id', requireAuth, requireRole('Admin'), deletePersona);

export default router;
