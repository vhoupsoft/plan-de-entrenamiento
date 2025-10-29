import { Router } from 'express';
import {
  listEjercicios,
  getEjercicio,
  createEjercicio,
  updateEjercicio,
  deleteEjercicio,
} from '../controllers/ejercicioController';

const router = Router();

router.get('/', listEjercicios);
router.get('/:id', getEjercicio);
router.post('/', createEjercicio);
router.put('/:id', updateEjercicio);
router.delete('/:id', deleteEjercicio);

export default router;
