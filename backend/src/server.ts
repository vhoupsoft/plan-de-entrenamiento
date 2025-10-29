import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import personasRoutes from './routes/personas';
import ejerciciosRoutes from './routes/ejercicios';
import etapasRoutes from './routes/etapas';
import planesRoutes from './routes/planes';
import planDiasRoutes from './routes/planDias';
import planDetallesRoutes from './routes/planDetalles';
import rolesRoutes from './routes/roles';
import rolUsuariosRoutes from './routes/rolUsuarios';
import prisma from './prismaClient';

dotenv.config({ path: './prisma/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/plan-dias', planDiasRoutes);
app.use('/api/plan-detalles', planDetallesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/rol-usuarios', rolUsuariosRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (err) {
    console.error('DB connection error', err);
  }
});
