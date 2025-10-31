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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Tooltip } from '@mui/material';

type Persona = {
  id: number;
  dni: string;
  nombre: string;
  usuario: string;
  esAlumno: boolean;
  esEntrenador: boolean;
  alumnoActivo: boolean;
  entrenadorActivo: boolean;
};

export default function Personas() {
  const [items, setItems] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog/form state
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [usuarioTouchedByUser, setUsuarioTouchedByUser] = useState(false);
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [showClave, setShowClave] = useState(false);
  const [showClave2, setShowClave2] = useState(false);
  const [esAlumno, setEsAlumno] = useState(false);
  const [esEntrenador, setEsEntrenador] = useState(false);
  const [alumnoActivo, setAlumnoActivo] = useState(true);
  const [entrenadorActivo, setEntrenadorActivo] = useState(true);
  const [errors, setErrors] = useState<{ dni?: string; nombre?: string; usuario?: string; clave?: string; clave2?: string }>({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  const { user: currentUser } = useAuth();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/personas');
      setItems(res.data || []);
    } catch (err) {
      console.error('fetch personas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const generateUsername = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return '';
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return firstName.charAt(0).toLowerCase() + lastName.charAt(0).toUpperCase() + lastName.slice(1);
  };

  const handleNombreChange = (value: string) => {
    setNombre(value);
    // Solo sugerir si estamos creando (no editando) y el usuario no tocó manualmente el campo
    if (!editing && (!usuarioTouchedByUser || (usuario || '').trim() === '')) {
      const suggested = generateUsername(value);
      setUsuario(suggested);
    }
  };

  const handleUsuarioFocus = () => {
    // Cuando el usuario hace foco en el campo usuario, marcamos que lo tocó
    if (!editing) {
      setUsuarioTouchedByUser(true);
    }
  };

  const handleUsuarioChange = (value: string) => {
    setUsuario(value);
  };

  const suggestUsername = () => {
    const suggested = generateUsername(nombre);
    if (suggested) setUsuario(suggested);
  };

  const openCreate = () => {
    setEditing(null);
    setDni('');
    setNombre('');
    setUsuario('');
    setUsuarioTouchedByUser(false);
    setClave('');
    setClave2('');
    setShowClave(false);
    setShowClave2(false);
    setEsAlumno(false);
    setEsEntrenador(false);
    setAlumnoActivo(true);
    setEntrenadorActivo(true);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p: Persona) => {
    setEditing(p);
    setDni(p.dni);
    setNombre(p.nombre);
    setUsuario(p.usuario);
    setUsuarioTouchedByUser(false);
    setClave('');
    setClave2('');
    setShowClave(false);
    setShowClave2(false);
    setEsAlumno(p.esAlumno);
    setEsEntrenador(p.esEntrenador);
    setAlumnoActivo(p.alumnoActivo);
    setEntrenadorActivo(p.entrenadorActivo);
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: { dni?: string; nombre?: string; usuario?: string; clave?: string; clave2?: string } = {};
    const isSelfLimitedEdit = !!(editing && currentUser?.id === editing.id && !currentUser?.roles?.includes('Admin'));

    if (isSelfLimitedEdit) {
      if (!usuario || usuario.trim().length === 0) err.usuario = 'Usuario requerido';
      const hasAnyClave = !!(clave && clave.trim().length > 0) || !!(clave2 && clave2.trim().length > 0);
      if (hasAnyClave) {
        if (!clave || clave.trim().length === 0) err.clave = 'Clave requerida';
        if (!clave2 || clave2.trim().length === 0) err.clave2 = 'Confirmación requerida';
        if (!err.clave && !err.clave2 && clave.trim() !== clave2.trim()) {
          err.clave2 = 'Las claves no coinciden';
        }
      }
    } else {
      // Admin create/edit (o Admin autoedición con formulario completo)
      if (!dni || dni.trim().length === 0) err.dni = 'DNI requerido';
      if (!nombre || nombre.trim().length === 0) err.nombre = 'Nombre requerido';
      if (!usuario || usuario.trim().length === 0) err.usuario = 'Usuario requerido';
      if (!editing) {
        if (!clave || clave.trim().length === 0) err.clave = 'Clave requerida';
        if (!clave2 || clave2.trim().length === 0) err.clave2 = 'Confirmación requerida';
        if (!err.clave && !err.clave2 && clave.trim() !== clave2.trim()) {
          err.clave2 = 'Las claves no coinciden';
        }
      } else {
        const hasAnyClave = !!(clave && clave.trim().length > 0) || !!(clave2 && clave2.trim().length > 0);
        if (hasAnyClave) {
          if (!clave || clave.trim().length === 0) err.clave = 'Clave requerida';
          if (!clave2 || clave2.trim().length === 0) err.clave2 = 'Confirmación requerida';
          if (!err.clave && !err.clave2 && clave.trim() !== clave2.trim()) {
            err.clave2 = 'Las claves no coinciden';
          }
        }
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const isSelfLimitedEdit = !!(editing && currentUser?.id === editing.id && !currentUser?.roles?.includes('Admin'));

      const data = isSelfLimitedEdit
        ? {
            usuario: usuario.trim(),
            ...(clave && { clave: clave.trim() }),
          }
        : {
            dni: dni.trim(),
            nombre: nombre.trim(),
            usuario: usuario.trim(),
            ...(clave && { clave: clave.trim() }),
            esAlumno,
            esEntrenador,
            alumnoActivo,
            entrenadorActivo,
          };

      if (editing) {
        await api.put(`/personas/${editing.id}`, data);
      } else {
        await api.post('/personas', { ...data, clave: clave.trim() });
      }
      await fetch();
      setOpen(false);
      setEditing(null);
      setSnackMsg(editing ? 'Persona actualizada' : 'Persona creada');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save persona', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (p: Persona) => {
    if (!window.confirm(`Borrar persona "${p.nombre}"?`)) return;
    try {
      await api.delete(`/personas/${p.id}`);
      fetch();
      setSnackMsg('Persona borrada');
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
        <Typography variant="h5">Personas</Typography>
        {currentUser?.roles?.includes('Admin') && (
          <Button variant="contained" onClick={openCreate}>Nueva persona</Button>
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
            <div>No hay personas.</div>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
                    {currentUser?.roles?.includes('Admin') && (
                      <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                    )}
                    <th style={{ textAlign: 'left', padding: 8 }}>DNI</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Usuario</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Alumno</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Entrenador</th>
                  </tr>
                </thead>
              <tbody>
                {items
                  .filter((it) => {
                    // Si es alumno (y no admin/entrenador), solo ver sus propios datos
                    if (currentUser?.esAlumno && !currentUser?.roles?.includes('Admin') && !currentUser?.roles?.includes('Entrenador')) {
                      if (it.id !== currentUser?.id) return false;
                    }
                    // Filtro de búsqueda
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (it.dni || '').toLowerCase().includes(q) || 
                           (it.nombre || '').toLowerCase().includes(q) ||
                           (it.usuario || '').toLowerCase().includes(q);
                  })
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>
                      {currentUser?.roles?.includes('Admin') ? (
                        <>
                          <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => onDelete(it)} aria-label="borrar">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        // Permitir edición limitada (usuario/clave) al propio usuario no Admin (Alumno o Entrenador)
                        (currentUser?.id === it.id && !currentUser?.roles?.includes('Admin')) ? (
                          <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar mis datos">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        ) : null
                      )}
                    </td>
                    {currentUser?.roles?.includes('Admin') && (
                      <td style={{ padding: 8 }}>{it.id}</td>
                    )}
                    <td style={{ padding: 8 }}>{it.dni}</td>
                    <td style={{ padding: 8 }}>{it.nombre}</td>
                    <td style={{ padding: 8 }}>{it.usuario}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      {it.esAlumno ? (it.alumnoActivo ? '✓' : '○') : '—'}
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      {it.esEntrenador ? (it.entrenadorActivo ? '✓' : '○') : '—'}
                    </td>
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
        <DialogTitle>{editing ? (currentUser?.id === editing.id && !currentUser?.roles?.includes('Admin') ? 'Editar mi usuario' : 'Editar persona') : 'Nueva persona'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Edición limitada para el propio usuario (Alumno o Entrenador no Admin) */}
            {editing && currentUser?.id === editing.id && !currentUser?.roles?.includes('Admin') ? (
              <>
                <TextField
                  label="DNI"
                  value={dni}
                  disabled
                  fullWidth
                />
                <TextField
                  label="Nombre"
                  value={nombre}
                  disabled
                  fullWidth
                />
                <TextField
                  label="Usuario"
                  value={usuario}
                  onChange={(ev) => handleUsuarioChange(ev.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Tooltip title="Sugerir usuario por nombre">
                        <IconButton onClick={suggestUsername} edge="end" aria-label="sugerir usuario">
                          <AutoFixHighIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                  fullWidth
                />
                <TextField
                  label={"Nueva clave (opcional)"}
                  type={showClave ? 'text' : 'password'}
                  value={clave}
                  onChange={(ev) => setClave(ev.target.value)}
                  error={!!errors.clave}
                  helperText={errors.clave}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => setShowClave((s) => !s)} edge="end" aria-label="mostrar/ocultar clave">
                        {showClave ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  fullWidth
                />
                <TextField
                  label={"Confirmar nueva clave"}
                  type={showClave2 ? 'text' : 'password'}
                  value={clave2}
                  onChange={(ev) => setClave2(ev.target.value)}
                  error={!!errors.clave2}
                  helperText={errors.clave2}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => setShowClave2((s) => !s)} edge="end" aria-label="mostrar/ocultar clave">
                        {showClave2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  fullWidth
                />
              </>
            ) : (
              <>
            <TextField
              label="DNI"
              value={dni}
              onChange={(ev) => setDni(ev.target.value)}
              error={!!errors.dni}
              helperText={errors.dni}
              required
              fullWidth
            />
            <TextField
              label="Nombre"
              value={nombre}
              onChange={(ev) => handleNombreChange(ev.target.value)}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
              fullWidth
            />
            <TextField
              label="Usuario"
              value={usuario}
              onChange={(ev) => handleUsuarioChange(ev.target.value)}
              onFocus={handleUsuarioFocus}
              error={!!errors.usuario}
              helperText={errors.usuario}
              required
              InputProps={{
                endAdornment: (
                  <Tooltip title="Sugerir usuario por nombre">
                    <IconButton onClick={suggestUsername} edge="end" aria-label="sugerir usuario">
                      <AutoFixHighIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
              fullWidth
            />
            <TextField
              label={editing ? "Nueva clave (dejar vacío para no cambiar)" : "Clave"}
              type={showClave ? 'text' : 'password'}
              value={clave}
              onChange={(ev) => setClave(ev.target.value)}
              error={!!errors.clave}
              helperText={errors.clave}
              required={!editing}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowClave((s) => !s)} edge="end" aria-label="mostrar/ocultar clave">
                    {showClave ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
              fullWidth
            />
            <TextField
              label={editing ? "Confirmar nueva clave" : "Confirmar clave"}
              type={showClave2 ? 'text' : 'password'}
              value={clave2}
              onChange={(ev) => setClave2(ev.target.value)}
              error={!!errors.clave2}
              helperText={errors.clave2}
              required={!editing}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowClave2((s) => !s)} edge="end" aria-label="mostrar/ocultar clave">
                    {showClave2 ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={esAlumno} onChange={(e) => setEsAlumno(e.target.checked)} />}
              label="Es alumno"
            />
            {esAlumno && (
              <FormControlLabel
                control={<Switch checked={alumnoActivo} onChange={(e) => setAlumnoActivo(e.target.checked)} />}
                label="Alumno activo"
              />
            )}
            <FormControlLabel
              control={<Switch checked={esEntrenador} onChange={(e) => setEsEntrenador(e.target.checked)} />}
              label="Es entrenador"
            />
            {esEntrenador && (
              <FormControlLabel
                control={<Switch checked={entrenadorActivo} onChange={(e) => setEntrenadorActivo(e.target.checked)} />}
                label="Entrenador activo"
              />
            )}
              </>
            )}
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