import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { dni, nombre, usuario, clave, esAlumno, esEntrenador } = req.body;

    if (!dni || !nombre || !usuario || !clave) return res.status(400).json({ error: 'Faltan datos' });

    const existing = await prisma.persona.findUnique({ where: { usuario } });
    if (existing) return res.status(400).json({ error: 'Usuario ya existe' });

    const hashed = await bcrypt.hash(clave, 10);

    const persona = await prisma.persona.create({
      data: {
        dni,
        nombre,
        usuario,
        clave: hashed,
        esAlumno: !!esAlumno,
        esEntrenador: !!esEntrenador,
      },
    });

    return res.json({ persona: { id: persona.id, usuario: persona.usuario } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, clave } = req.body;
    if (!usuario || !clave) return res.status(400).json({ error: 'Faltan credenciales' });

    const user = await prisma.persona.findUnique({ where: { usuario } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(clave, user.clave);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ sub: user.id, usuario: user.usuario }, JWT_SECRET, { expiresIn: '8h' });

    // fetch assigned roles for the user
    const rolUsuarios = await prisma.rolUsuario.findMany({ where: { usuarioId: user.id }, include: { rol: true } });
  const roles = rolUsuarios.map((r) => r.rol.descripcion);

    return res.json({
      token,
      user: { id: user.id, nombre: user.nombre, esAlumno: user.esAlumno, esEntrenador: user.esEntrenador, roles },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};
