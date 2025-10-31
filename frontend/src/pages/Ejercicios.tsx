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

type Ejercicio = {
  id: number;
  codEjercicio: string;
  descripcion?: string | null;
};

export default function Ejercicios() {
  const [items, setItems] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog/form state
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Ejercicio | null>(null);
  const [cod, setCod] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errors, setErrors] = useState<{ cod?: string }>({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  // get current user from context instead of localStorage
  const { user: currentUser } = useAuth();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ejercicios');
      setItems(res.data || []);
    } catch (err) {
      console.error('fetch ejercicios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // currentUser comes from AuthContext
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCod('');
    setDescripcion('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (e: Ejercicio) => {
    setEditing(e);
    setCod(e.codEjercicio);
    setDescripcion(e.descripcion || '');
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: { cod?: string } = {};
    if (!cod || cod.trim().length === 0) err.cod = 'Código requerido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (editing) {
        await api.put(`/ejercicios/${editing.id}`, { codEjercicio: cod.trim(), descripcion: descripcion || undefined });
      } else {
        await api.post('/ejercicios', { codEjercicio: cod.trim(), descripcion: descripcion || undefined });
      }
      await fetch();
      setOpen(false);
      setEditing(null);
      setSnackMsg(editing ? 'Ejercicio actualizado' : 'Ejercicio creado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save ejercicio', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (e: Ejercicio) => {
    if (!window.confirm(`Borrar ejercicio "${e.codEjercicio}"?`)) return;
    try {
      await api.delete(`/ejercicios/${e.id}`);
      fetch();
      setSnackMsg('Ejercicio borrado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('delete', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al borrar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Ejercicios</Typography>
        {((currentUser && (currentUser.roles?.includes('Admin') || currentUser.roles?.includes('Entrenador'))) || currentUser?.esEntrenador) ? (
          <Button variant="contained" onClick={openCreate}>Nuevo ejercicio</Button>
        ) : (
          <div />
        )}
      </Box>

      <Paper>
        <Box p={2}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField label="Buscar" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} size="small" />
            <Box flex={1} />
            <Typography variant="body2">Página {page}</Typography>
            <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <Button disabled={items.length <= page * pageSize} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}><CircularProgress /></Box>
          ) : items.length === 0 ? (
            <div>No hay ejercicios.</div>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
                    {currentUser?.roles?.includes('Admin') && (
                      <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                    )}
                    <th style={{ textAlign: 'left', padding: 8 }}>Código</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Descripción</th>
                  </tr>
                </thead>
              <tbody>
                {items
                  .filter((it) => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (it.codEjercicio || '').toLowerCase().includes(q) || (it.descripcion || '').toLowerCase().includes(q);
                  })
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>
                      {((currentUser && (currentUser.roles?.includes('Admin') || currentUser.roles?.includes('Entrenador'))) || currentUser?.esEntrenador) && (
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
                    {currentUser?.roles?.includes('Admin') && (
                      <td style={{ padding: 8 }}>{it.id}</td>
                    )}
                    <td style={{ padding: 8 }}>{it.codEjercicio}</td>
                    <td style={{ padding: 8 }}>{it.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Código"
              value={cod}
              onChange={(ev) => setCod(ev.target.value)}
              error={!!errors.cod}
              helperText={errors.cod}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(ev) => setDescripcion(ev.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
