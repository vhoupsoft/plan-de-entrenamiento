import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Roles() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Roles</Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        Página de Roles (solo accesible para administradores). Aquí podrá gestionar los roles y asignaciones.
      </Typography>
    </Box>
  );
}
