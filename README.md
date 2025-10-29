# Plan de Entrenamiento

Proyecto cliente-servidor para gestionar ejercicios, personas y planes de entrenamiento.

Estructura principal:
- backend/  (Node.js + Express + Prisma + TypeScript)
- frontend/ (React + Vite)

Cómo ejecutar el backend (desde Windows PowerShell):

```powershell
cd "C:\VSS\vortiz\Web\Plan de Entrenamiento\backend"
npm install
npm run dev
```

Antes de iniciar, configura `backend/prisma/.env` con tu `DATABASE_URL` y `JWT_SECRET`.

No subas archivos `.env` al repositorio.

_Última actualización: se agregaron endpoints CRUD para Personas y Ejercicios en el backend._
