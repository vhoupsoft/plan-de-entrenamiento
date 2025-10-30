import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

type Persona = {
  id: number;
  nombre: string;
  dni: string;
};

type Plan = {
  id: number;
  alumnoId: number;
  entrenadorId: number;
  fechaDesde: string;
  fechaHasta: string | null;
  activo: boolean;
  alumno: Persona;
  entrenador: Persona;
  dias?: any[];
};

export default function Planes() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);

  // dialog/form state
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [alumnoId, setAlumnoId] = useState<number | ''>('');
  const [entrenadorId, setEntrenadorId] = useState<number | ''>('');
  const [activo, setActivo] = useState(false);
  const [errors, setErrors] = useState<{ alumno?: string; entrenador?: string }>({});
  
  // search and filter
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  const { user: currentUser } = useAuth();

  const canEdit = currentUser?.roles?.includes('Admin') || currentUser?.roles?.includes('Entrenador');

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/planes');
      setItems(res.data || []);
    } catch (err) {
      console.error('fetch planes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const res = await api.get('/personas');
      setPersonas(res.data || []);
    } catch (err) {
      console.error('fetch personas', err);
    }
  };

  useEffect(() => {
    fetchPlanes();
    fetchPersonas();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setAlumnoId('');
    setEntrenadorId('');
    setActivo(false);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setAlumnoId(plan.alumnoId);
    setEntrenadorId(plan.entrenadorId);
    setActivo(plan.activo);
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: { alumno?: string; entrenador?: string } = {};
    if (!alumnoId) err.alumno = 'Alumno requerido';
    if (!entrenadorId) err.entrenador = 'Entrenador requerido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const data = {
        alumnoId: Number(alumnoId),
        entrenadorId: Number(entrenadorId),
        activo,
      };

      if (editing) {
        await api.put(`/planes/${editing.id}`, data);
      } else {
        await api.post('/planes', data);
      }
      await fetchPlanes();
      setOpen(false);
      setEditing(null);
      setSnackMsg(editing ? 'Plan actualizado' : 'Plan creado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save plan', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (plan: Plan) => {
    if (!window.confirm(`¿Borrar plan de "${plan.alumno.nombre}"?`)) return;
    try {
      await api.delete(`/planes/${plan.id}`);
      fetchPlanes();
      setSnackMsg('Plan borrado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('delete', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al borrar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const filteredItems = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (it.alumno.nombre || '').toLowerCase().includes(q) ||
      (it.entrenador.nombre || '').toLowerCase().includes(q) ||
      (it.alumno.dni || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Planes de Entrenamiento</Typography>
        {canEdit && (
          <Button variant="contained" onClick={openCreate}>
            Nuevo plan
          </Button>
        )}
      </Box>

      <Paper>
        <Box p={2}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="Buscar (alumno o entrenador)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              size="small"
            />
            <Box flex={1} />
            <Typography variant="body2">Página {page}</Typography>
            <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Button
              disabled={filteredItems.length <= page * pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Typography>No hay planes.</Typography>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Alumno</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Entrenador</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Desde</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Hasta</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Estado</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((it) => (
                    <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{it.id}</td>
                      <td style={{ padding: 8 }}>{it.alumno.nombre}</td>
                      <td style={{ padding: 8 }}>{it.entrenador.nombre}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{formatDate(it.fechaDesde)}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{formatDate(it.fechaHasta)}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        {it.activo ? (
                          <Chip label="Activo" color="success" size="small" />
                        ) : (
                          <Chip label="Inactivo" size="small" />
                        )}
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' }}>
                        <IconButton size="small" aria-label="ver detalle" title="Ver detalle">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canEdit && (
                          <>
                            <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(it)}
                              aria-label="borrar"
                              disabled={!currentUser?.roles?.includes('Admin')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Box>
      </Paper>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth error={!!errors.alumno} required>
              <InputLabel>Alumno</InputLabel>
              <Select
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value as number)}
                label="Alumno"
              >
                <MenuItem value="">
                  <em>Seleccionar alumno</em>
                </MenuItem>
                {personas
                  .filter((p) => p.id !== entrenadorId)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre} ({p.dni})
                    </MenuItem>
                  ))}
              </Select>
              {errors.alumno && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {errors.alumno}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={!!errors.entrenador} required>
              <InputLabel>Entrenador</InputLabel>
              <Select
                value={entrenadorId}
                onChange={(e) => setEntrenadorId(e.target.value as number)}
                label="Entrenador"
              >
                <MenuItem value="">
                  <em>Seleccionar entrenador</em>
                </MenuItem>
                {personas
                  .filter((p) => p.id !== alumnoId)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre} ({p.dni})
                    </MenuItem>
                  ))}
              </Select>
              {errors.entrenador && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {errors.entrenador}
                </Typography>
              )}
            </FormControl>

            <FormControlLabel
              control={<Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} />}
              label="Plan activo"
            />
            {activo && (
              <Typography variant="caption" color="text.secondary">
                Al activar este plan, se desactivarán automáticamente otros planes activos del mismo
                alumno.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
