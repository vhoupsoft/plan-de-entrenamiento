import { Router } from 'express';
import multer from 'multer';
import { importEjercicios, exportEjercicios, importPersonas, exportPersonas } from '../controllers/importExportController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Configurar multer para recibir archivos CSV en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Rutas de ejercicios
router.post('/ejercicios/import', requireAuth, requireRole('Admin'), upload.single('file'), importEjercicios);
router.get('/ejercicios/export', requireAuth, requireRole('Admin'), exportEjercicios);

// Rutas de personas
router.post('/personas/import', requireAuth, requireRole('Admin'), upload.single('file'), importPersonas);
router.get('/personas/export', requireAuth, requireRole('Admin'), exportPersonas);

export default router;
