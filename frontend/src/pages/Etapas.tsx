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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Etapa = {
  id: number;
  descripcion: string;
  orden: number;
};

export default function Etapas() {
  const [items, setItems] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog/form state
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Etapa | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState('');
  const [errors, setErrors] = useState<{ descripcion?: string; orden?: string }>({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  const { user: currentUser } = useAuth();

  const canEdit = currentUser?.roles?.includes('Admin') || currentUser?.roles?.includes('Entrenador');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/etapas');
      setItems(res.data || []);
    } catch (err) {
      console.error('fetch etapas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDescripcion('');
    setOrden('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (e: Etapa) => {
    setEditing(e);
    setDescripcion(e.descripcion);
    setOrden(String(e.orden));
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: { descripcion?: string; orden?: string } = {};
    if (!descripcion || descripcion.trim().length === 0) err.descripcion = 'Descripción requerida';
    if (!orden || orden.trim().length === 0) err.orden = 'Orden requerido';
    else if (isNaN(Number(orden)) || Number(orden) < 0) err.orden = 'Orden debe ser un número válido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const data = {
        descripcion: descripcion.trim(),
        orden: Number(orden),
      };

      if (editing) {
        await api.put(`/etapas/${editing.id}`, data);
      } else {
        await api.post('/etapas', data);
      }
      await fetch();
      setOpen(false);
      setEditing(null);
      setSnackMsg(editing ? 'Etapa actualizada' : 'Etapa creada');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save etapa', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (e: Etapa) => {
    if (!window.confirm(`¿Borrar etapa "${e.descripcion}"?`)) return;
    try {
      await api.delete(`/etapas/${e.id}`);
      fetch();
      setSnackMsg('Etapa borrada');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('delete', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al borrar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const filteredItems = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (it.descripcion || '').toLowerCase().includes(q);
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Etapas</Typography>
        {canEdit && (
          <Button variant="contained" onClick={openCreate}>
            Nueva etapa
          </Button>
        )}
      </Box>

      <Paper>
        <Box p={2}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="Buscar"
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
            <div>No hay etapas.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Descripción</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Orden</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((it) => (
                    <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{it.id}</td>
                      <td style={{ padding: 8 }}>{it.descripcion}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{it.orden}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>
                        {canEdit && (
                          <>
                            <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDelete(it)} aria-label="borrar">
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
        <DialogTitle>{editing ? 'Editar etapa' : 'Nueva etapa'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(ev) => setDescripcion(ev.target.value)}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              required
              fullWidth
            />
            <TextField
              label="Orden"
              type="number"
              value={orden}
              onChange={(ev) => setOrden(ev.target.value)}
              error={!!errors.orden}
              helperText={errors.orden}
              required
              fullWidth
            />
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
