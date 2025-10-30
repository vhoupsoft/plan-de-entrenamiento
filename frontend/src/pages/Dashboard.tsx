import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Panel Principal</Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        Bienvenido al Panel Principal (pendiente de implementación). 
        Aquí se mostrarán los ejercicios del plan activo según el usuario logueado (alumno o entrenador).
      </Typography>
    </Box>
  );
}
