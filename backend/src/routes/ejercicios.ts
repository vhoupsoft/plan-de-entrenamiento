import { Router } from 'express';
import {
  listEjercicios,
  getEjercicio,
  createEjercicio,
  updateEjercicio,
  deleteEjercicio,
} from '../controllers/ejercicioController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', listEjercicios);
router.get('/:id', getEjercicio);
// only authenticated admins can create/update/delete ejercicios
router.post('/', requireAuth, requireRole('Admin'), createEjercicio);
router.put('/:id', requireAuth, requireRole('Admin'), updateEjercicio);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteEjercicio);

export default router;
