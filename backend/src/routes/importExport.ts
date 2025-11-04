import { Router } from 'express';
import multer from 'multer';
import { 
  importEjercicios, exportEjercicios, 
  importPersonas, exportPersonas,
  importEjerciciosJson, exportEjerciciosJson,
  importPersonasJson, exportPersonasJson
} from '../controllers/importExportController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Configurar multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Rutas de ejercicios - CSV
router.post('/ejercicios/import', requireAuth, requireRole('Admin'), upload.single('file'), importEjercicios);
router.get('/ejercicios/export', requireAuth, requireRole('Admin'), exportEjercicios);

// Rutas de ejercicios - JSON
router.post('/ejercicios/import-json', requireAuth, requireRole('Admin'), upload.single('file'), importEjerciciosJson);
router.get('/ejercicios/export-json', requireAuth, requireRole('Admin'), exportEjerciciosJson);

// Rutas de personas - CSV
router.post('/personas/import', requireAuth, requireRole('Admin'), upload.single('file'), importPersonas);
router.get('/personas/export', requireAuth, requireRole('Admin'), exportPersonas);

// Rutas de personas - JSON
router.post('/personas/import-json', requireAuth, requireRole('Admin'), upload.single('file'), importPersonasJson);
router.get('/personas/export-json', requireAuth, requireRole('Admin'), exportPersonasJson);

export default router;
