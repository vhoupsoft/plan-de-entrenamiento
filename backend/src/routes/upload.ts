import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Configurar multer para guardar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/ejercicios'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'ejercicio-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|gif|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, GIF, PNG)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// Ruta para subir imagen de ejercicio
router.post('/ejercicio-imagen', requireAuth, requireRole('Admin', 'Entrenador'), upload.single('imagen'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    // Retornar la URL relativa de la imagen
    const imageUrl = `/uploads/ejercicios/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

export default router;
