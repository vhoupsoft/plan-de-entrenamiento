import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import personasRoutes from './routes/personas';
import ejerciciosRoutes from './routes/ejercicios';
import etapasRoutes from './routes/etapas';
import planesRoutes from './routes/planes';
import planDiasRoutes from './routes/planDias';
import planDetallesRoutes from './routes/planDetalles';
import rolesRoutes from './routes/roles';
import rolUsuariosRoutes from './routes/rolUsuarios';
import uploadRoutes from './routes/upload';

dotenv.config({ path: './prisma/.env' });

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/plan-dias', planDiasRoutes);
app.use('/api/plan-detalles', planDetallesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/rol-usuarios', rolUsuariosRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

export default app;
