import { Router } from 'express';
import {
  listPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from '../controllers/personaController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listPersonas);
router.get('/:id', getPersona);
// protect write operations: only authenticated users with Admin role can modify personas
router.post('/', requireAuth, requireRole('Admin'), createPersona);
router.put('/:id', requireAuth, requireRole('Admin'), updatePersona);
router.delete('/:id', requireAuth, requireRole('Admin'), deletePersona);

export default router;
