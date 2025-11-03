import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { listHistorial, createHistorial, getActualForDate } from '../controllers/planDetalleHistorialController';

const router = Router();

// List historial for a planDetalle
router.get('/:id/historial', requireAuth, listHistorial);

// Create historial entry (only Entrenador/Admin)
router.post('/:id/historial', requireAuth, requireRole('Admin', 'Entrenador'), createHistorial);

// Get actual values effective for a date (optional query param ?date=YYYY-MM-DD)
router.get('/:id/actual', requireAuth, getActualForDate);

export default router;
