import { Router } from 'express';
import {
  listPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from '../controllers/personaController';

const router = Router();

router.get('/', listPersonas);
router.get('/:id', getPersona);
router.post('/', createPersona);
router.put('/:id', updatePersona);
router.delete('/:id', deletePersona);

export default router;
