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
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';

type Rol = {
  id: number;
  descripcion: string;
};

type Persona = {
  id: number;
  dni: string;
  nombre: string;
  usuario: string;
};

type RolUsuario = {
  id: number;
  rolId: number;
  usuarioId: number;
  usuario: Persona;
};

export default function Roles() {
  const [items, setItems] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog/form state
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);
  const [nombre, setNombre] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  // usuarios modal
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [rolUsuarios, setRolUsuarios] = useState<RolUsuario[]>([]);
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  const [selectedNewUsuario, setSelectedNewUsuario] = useState<number | ''>('');
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setItems(res.data || []);
    } catch (err) {
      console.error('fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setNombre('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (r: Rol) => {
    setEditing(r);
    setNombre(r.descripcion);
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: { nombre?: string } = {};
    if (!nombre || nombre.trim().length === 0) err.nombre = 'Nombre requerido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const data = { descripcion: nombre.trim() };
      if (editing) {
        await api.put(`/roles/${editing.id}`, data);
        setSnackMsg('Rol actualizado');
      } else {
        await api.post('/roles', data);
        setSnackMsg('Rol creado');
      }
      setSnackSeverity('success');
      setSnackOpen(true);
      close();
      fetch();
    } catch (err: any) {
      console.error('save error', err);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (r: Rol) => {
    if (!window.confirm(`¿Eliminar rol "${r.descripcion}"?`)) return;
    try {
      await api.delete(`/roles/${r.id}`);
      setSnackMsg('Rol eliminado');
      setSnackSeverity('success');
      setSnackOpen(true);
      fetch();
    } catch (err: any) {
      console.error('delete error', err);
      setSnackMsg(err?.response?.data?.error || 'Error al eliminar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  // Funciones para modal de usuarios
  const openUsuariosModal = async (rol: Rol) => {
    setSelectedRol(rol);
    setUsuariosModalOpen(true);
    setLoadingUsuarios(true);
    try {
      const [usuariosRes, allPersonasRes] = await Promise.all([
        api.get(`/rol-usuarios/by-rol/${rol.id}`),
        api.get('/personas')
      ]);
      setRolUsuarios(usuariosRes.data || []);
      setAvailablePersonas(allPersonasRes.data || []);
      setSelectedNewUsuario('');
    } catch (err) {
      console.error('Error al cargar usuarios', err);
      setSnackMsg('Error al cargar usuarios');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const closeUsuariosModal = () => {
    setUsuariosModalOpen(false);
    setSelectedRol(null);
    setRolUsuarios([]);
    setAvailablePersonas([]);
    setSelectedNewUsuario('');
  };

  const addUsuarioToRol = async () => {
    if (!selectedNewUsuario || !selectedRol) return;
    
    try {
      await api.post('/rol-usuarios', {
        rolId: selectedRol.id,
        usuarioId: selectedNewUsuario
      });
      
      setSnackMsg('Usuario asignado correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
      
      // Recargar usuarios
      const usuariosRes = await api.get(`/rol-usuarios/by-rol/${selectedRol.id}`);
      setRolUsuarios(usuariosRes.data || []);
      setSelectedNewUsuario('');
    } catch (err: any) {
      console.error('Error al asignar usuario', err);
      setSnackMsg(err?.response?.data?.error || 'Error al asignar usuario');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const removeUsuarioFromRol = async (rolUsuarioId: number) => {
    if (!window.confirm('¿Quitar este usuario del rol?')) return;
    
    try {
      await api.delete(`/rol-usuarios/${rolUsuarioId}`);
      
      setSnackMsg('Usuario quitado correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
      
      // Recargar usuarios
      if (selectedRol) {
        const usuariosRes = await api.get(`/rol-usuarios/by-rol/${selectedRol.id}`);
        setRolUsuarios(usuariosRes.data || []);
      }
    } catch (err: any) {
      console.error('Error al quitar usuario', err);
      setSnackMsg(err?.response?.data?.error || 'Error al quitar usuario');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Roles</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Rol
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography>No hay roles.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>
                      <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openUsuariosModal(it)} aria-label="gestionar usuarios">
                        <PeopleIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(it)} aria-label="borrar">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </td>
                    <td style={{ padding: 8 }}>{it.id}</td>
                    <td style={{ padding: 8 }}>{it.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>

      {/* Dialog para crear/editar rol */}
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de gestión de usuarios */}
      <Dialog open={usuariosModalOpen} onClose={closeUsuariosModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Usuarios con rol "{selectedRol?.descripcion}"
        </DialogTitle>
        <DialogContent>
          {loadingUsuarios ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Usuarios asignados:
              </Typography>
              {rolUsuarios.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No hay usuarios con este rol
                </Typography>
              ) : (
                <List dense>
                  {rolUsuarios.map((ru) => (
                    <ListItem
                      key={ru.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="quitar"
                          size="small"
                          onClick={() => removeUsuarioFromRol(ru.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText>
                        <Chip 
                          label={`${ru.usuario.nombre} (${ru.usuario.usuario})`} 
                          color="primary" 
                          size="small" 
                        />
                      </ListItemText>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                Agregar usuario:
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>Seleccionar usuario</InputLabel>
                  <Select
                    value={selectedNewUsuario}
                    onChange={(e) => setSelectedNewUsuario(e.target.value as number)}
                    label="Seleccionar usuario"
                  >
                    <MenuItem value="">
                      <em>Seleccionar...</em>
                    </MenuItem>
                    {availablePersonas
                      .filter((p) => !rolUsuarios.some((ru) => ru.usuarioId === p.id))
                      .map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.nombre} ({p.usuario})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={addUsuarioToRol}
                  disabled={!selectedNewUsuario}
                  size="small"
                >
                  Agregar
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUsuariosModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
