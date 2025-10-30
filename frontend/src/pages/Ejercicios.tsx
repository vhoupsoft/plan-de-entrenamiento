import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Button, IconButton, Typography, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Ejercicio = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

export default function Ejercicios() {
  const [items, setItems] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(false);

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

  const onCreate = async () => {
    const nombre = window.prompt('Nombre del ejercicio');
    if (!nombre) return;
    const descripcion = window.prompt('Descripción (opcional)') || undefined;
    try {
      await api.post('/ejercicios', { nombre, descripcion });
      fetch();
    } catch (err) {
      console.error('create', err);
      alert('Error al crear');
    }
  };

  const onEdit = async (e: Ejercicio) => {
    const nombre = window.prompt('Nombre', e.nombre);
    if (!nombre) return;
    const descripcion = window.prompt('Descripción (opcional)', e.descripcion || '') || undefined;
    try {
      await api.put(`/ejercicios/${e.id}`, { nombre, descripcion });
      fetch();
    } catch (err) {
      console.error('edit', err);
      alert('Error al editar');
    }
  };

  const onDelete = async (e: Ejercicio) => {
    if (!window.confirm(`Borrar ejercicio "${e.nombre}"?`)) return;
    try {
      await api.delete(`/ejercicios/${e.id}`);
      fetch();
    } catch (err) {
      console.error('delete', err);
      alert('Error al borrar');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Ejercicios</Typography>
        <Button variant="contained" onClick={onCreate}>Nuevo ejercicio</Button>
      </Box>

      <Paper>
        <Box p={2}>
          {loading ? (
            <div>Cargando...</div>
          ) : items.length === 0 ? (
            <div>No hay ejercicios.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{it.id}</td>
                    <td style={{ padding: 8 }}>{it.nombre}</td>
                    <td style={{ padding: 8 }}>{it.descripcion}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => onEdit(it)} aria-label="editar">
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
    </Box>
  );
}
