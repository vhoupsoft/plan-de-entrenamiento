import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type Persona = {
  id: number;
  nombre: string;
  dni: string;
  esAlumno?: boolean;
  esEntrenador?: boolean;
  alumnoActivo?: boolean;
  entrenadorActivo?: boolean;
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

// Componente para item sortable (drag and drop)
function SortableDetalleRow({ 
  detalle, 
  ejercicio, 
  etapa, 
  canEdit, 
  onEdit, 
  onDelete 
}: { 
  detalle: PlanDetalle; 
  ejercicio?: Ejercicio; 
  etapa?: Etapa; 
  canEdit?: boolean; 
  onEdit: (det: PlanDetalle) => void;
  onDelete: (det: PlanDetalle) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: detalle.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f5f5f5' : 'transparent',
  };

  return (
    <tr ref={setNodeRef} style={{ ...style, borderTop: '1px solid #eee' }}>
      <td style={{ padding: 8 }}>
        {canEdit && (
          <IconButton 
            size="small" 
            {...attributes} 
            {...listeners}
            sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}
      </td>
      <td style={{ padding: 8 }}>
        {canEdit && (
          <>
            <IconButton size="small" onClick={() => onEdit(detalle)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(detalle)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </td>
      <td style={{ padding: 8 }}>{detalle.orden}</td>
      <td style={{ padding: 8 }}>
        {ejercicio ? `${ejercicio.codEjercicio}` : `Ejercicio ${detalle.ejercicioId}`}
      </td>
      <td style={{ padding: 8, textAlign: 'center' }}>{detalle.series}</td>
      <td style={{ padding: 8, textAlign: 'center' }}>{detalle.repeticiones}</td>
      <td style={{ padding: 8, textAlign: 'center' }}>{detalle.tiempoEnSeg}s</td>
      <td style={{ padding: 8, textAlign: 'center' }}>{detalle.carga}kg</td>
      <td style={{ padding: 8 }}>{etapa ? etapa.descripcion : '-'}</td>
    </tr>
  );
}

export default function Planes() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);

  // drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ref para scroll automático al editar
  const detalleFormRef = useRef<HTMLDivElement>(null);

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
  const [detalleFechaDesde, setDetalleFechaDesde] = useState<string>('');
  const [detalleErrors, setDetalleErrors] = useState<{ ejercicio?: string }>({});

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  
  // copy confirmation dialog
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [planToCopy, setPlanToCopy] = useState<Plan | null>(null);
  
  // copy day dialog
  const [copyDayDialogOpen, setCopyDayDialogOpen] = useState(false);
  const [dayToCopy, setDayToCopy] = useState<PlanDia | null>(null);
  const [copyDestAlumnoId, setCopyDestAlumnoId] = useState<number | ''>('');
  const [copyDestPlanId, setCopyDestPlanId] = useState<number | ''>('');
  const [copyDestDiaId, setCopyDestDiaId] = useState<number | ''>('');
  const [copyReplaceExisting, setCopyReplaceExisting] = useState(false);
  const [alumnosForCopy, setAlumnosForCopy] = useState<Persona[]>([]);
  const [planesForCopy, setPlanesForCopy] = useState<Plan[]>([]);
  const [diasForCopy, setDiasForCopy] = useState<PlanDia[]>([]);
  
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

  const openCopyDialog = (plan: Plan) => {
    setPlanToCopy(plan);
    setCopyDialogOpen(true);
  };

  const closeCopyDialog = () => {
    setPlanToCopy(null);
    setCopyDialogOpen(false);
  };

  const confirmCopy = async () => {
    if (!planToCopy) return;
    
    try {
      setIsSaving(true);
      await api.post(`/planes/${planToCopy.id}/copy`);
      fetchPlanes();
      setSnackMsg(`Plan copiado correctamente (inactivo). Alumno: ${planToCopy.alumno.nombre}`);
      setSnackSeverity('success');
      setSnackOpen(true);
      closeCopyDialog();
    } catch (err: any) {
      console.error('copy plan error', err, err?.response?.data);
      setSnackMsg(err?.response?.data?.error || 'Error al copiar plan');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setIsSaving(false);
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
    // Siempre usar la fecha de hoy como default para vigencia del historial
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDetalleFechaDesde(`${yyyy}-${mm}-${dd}`);
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
    // default fechaDesde to today (user can adjust)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDetalleFechaDesde(`${yyyy}-${mm}-${dd}`);
    setDetalleErrors({});
    
    // Scroll automático al formulario de edición
    setTimeout(() => {
      detalleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = detalles.findIndex((d) => d.id === active.id);
    const newIndex = detalles.findIndex((d) => d.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar en el estado local
    const newDetalles = arrayMove(detalles, oldIndex, newIndex);
    
    // Actualizar los números de orden
    const updates = newDetalles.map((det, index) => ({
      id: det.id,
      orden: index + 1,
    }));

    // Actualizar el estado local inmediatamente para feedback visual
    setDetalles(newDetalles.map((det, index) => ({ ...det, orden: index + 1 })));

    try {
      // Llamar al backend para persistir el cambio
      await api.put('/plan-detalles/reorder', { updates });
      
      setSnackMsg('Orden actualizado correctamente');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err: any) {
      console.error('reorder error', err);
      // Revertir en caso de error
      fetchDetalles(selectedDia!.id);
      setSnackMsg(err?.response?.data?.error || 'Error al reordenar');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
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
        fechaDesde: detalleFechaDesde,
      };

      let detalleId: number | null = null;
      if (editingDetalle) {
        await api.put(`/plan-detalles/${editingDetalle.id}`, data);
        detalleId = editingDetalle.id;
      } else {
        const res = await api.post('/plan-detalles', data);
        detalleId = res.data?.id || null;
      }

      // backend will create initial historial atomically using fechaDesde provided in payload

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

  // Copy day functionality
  const openCopyDayDialog = async (dia: PlanDia) => {
    setDayToCopy(dia);
    setCopyDestAlumnoId('');
    setCopyDestPlanId('');
    setCopyDestDiaId('');
    setCopyReplaceExisting(false);
    setPlanesForCopy([]);
    setDiasForCopy([]);
    
    try {
      const res = await api.get('/personas', { params: { esAlumno: true, page: 1, pageSize: 1000 } });
      setAlumnosForCopy(res.data.items || []);
    } catch (err) {
      console.error('Error loading alumnos for copy', err);
      setSnackMsg('Error al cargar alumnos');
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }
    
    setCopyDayDialogOpen(true);
  };

  const handleCopyAlumnoChange = async (alumnoId: number) => {
    setCopyDestAlumnoId(alumnoId);
    setCopyDestPlanId('');
    setCopyDestDiaId('');
    setDiasForCopy([]);
    
    if (!alumnoId) {
      setPlanesForCopy([]);
      return;
    }
    
    try {
      const res = await api.get('/planes', { params: { alumnoId, page: 1, pageSize: 1000 } });
      setPlanesForCopy(res.data.items || []);
    } catch (err) {
      console.error('Error loading planes for copy', err);
      setSnackMsg('Error al cargar planes');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleCopyPlanChange = async (planId: number) => {
    setCopyDestPlanId(planId);
    setCopyDestDiaId('');
    
    if (!planId) {
      setDiasForCopy([]);
      return;
    }
    
    try {
      const res = await api.get(`/plan-dias/plan/${planId}`);
      setDiasForCopy(res.data || []);
    } catch (err) {
      console.error('Error loading dias for copy', err);
      setSnackMsg('Error al cargar días');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const confirmCopyDay = async () => {
    if (!dayToCopy || !copyDestDiaId) {
      setSnackMsg('Debe seleccionar un día destino');
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    try {
      // Get source day exercises
      const sourceRes = await api.get(`/plan-detalles/dia/${dayToCopy.id}`);
      const sourceDetalles: PlanDetalle[] = sourceRes.data || [];
      
      if (sourceDetalles.length === 0) {
        setSnackMsg('El día origen no tiene ejercicios para copiar');
        setSnackSeverity('error');
        setSnackOpen(true);
        return;
      }

      // Get destination day exercises
      const destRes = await api.get(`/plan-detalles/dia/${copyDestDiaId}`);
      const destDetalles: PlanDetalle[] = destRes.data || [];
      
      // If destination has exercises and user didn't choose to replace
      if (destDetalles.length > 0 && !copyReplaceExisting) {
        const confirmMsg = `El día destino ya tiene ${destDetalles.length} ejercicio(s). ¿Desea agregar los nuevos ejercicios o reemplazarlos?\n\nPresione OK para AGREGAR o Cancelar para elegir otra opción.`;
        const shouldAdd = window.confirm(confirmMsg);
        
        if (!shouldAdd) {
          // Ask if they want to replace
          const confirmReplace = window.confirm('¿Desea REEMPLAZAR todos los ejercicios existentes?');
          if (confirmReplace) {
            setCopyReplaceExisting(true);
            // Delete existing exercises
            for (const detalle of destDetalles) {
              await api.delete(`/plan-detalles/${detalle.id}`);
            }
          } else {
            return; // User cancelled
          }
        }
      } else if (destDetalles.length > 0 && copyReplaceExisting) {
        // Delete existing exercises if replace was selected
        for (const detalle of destDetalles) {
          await api.delete(`/plan-detalles/${detalle.id}`);
        }
      }

      // Copy exercises to destination
      let maxOrden = 0;
      if (!copyReplaceExisting && destDetalles.length > 0) {
        maxOrden = Math.max(...destDetalles.map(d => d.orden), 0);
      }

      for (const detalle of sourceDetalles) {
        await api.post('/plan-detalles', {
          planDiaId: copyDestDiaId,
          ejercicioId: detalle.ejercicioId,
          series: detalle.series,
          repeticiones: detalle.repeticiones,
          tiempoEnSeg: detalle.tiempoEnSeg,
          carga: detalle.carga,
          orden: maxOrden + detalle.orden,
          etapaId: detalle.etapaId,
        });
      }

      setSnackMsg(`${sourceDetalles.length} ejercicio(s) copiado(s) exitosamente`);
      setSnackSeverity('success');
      setSnackOpen(true);
      setCopyDayDialogOpen(false);
      
      // Refresh if we're viewing the destination day
      if (selectedDia && selectedDia.id === copyDestDiaId) {
        await fetchDetalles(selectedDia.id);
      }
    } catch (err: any) {
      console.error('Error copying day', err);
      setSnackMsg(err?.response?.data?.error || 'Error al copiar día');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const filteredItems = items.filter((it) => {
    // Si es alumno (y no admin/entrenador), solo ver sus propios planes
    if (currentUser?.esAlumno && !currentUser?.roles?.includes('Admin') && !currentUser?.roles?.includes('Entrenador')) {
      if (it.alumnoId !== currentUser?.id) return false;
    }
    // Filtro de búsqueda
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
          {canEdit && (
            <Box ref={detalleFormRef} sx={{ mt: 2, mb: 3 }}>
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

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Vigente desde"
                    type="date"
                    value={detalleFechaDesde}
                    onChange={(e) => setDetalleFechaDesde(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
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
          )}

          {canEdit && <Divider />}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ejercicios del día
            </Typography>
            {detalles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No hay ejercicios agregados aún.
              </Typography>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Arrastrar</th>
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
                      <SortableContext
                        items={detalles.map((d) => d.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {detalles.sort((a, b) => a.orden - b.orden).map((det) => {
                          const ej = ejercicios.find((e) => e.id === det.ejercicioId);
                          const et = etapas.find((e) => e.id === det.etapaId);
                          return (
                            <SortableDetalleRow
                              key={det.id}
                              detalle={det}
                              ejercicio={ej}
                              etapa={et}
                              canEdit={canEdit}
                              onEdit={openDetalleEdit}
                              onDelete={onDeleteDetalle}
                            />
                          );
                        })}
                      </SortableContext>
                    </tbody>
                  </table>
                </Box>
              </DndContext>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetalleDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for copying day */}
      <Dialog open={copyDayDialogOpen} onClose={() => setCopyDayDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Copiar Día {dayToCopy?.nroDia} a otro plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Seleccione el destino donde desea copiar los ejercicios del día {dayToCopy?.nroDia}
            </Typography>
            
            <FormControl fullWidth required>
              <InputLabel>Alumno</InputLabel>
              <Select
                value={copyDestAlumnoId}
                onChange={(e) => handleCopyAlumnoChange(e.target.value as number)}
                label="Alumno"
              >
                <MenuItem value="">
                  <em>Seleccionar alumno</em>
                </MenuItem>
                {alumnosForCopy.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {copyDestAlumnoId && (
              <FormControl fullWidth required>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={copyDestPlanId}
                  onChange={(e) => handleCopyPlanChange(e.target.value as number)}
                  label="Plan"
                >
                  <MenuItem value="">
                    <em>Seleccionar plan</em>
                  </MenuItem>
                  {planesForCopy.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {formatDate(plan.fechaDesde)} - {formatDate(plan.fechaHasta)}
                      {plan.activo && ' (Activo)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {copyDestPlanId && (
              <FormControl fullWidth required>
                <InputLabel>Día destino</InputLabel>
                <Select
                  value={copyDestDiaId}
                  onChange={(e) => setCopyDestDiaId(e.target.value as number)}
                  label="Día destino"
                >
                  <MenuItem value="">
                    <em>Seleccionar día</em>
                  </MenuItem>
                  {diasForCopy.map((dia) => (
                    <MenuItem key={dia.id} value={dia.id}>
                      Día {dia.nroDia} - {dia.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDayDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmCopyDay} 
            variant="contained" 
            disabled={!copyDestDiaId}
          >
            Copiar
          </Button>
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
              <Typography variant="body1" fontWeight="bold">{viewingPlan.alumno.nombre}</Typography>
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
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => openDetallesView(dia)}
                      >
                        Ver ejercicios
                      </Button>
                      {canEdit && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openCopyDayDialog(dia)}
                          title="Compartir día"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
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
                    {currentUser?.roles?.includes('Admin') && (
                      <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                    )}
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
                            <IconButton size="small" onClick={() => openEdit(it)} aria-label="editar" title="Editar">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => openCopyDialog(it)} aria-label="copiar" title="Copiar plan">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(it)}
                              aria-label="borrar"
                              title="Eliminar"
                              disabled={!currentUser?.roles?.includes('Admin')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </td>
                      {currentUser?.roles?.includes('Admin') && (
                        <td style={{ padding: 8 }}>{it.id}</td>
                      )}
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

      {/* Dialog de confirmación de copia */}
      <Dialog open={copyDialogOpen} onClose={closeCopyDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Copiar plan</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Confirmar la copia del plan?
          </Typography>
          {planToCopy && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Alumno:</strong> {planToCopy.alumno.nombre}</Typography>
              <Typography variant="body2"><strong>Entrenador:</strong> {planToCopy.entrenador.nombre}</Typography>
              <Typography variant="body2"><strong>Fecha desde:</strong> {formatDate(planToCopy.fechaDesde)}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                El plan se copiará completo (con todos sus días, ejercicios y valores) y se creará como <strong>inactivo</strong> para que puedas editarlo antes de activarlo.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCopyDialog} disabled={isSaving}>Cancelar</Button>
          <Button onClick={confirmCopy} variant="contained" disabled={isSaving}>
            {isSaving ? 'Copiando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

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
                  .filter((p) => p.esAlumno !== false) // si viene undefined, lo mostramos; si existe, true
                  .filter((p) => p.alumnoActivo !== false)
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
                  .filter((p) => p.esEntrenador !== false)
                  .filter((p) => p.entrenadorActivo !== false)
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
