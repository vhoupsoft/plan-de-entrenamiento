import React, { useEffect, useState } from 'react';
import api from '../api';
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
    } catch (err: any) {
      console.error('save ejercicio', err, err?.response?.data);
      alert(err?.response?.data?.error || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (e: Ejercicio) => {
    if (!window.confirm(`Borrar ejercicio "${e.codEjercicio}"?`)) return;
    try {
      await api.delete(`/ejercicios/${e.id}`);
      fetch();
    } catch (err: any) {
      console.error('delete', err, err?.response?.data);
      alert(err?.response?.data?.error || 'Error al borrar');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Ejercicios</Typography>
        <Button variant="contained" onClick={openCreate}>Nuevo ejercicio</Button>
      </Box>

      <Paper>
        <Box p={2}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}><CircularProgress /></Box>
          ) : items.length === 0 ? (
            <div>No hay ejercicios.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Código</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{it.id}</td>
                    <td style={{ padding: 8 }}>{it.codEjercicio}</td>
                    <td style={{ padding: 8 }}>{it.descripcion}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(it)} aria-label="borrar">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>
      </Paper>

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
