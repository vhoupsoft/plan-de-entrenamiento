import React, { useEffect, useState } from 'react';
import api, { getApiBaseUrl } from '../api';
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';

type Ejercicio = {
  id: number;
  codEjercicio: string;
  descripcion?: string | null;
  imagenes?: string | null;
  links?: string | null;
};

type EjercicioAlternativo = {
  id: number;
  ejercicioId: number;
  ejercicioAlternativoId: number;
  alternativo: Ejercicio;
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
  const [imagenes, setImagenes] = useState('');
  const [links, setLinks] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // modal alternativos
  const [alternativosModalOpen, setAlternativosModalOpen] = useState(false);
  const [selectedEjercicio, setSelectedEjercicio] = useState<Ejercicio | null>(null);
  const [alternativos, setAlternativos] = useState<EjercicioAlternativo[]>([]);
  const [selectedNuevoAlternativo, setSelectedNuevoAlternativo] = useState<number | ''>('');
  const [loadingAlternativos, setLoadingAlternativos] = useState(false);

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
    setImagenes('');
    setLinks('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (e: Ejercicio) => {
    setEditing(e);
    setCod(e.codEjercicio);
    setDescripcion(e.descripcion || '');
    setImagenes(e.imagenes || '');
    setLinks(e.links || '');
    setErrors({});
    setOpen(true);
  };

  const uploadFile = async (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, JPEG, GIF o PNG');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const apiBase = getApiBaseUrl();
      const uploadUrl = apiBase ? `${apiBase}/api/upload/ejercicio-imagen` : '/api/upload/ejercicio-imagen';

      const response = await window.fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al subir la imagen');
      }

      const data = await response.json();
      
      // Agregar la URL al array de imágenes
      const currentImages = imagenes ? imagenes.split(',').filter(Boolean) : [];
      currentImages.push(data.url);
      setImagenes(currentImages.join(','));

    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    // Reset input
    event.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await uploadFile(file);
          break;
        }
      }
    }
  };

  const handleDeleteImage = (urlToDelete: string) => {
    const currentImages = imagenes.split(',').filter(Boolean);
    const updatedImages = currentImages.filter(url => url !== urlToDelete);
    setImagenes(updatedImages.join(','));
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setEditing(null);
  };

  // Funciones para modal de alternativos
  const openAlternativosModal = async (ejercicio: Ejercicio) => {
    setSelectedEjercicio(ejercicio);
    setAlternativosModalOpen(true);
    setLoadingAlternativos(true);
    try {
      const res = await api.get(`/ejercicio-alternativos/${ejercicio.id}`);
      setAlternativos(res.data || []);
      setSelectedNuevoAlternativo('');
    } catch (err) {
      console.error('Error al cargar alternativos', err);
      setSnackMsg('Error al cargar alternativos');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoadingAlternativos(false);
    }
  };

  const closeAlternativosModal = () => {
    setAlternativosModalOpen(false);
    setSelectedEjercicio(null);
    setAlternativos([]);
    setSelectedNuevoAlternativo('');
  };

  const addAlternativo = async () => {
    if (!selectedNuevoAlternativo || !selectedEjercicio) return;
    
    try {
      await api.post('/ejercicio-alternativos', {
        ejercicioId: selectedEjercicio.id,
        ejercicioAlternativoId: selectedNuevoAlternativo
      });
      
      setSnackMsg('Alternativo agregado correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
      
      // Recargar alternativos
      const res = await api.get(`/ejercicio-alternativos/${selectedEjercicio.id}`);
      setAlternativos(res.data || []);
      setSelectedNuevoAlternativo('');
    } catch (err: any) {
      console.error('Error al agregar alternativo', err);
      setSnackMsg(err?.response?.data?.error || 'Error al agregar alternativo');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const removeAlternativo = async (alternativoId: number) => {
    if (!window.confirm('¿Quitar este ejercicio alternativo?')) return;
    
    try {
      await api.delete(`/ejercicio-alternativos/${alternativoId}`);
      
      setSnackMsg('Alternativo quitado correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
      
      // Recargar alternativos
      if (selectedEjercicio) {
        const res = await api.get(`/ejercicio-alternativos/${selectedEjercicio.id}`);
        setAlternativos(res.data || []);
      }
    } catch (err: any) {
      console.error('Error al quitar alternativo', err);
      setSnackMsg(err?.response?.data?.error || 'Error al quitar alternativo');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
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
      const data = {
        codEjercicio: cod.trim(),
        descripcion: descripcion || undefined,
        imagenes: imagenes.trim() || undefined,
        links: links.trim() || undefined
      };
      if (editing) {
        await api.put(`/ejercicios/${editing.id}`, data);
      } else {
        await api.post('/ejercicios', data);
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
                          <IconButton size="small" onClick={() => openAlternativosModal(it)} aria-label="alternativos">
                            <SwapHorizIcon fontSize="small" />
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
            <Box>
              <Typography variant="subtitle2" gutterBottom>Imágenes</Typography>
              
              {/* Galería de imágenes existentes */}
              {imagenes && imagenes.split(',').filter(Boolean).length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                  {imagenes.split(',').filter(Boolean).map((url, idx) => (
                    <Box key={idx} position="relative" display="inline-block">
                      <img 
                        src={url} 
                        alt={`Imagen ${idx + 1}`}
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                        onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(url)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                          width: 24,
                          height: 24,
                        }}
                      >
                        <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Área de drop y upload */}
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onPaste={handlePaste}
                tabIndex={0}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  transition: 'all 0.2s',
                  outline: 'none',
                  '&:hover': {
                    borderColor: '#1976d2',
                    bgcolor: '#f0f7ff'
                  },
                  '&:focus-visible': {
                    borderColor: '#1976d2',
                    bgcolor: '#f0f7ff'
                  }
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {uploadingImage ? 'Subiendo...' : 'Arrastrá una imagen, pegala (Ctrl+V) o'}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={uploadingImage}
                  size="small"
                  startIcon={uploadingImage ? <CircularProgress size={16} /> : null}
                >
                  {uploadingImage ? 'Subiendo...' : 'Seleccionar archivo'}
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.gif,.png,image/jpeg,image/jpg,image/gif,image/png"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  JPG, JPEG, GIF, PNG (máx. 5MB)
                </Typography>
              </Box>
            </Box>
            <TextField
              label="Links de videos/sitios (URLs separadas por comas)"
              value={links}
              onChange={(ev) => setLinks(ev.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="https://youtube.com/..., https://ejemplo.com/tutorial"
              helperText="Ingresá URLs a videos o sitios explicativos separadas por comas"
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

      {/* Modal de ejercicios alternativos */}
      <Dialog open={alternativosModalOpen} onClose={closeAlternativosModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ejercicios Alternativos - {selectedEjercicio?.codEjercicio}
        </DialogTitle>
        <DialogContent>
          {loadingAlternativos ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Ejercicios alternativos configurados:
              </Typography>
              {alternativos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No hay ejercicios alternativos configurados
                </Typography>
              ) : (
                <List dense>
                  {alternativos.map((alt) => (
                    <ListItem
                      key={alt.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="quitar"
                          size="small"
                          onClick={() => removeAlternativo(alt.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText>
                        <Chip 
                          label={`${alt.alternativo.codEjercicio} - ${alt.alternativo.descripcion?.substring(0, 40) || ''}...`} 
                          color="primary" 
                          size="small" 
                        />
                      </ListItemText>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                Agregar ejercicio alternativo:
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>Seleccionar ejercicio</InputLabel>
                  <Select
                    value={selectedNuevoAlternativo}
                    onChange={(e) => setSelectedNuevoAlternativo(e.target.value as number)}
                    label="Seleccionar ejercicio"
                  >
                    <MenuItem value="">
                      <em>Seleccionar...</em>
                    </MenuItem>
                    {items
                      .filter((ej) => ej.id !== selectedEjercicio?.id && !alternativos.some((alt) => alt.ejercicioAlternativoId === ej.id))
                      .map((ej) => (
                        <MenuItem key={ej.id} value={ej.id}>
                          {ej.codEjercicio} - {ej.descripcion}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={addAlternativo}
                  disabled={!selectedNuevoAlternativo}
                  size="small"
                >
                  Agregar
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAlternativosModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
