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
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type Persona = {
  id: number;
  nombre: string;
  dni: string;
};

type Ejercicio = {
  id: number;
  codEjercicio: string;
  descripcion: string;
};

type Etapa = {
  id: number;
  descripcion: string;
  orden: number;
};

type PlanDetalle = {
  id: number;
  planDiaId: number;
  ejercicioId: number;
  series: number;
  repeticiones: number;
  tiempoEnSeg: number;
  carga: number;
  orden: number;
  etapaId: number | null;
  ejercicio?: Ejercicio;
  etapa?: Etapa;
};

type PlanDia = {
  id: number;
  planId: number;
  nroDia: number;
  descripcion: string;
  detalles?: PlanDetalle[];
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
  dias?: PlanDia[];
};

export default function Planes() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);

  // dialog/form state for Plan
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

  // detail view state
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
  const [planDias, setPlanDias] = useState<PlanDia[]>([]);
  const [loadingDias, setLoadingDias] = useState(false);

  // PlanDia dialog state
  const [diaDialogOpen, setDiaDialogOpen] = useState(false);
  const [editingDia, setEditingDia] = useState<PlanDia | null>(null);
  const [diaNroDia, setDiaNroDia] = useState('');
  const [diaDescripcion, setDiaDescripcion] = useState('');
  const [diaErrors, setDiaErrors] = useState<{ nroDia?: string; descripcion?: string }>({});

  // PlanDetalle dialog state
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [selectedDia, setSelectedDia] = useState<PlanDia | null>(null);
  const [detalles, setDetalles] = useState<PlanDetalle[]>([]);
  const [editingDetalle, setEditingDetalle] = useState<PlanDetalle | null>(null);
  const [detalleEjercicioId, setDetalleEjercicioId] = useState<number | ''>('');
  const [detalleSeries, setDetalleSeries] = useState('');
  const [detalleRepeticiones, setDetalleRepeticiones] = useState('');
  const [detalleTiempo, setDetalleTiempo] = useState('');
  const [detalleCarga, setDetalleCarga] = useState('');
  const [detalleOrden, setDetalleOrden] = useState('');
  const [detalleEtapaId, setDetalleEtapaId] = useState<number | ''>('');
  const [detalleErrors, setDetalleErrors] = useState<{ ejercicio?: string }>({});

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

  const fetchEjercicios = async () => {
    try {
      const res = await api.get('/ejercicios');
      setEjercicios(res.data || []);
    } catch (err) {
      console.error('fetch ejercicios', err);
    }
  };

  const fetchEtapas = async () => {
    try {
      const res = await api.get('/etapas');
      setEtapas(res.data || []);
    } catch (err) {
      console.error('fetch etapas', err);
    }
  };

  const fetchPlanDias = async (planId: number) => {
    setLoadingDias(true);
    try {
      const res = await api.get(`/plan-dias?planId=${planId}`);
      setPlanDias(res.data || []);
    } catch (err) {
      console.error('fetch plan dias', err);
    } finally {
      setLoadingDias(false);
    }
  };

  const fetchDetalles = async (planDiaId: number) => {
    try {
      const res = await api.get(`/plan-detalles?planDiaId=${planDiaId}`);
      setDetalles(res.data || []);
    } catch (err) {
      console.error('fetch detalles', err);
    }
  };

  useEffect(() => {
    fetchPlanes();
    fetchPersonas();
    fetchEjercicios();
    fetchEtapas();
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

  const openDetailView = async (plan: Plan) => {
    setViewingPlan(plan);
    await fetchPlanDias(plan.id);
  };

  const closeDetailView = () => {
    setViewingPlan(null);
    setPlanDias([]);
  };

  // PlanDia handlers
  const openDiaCreate = () => {
    setEditingDia(null);
    setDiaNroDia('');
    setDiaDescripcion('');
    setDiaErrors({});
    setDiaDialogOpen(true);
  };

  const openDiaEdit = (dia: PlanDia) => {
    setEditingDia(dia);
    setDiaNroDia(String(dia.nroDia));
    setDiaDescripcion(dia.descripcion);
    setDiaErrors({});
    setDiaDialogOpen(true);
  };

  const closeDiaDialog = () => {
    if (isSaving) return;
    setDiaDialogOpen(false);
    setEditingDia(null);
  };

  const validateDia = () => {
    const err: { nroDia?: string; descripcion?: string } = {};
    if (!diaNroDia || diaNroDia.trim().length === 0) err.nroDia = 'Número de día requerido';
    else if (isNaN(Number(diaNroDia)) || Number(diaNroDia) < 1) err.nroDia = 'Debe ser un número mayor a 0';
    if (!diaDescripcion || diaDescripcion.trim().length === 0) err.descripcion = 'Descripción requerida';
    setDiaErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSaveDia = async () => {
    if (!validateDia() || !viewingPlan) return;
    setIsSaving(true);
    try {
      const data = {
        planId: viewingPlan.id,
        nroDia: Number(diaNroDia),
        descripcion: diaDescripcion.trim(),
      };

      if (editingDia) {
        await api.put(`/plan-dias/${editingDia.id}`, data);
      } else {
        await api.post('/plan-dias', data);
      }
      await fetchPlanDias(viewingPlan.id);
      setDiaDialogOpen(false);
      setEditingDia(null);
      setSnackMsg(editingDia ? 'Día actualizado' : 'Día creado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save dia', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteDia = async (dia: PlanDia) => {
    if (!window.confirm(`¿Borrar día ${dia.nroDia}?`)) return;
    try {
      await api.delete(`/plan-dias/${dia.id}`);
      if (viewingPlan) await fetchPlanDias(viewingPlan.id);
      setSnackMsg('Día borrado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('delete dia', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al borrar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  // PlanDetalle handlers
  const openDetallesView = async (dia: PlanDia) => {
    setSelectedDia(dia);
    await fetchDetalles(dia.id);
    openDetalleCreate(); // initialize form
    setDetalleDialogOpen(true);
  };

  const closeDetalleDialog = () => {
    setDetalleDialogOpen(false);
    setSelectedDia(null);
    setDetalles([]);
    setEditingDetalle(null);
  };

  const openDetalleCreate = () => {
    setEditingDetalle(null);
    setDetalleEjercicioId('');
    setDetalleSeries('0');
    setDetalleRepeticiones('0');
    setDetalleTiempo('0');
    setDetalleCarga('0');
    setDetalleOrden('0');
    setDetalleEtapaId('');
    setDetalleErrors({});
  };

  const openDetalleEdit = (detalle: PlanDetalle) => {
    setEditingDetalle(detalle);
    setDetalleEjercicioId(detalle.ejercicioId);
    setDetalleSeries(String(detalle.series));
    setDetalleRepeticiones(String(detalle.repeticiones));
    setDetalleTiempo(String(detalle.tiempoEnSeg));
    setDetalleCarga(String(detalle.carga));
    setDetalleOrden(String(detalle.orden));
    setDetalleEtapaId(detalle.etapaId || '');
    setDetalleErrors({});
  };

  const validateDetalle = () => {
    const err: { ejercicio?: string } = {};
    if (!detalleEjercicioId) err.ejercicio = 'Ejercicio requerido';
    setDetalleErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSaveDetalle = async () => {
    if (!validateDetalle() || !selectedDia) return;
    setIsSaving(true);
    try {
      const data = {
        planDiaId: selectedDia.id,
        ejercicioId: Number(detalleEjercicioId),
        series: Number(detalleSeries) || 0,
        repeticiones: Number(detalleRepeticiones) || 0,
        tiempoEnSeg: Number(detalleTiempo) || 0,
        carga: Number(detalleCarga) || 0,
        orden: Number(detalleOrden) || 0,
        etapaId: detalleEtapaId ? Number(detalleEtapaId) : undefined,
      };

      if (editingDetalle) {
        await api.put(`/plan-detalles/${editingDetalle.id}`, data);
      } else {
        await api.post('/plan-detalles', data);
      }
      await fetchDetalles(selectedDia.id);
      setEditingDetalle(null);
      openDetalleCreate(); // reset form
      setSnackMsg(editingDetalle ? 'Ejercicio actualizado' : 'Ejercicio agregado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('save detalle', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al guardar');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteDetalle = async (detalle: PlanDetalle) => {
    if (!window.confirm('¿Borrar este ejercicio?')) return;
    try {
      await api.delete(`/plan-detalles/${detalle.id}`);
      if (selectedDia) await fetchDetalles(selectedDia.id);
      setSnackMsg('Ejercicio borrado');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('delete detalle', err, err?.response?.data);
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

  // Render dialogs function (shared between views)
  const renderDialogs = () => (
    <>
      {/* Dialog for PlanDia */}
      <Dialog open={diaDialogOpen} onClose={closeDiaDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingDia ? 'Editar día' : 'Nuevo día'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Número de día"
              type="number"
              value={diaNroDia}
              onChange={(e) => setDiaNroDia(e.target.value)}
              error={!!diaErrors.nroDia}
              helperText={diaErrors.nroDia}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={diaDescripcion}
              onChange={(e) => setDiaDescripcion(e.target.value)}
              error={!!diaErrors.descripcion}
              helperText={diaErrors.descripcion}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDiaDialog} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveDia} variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for PlanDetalles (exercises) */}
      <Dialog open={detalleDialogOpen} onClose={closeDetalleDialog} fullWidth maxWidth="md">
        <DialogTitle>
          Ejercicios del Día {selectedDia?.nroDia} - {selectedDia?.descripcion}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {editingDetalle ? 'Editar ejercicio' : 'Agregar ejercicio'}
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth error={!!detalleErrors.ejercicio} required>
                <InputLabel>Ejercicio</InputLabel>
                <Select
                  value={detalleEjercicioId}
                  onChange={(e) => setDetalleEjercicioId(e.target.value as number)}
                  label="Ejercicio"
                >
                  <MenuItem value="">
                    <em>Seleccionar ejercicio</em>
                  </MenuItem>
                  {ejercicios.map((ej) => (
                    <MenuItem key={ej.id} value={ej.id}>
                      {ej.codEjercicio} - {ej.descripcion}
                    </MenuItem>
                  ))}
                </Select>
                {detalleErrors.ejercicio && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {detalleErrors.ejercicio}
                  </Typography>
                )}
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Series"
                    type="number"
                    value={detalleSeries}
                    onChange={(e) => setDetalleSeries(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Repeticiones"
                    type="number"
                    value={detalleRepeticiones}
                    onChange={(e) => setDetalleRepeticiones(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Tiempo (seg)"
                    type="number"
                    value={detalleTiempo}
                    onChange={(e) => setDetalleTiempo(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Carga (kg)"
                    type="number"
                    value={detalleCarga}
                    onChange={(e) => setDetalleCarga(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Orden"
                    type="number"
                    value={detalleOrden}
                    onChange={(e) => setDetalleOrden(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Etapa (opcional)</InputLabel>
                    <Select
                      value={detalleEtapaId}
                      onChange={(e) => setDetalleEtapaId(e.target.value as number)}
                      label="Etapa (opcional)"
                    >
                      <MenuItem value="">
                        <em>Sin etapa</em>
                      </MenuItem>
                      {etapas.map((et) => (
                        <MenuItem key={et.id} value={et.id}>
                          {et.descripcion}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box display="flex" gap={1}>
                {editingDetalle && (
                  <Button onClick={openDetalleCreate} size="small">
                    Cancelar edición
                  </Button>
                )}
                <Button onClick={handleSaveDetalle} variant="contained" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : editingDetalle ? 'Actualizar' : 'Agregar'}
                </Button>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ejercicios del día
            </Typography>
            {detalles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No hay ejercicios agregados aún.
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Orden</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Ejercicio</th>
                      <th style={{ textAlign: 'center', padding: 8 }}>Series</th>
                      <th style={{ textAlign: 'center', padding: 8 }}>Reps</th>
                      <th style={{ textAlign: 'center', padding: 8 }}>Tiempo</th>
                      <th style={{ textAlign: 'center', padding: 8 }}>Carga</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Etapa</th>
                    </tr>
                  </thead>
                <tbody>
                  {detalles.sort((a, b) => a.orden - b.orden).map((det) => {
                    const ej = ejercicios.find((e) => e.id === det.ejercicioId);
                    const et = etapas.find((e) => e.id === det.etapaId);
                    return (
                      <tr key={det.id} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 8 }}>
                          {canEdit && (
                            <>
                              <IconButton size="small" onClick={() => openDetalleEdit(det)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => onDeleteDetalle(det)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </td>
                        <td style={{ padding: 8 }}>{det.orden}</td>
                        <td style={{ padding: 8 }}>
                          {ej ? `${ej.codEjercicio}` : `Ejercicio ${det.ejercicioId}`}
                        </td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{det.series}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{det.repeticiones}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{det.tiempoEnSeg}s</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{det.carga}kg</td>
                        <td style={{ padding: 8 }}>{et ? et.descripcion : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetalleDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // If viewing plan details, render detail view
  if (viewingPlan) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={closeDetailView} sx={{ mb: 2 }}>
          Volver a lista de planes
        </Button>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Plan de Entrenamiento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Alumno:</Typography>
              <Typography variant="body1">{viewingPlan.alumno.nombre}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Entrenador:</Typography>
              <Typography variant="body1">{viewingPlan.entrenador.nombre}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Desde:</Typography>
              <Typography variant="body1">{formatDate(viewingPlan.fechaDesde)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Hasta:</Typography>
              <Typography variant="body1">{formatDate(viewingPlan.fechaHasta)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Estado:</Typography>
              {viewingPlan.activo ? (
                <Chip label="Activo" color="success" size="small" />
              ) : (
                <Chip label="Inactivo" size="small" />
              )}
            </Grid>
          </Grid>
        </Paper>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Días del Plan</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openDiaCreate}>
              Agregar día
            </Button>
          )}
        </Box>

        {loadingDias ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : planDias.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay días en este plan. Agregá el primer día para comenzar.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {planDias.sort((a, b) => a.nroDia - b.nroDia).map((dia) => (
              <Grid item xs={12} sm={6} md={4} key={dia.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">Día {dia.nroDia}</Typography>
                      {canEdit && (
                        <Box>
                          <IconButton size="small" onClick={() => openDiaEdit(dia)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => onDeleteDia(dia)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {dia.descripcion}
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => openDetallesView(dia)}
                    >
                      Ver ejercicios
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
          <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
            {snackMsg}
          </Alert>
        </Snackbar>

        {/* Dialogs for PlanDia and PlanDetalle - rendered here for detail view */}
        {renderDialogs()}
      </Box>
    );
  }

  // Otherwise render main list view
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
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Alumno</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Entrenador</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Desde</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Hasta</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Estado</th>
                  </tr>
                </thead>
              <tbody>
                {filteredItems
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((it) => (
                    <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>
                        <IconButton size="small" onClick={() => openDetailView(it)} aria-label="ver detalle" title="Ver detalle">
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

      {/* Dialogs for PlanDia and PlanDetalle - rendered here for list view */}
      {renderDialogs()}
    </Box>
  );
}
