import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Administracion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const isAdmin = user?.roles?.includes('Admin');

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tenés permisos para acceder a esta página</Alert>
      </Box>
    );
  }

  const handleImportEjercicios = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/ejercicios/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setSnackMsg(
        `Importación completa: ${data.insertados} insertados, ${data.omitidos} omitidos, ${data.errores.length} errores`
      );
      setSnackSeverity('success');
      setSnackOpen(true);

      if (data.errores.length > 0) {
        console.warn('Errores de importación:', data.errores);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setSnackMsg(err.message || 'Error al importar ejercicios');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleExportEjercicios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ejercicios/export', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ejercicios.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSnackMsg('Ejercicios exportados correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('Export error:', err);
      setSnackMsg(err.message || 'Error al exportar ejercicios');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPersonas = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/personas/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setSnackMsg(
        `Importación completa: ${data.insertados} insertados, ${data.omitidos} omitidos, ${data.errores.length} errores`
      );
      setSnackSeverity('success');
      setSnackOpen(true);

      if (data.errores.length > 0) {
        console.warn('Errores de importación:', data.errores);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setSnackMsg(err.message || 'Error al importar personas');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleExportPersonas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/personas/export', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personas.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSnackMsg('Personas exportadas correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('Export error:', err);
      setSnackMsg(err.message || 'Error al exportar personas');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administración
      </Typography>

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* Roles */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">Roles</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Administrar roles de usuarios del sistema
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/roles')}>
              Ir a Roles
            </Button>
          </CardActions>
        </Card>

        {/* Ejercicios Import/Export */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <FitnessCenterIcon color="primary" />
              <Typography variant="h6">Ejercicios</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Importar/Exportar ejercicios desde archivos CSV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Formato CSV: Codigo, Descripcion, PasoImagenes, LinkExternos
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              component="label"
              size="small"
              startIcon={<UploadFileIcon />}
              disabled={loading}
            >
              Importar CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleImportEjercicios}
              />
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportEjercicios}
              disabled={loading}
            >
              Exportar CSV
            </Button>
          </CardActions>
        </Card>

        {/* Personas Import/Export */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PeopleIcon color="primary" />
              <Typography variant="h6">Personas</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Importar/Exportar personas desde archivos CSV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Formato CSV: DNI, Nombre, esAlumno, esEntrenador, alumnoActivo, entrenadorActivo, usuario, clave
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              component="label"
              size="small"
              startIcon={<UploadFileIcon />}
              disabled={loading}
            >
              Importar CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleImportPersonas}
              />
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportPersonas}
              disabled={loading}
            >
              Exportar CSV
            </Button>
          </CardActions>
        </Card>

        {/* Auditoría (placeholder) */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AssessmentIcon color="primary" />
              <Typography variant="h6">Auditoría</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Visualizar auditoría de operaciones del sistema (próximamente)
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" disabled>
              Próximamente
            </Button>
          </CardActions>
        </Card>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
