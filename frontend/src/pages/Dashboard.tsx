import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  TextField,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useLocation } from 'react-router-dom';

type Persona = {
  id: number;
  nombre: string;
  dni: string;
};

type Ejercicio = {
  id: number;
  codEjercicio: string;
  descripcion: string;
  imagenes?: string | null;
  links?: string | null;
};

type EjercicioAlternativo = {
  id: number;
  ejercicioId: number;
  ejercicioAlternativoId: number;
  alternativo: Ejercicio;
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

type UserMode = 'alumno' | 'entrenador';

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<UserMode | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showAlumnoSelector, setShowAlumnoSelector] = useState(false);
  const [alumnos, setAlumnos] = useState<Persona[]>([]);
  const [selectedAlumnoIds, setSelectedAlumnoIds] = useState<number[]>([]);
  const [planesActivos, setPlanesActivos] = useState<Plan[]>([]);
  const [currentAlumnoIndex, setCurrentAlumnoIndex] = useState(0);
  const [currentDiaIndex, setCurrentDiaIndex] = useState(0);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [expandedEtapas, setExpandedEtapas] = useState<Set<number>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  
  // Estado por alumno: guarda diaIndex y etapas expandidas para cada alumno
  const [alumnoStates, setAlumnoStates] = useState<Map<number, { diaIndex: number, expandedEtapas: Set<number> }>>(new Map());
  
  // Modal de ejercicio alternativo
  const [alternativoModalOpen, setAlternativoModalOpen] = useState(false);
  const [selectedAlternativo, setSelectedAlternativo] = useState<Ejercicio | null>(null);
  const [ejercicioAlternativos, setEjercicioAlternativos] = useState<Map<number, EjercicioAlternativo[]>>(new Map());
  
  // Dialog for editing planDetalle values
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState<any | null>(null);
  const [editSeries, setEditSeries] = useState<number | ''>('');
  const [editReps, setEditReps] = useState<number | ''>('');
  const [editTiempo, setEditTiempo] = useState<number | ''>('');
  const [editCarga, setEditCarga] = useState<number | ''>('');
  const [editFechaDesde, setEditFechaDesde] = useState<string>('');
  // cache latest historial per planDetalle.id
  const [latestHistorial, setLatestHistorial] = useState<Record<number, any>>({});

  const getActualHistorial = async (planDetalleId: number) => {
    try {
      console.log('Obteniendo historial vigente para planDetalle:', planDetalleId);
      const res = await api.get(`/plan-detalles/${planDetalleId}/actual`);
      console.log('Historial vigente recibido:', res.data);
      setLatestHistorial((s) => ({ ...s, [planDetalleId]: res.data }));
      return res.data;
    } catch (err: any) {
      console.error('getActualHistorial error:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      // Si no hay historial (404), retornar null
      if (err.response?.status === 404) {
        console.log('No hay historial vigente para este detalle, usando valores base del plan');
        return null;
      }
      return null;
    }
  };

  const openEditDetalle = async (detalle: any) => {
    setEditingDetalle(detalle);
    // Asegurar que tenemos el historial vigente antes de abrir el modal
    const hv = await getActualHistorial(detalle.id);
    setEditSeries((hv?.series ?? detalle.series) ?? '');
    setEditReps((hv?.repeticiones ?? detalle.repeticiones) ?? '');
    setEditTiempo((hv?.tiempoEnSeg ?? detalle.tiempoEnSeg) ?? '');
    setEditCarga((hv?.carga ?? detalle.carga) ?? '');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setEditFechaDesde(`${yyyy}-${mm}-${dd}`);
    setEditDialogOpen(true);
  };

  const saveEditDetalle = async () => {
    if (!editingDetalle) return;
    try {
      const payload: any = {
        fechaDesde: editFechaDesde,
      };
      
      // Solo incluir campos que el usuario modificó (diferentes de vacío)
      if (editSeries !== '') payload.series = Number(editSeries);
      if (editReps !== '') payload.repeticiones = Number(editReps);
      if (editTiempo !== '') payload.tiempoEnSeg = Number(editTiempo);
      if (editCarga !== '') payload.carga = Number(editCarga);
      
      console.log('Guardando historial para planDetalle:', editingDetalle.id, 'Payload:', payload);
      const response = await api.post(`/plan-detalles/${editingDetalle.id}/historial`, payload);
      console.log('Respuesta del servidor:', response.data);
      alert('Cambios guardados correctamente');
  // refrescar valores vigentes solo para este detalle
  await getActualHistorial(editingDetalle.id);
  setEditDialogOpen(false);
    } catch (err: any) {
      console.error('saveEditDetalle error completo:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      alert(`Error al guardar historial: ${err.response?.data?.error || err.message}`);
    }
  };
  
  // Flag para evitar reinicialización cuando AuthContext revalida el usuario
  const [initialized, setInitialized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const isAlumno = currentUser?.esAlumno || false;
  const isEntrenador = currentUser?.esEntrenador || currentUser?.roles?.includes('Entrenador') || false;

  // Persistencia ligera en localStorage
  type StoredAlumnoState = { diaIndex: number; expandedEtapas: number[] };
  type StoredState = {
    mode: UserMode | null;
    selectedAlumnoIds: number[];
    currentAlumnoIndex: number;
    alumnoStates: Record<number, StoredAlumnoState>;
  };

  const getStorageKey = () => `dashboardState_${currentUser?.id ?? 'anon'}`;

  const loadPersistentState = (): StoredState | null => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) return null;
      return JSON.parse(raw) as StoredState;
    } catch {
      return null;
    }
  };

  const savePersistentState = (opts?: { currentAlumnoIndexOverride?: number; alumnoStatesOverride?: Map<number, { diaIndex: number; expandedEtapas: Set<number> }>; selectedAlumnoIdsOverride?: number[]; modeOverride?: UserMode | null; }) => {
    const alumnoStatesToUse = opts?.alumnoStatesOverride ?? alumnoStates;
    const currentAlumnoIndexToUse = opts?.currentAlumnoIndexOverride ?? currentAlumnoIndex;
    const selectedIdsToUse = opts?.selectedAlumnoIdsOverride ?? selectedAlumnoIds;
    const modeToUse = opts?.modeOverride ?? mode;

    const obj: StoredState = {
      mode: modeToUse,
      selectedAlumnoIds: selectedIdsToUse,
      currentAlumnoIndex: currentAlumnoIndexToUse,
      alumnoStates: Object.fromEntries(
        Array.from(alumnoStatesToUse.entries()).map(([alumnoId, st]) => [
          alumnoId,
          { diaIndex: st.diaIndex, expandedEtapas: Array.from(st.expandedEtapas) },
        ])
      ),
    };
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(obj));
    } catch {}
  };

  useEffect(() => {
    // Solo inicializar si no está inicializado o si hay reset en la URL
    const params = new URLSearchParams(location.search);
    const shouldReset = params.get('reset') === '1';
    
    // Solo reinicializar si:
    // 1. No está inicializado Y hay usuario
    // 2. Hay reset=1 en URL
    if (currentUser && (!initialized || shouldReset)) {
      initializeDashboard();
    }
  }, [currentUser?.id, location.search, initialized]);

  const initializeDashboard = async () => {
    setLoading(true);
    
    // Fetch ejercicios y etapas
    await Promise.all([fetchEjercicios(), fetchEtapas()]);
    // Revisar si hay reinicio forzado vía querystring (?reset=1)
    const params = new URLSearchParams(location.search);
    const shouldReset = params.get('reset') === '1';
    // Intentar restaurar estado previo guardado sólo si no se solicitó reset
    const saved = shouldReset ? null : loadPersistentState();

    if (shouldReset) {
      try { localStorage.removeItem(getStorageKey()); } catch {}
      // Limpiar estado local relevante
      setMode(null);
      setShowModeSelector(false);
      setShowAlumnoSelector(false);
      setAlumnos([]);
      setSelectedAlumnoIds([]);
      setPlanesActivos([]);
      setCurrentAlumnoIndex(0);
      setCurrentDiaIndex(0);
      setExpandedEtapas(new Set());
      setExpandedExercises(new Set());
      setAlumnoStates(new Map());
      setAlumnoSearch('');

      // Iniciar flujo fresco según roles
      if (isAlumno && !isEntrenador) {
        setMode('alumno');
        await loadAlumnoPlans([currentUser!.id]);
      } else if (isEntrenador && !isAlumno) {
        setMode('entrenador');
        await fetchAlumnos();
        setShowAlumnoSelector(true);
      } else if (isAlumno && isEntrenador) {
        setShowModeSelector(true);
      }
      setInitialized(true);
      setLoading(false);
      return;
    }

    if (saved) {
      // Reconstruir alumnoStates desde guardado PRIMERO
      if (saved.alumnoStates) {
        const map = new Map<number, { diaIndex: number; expandedEtapas: Set<number> }>();
        Object.entries(saved.alumnoStates).forEach(([k, v]) => {
          map.set(Number(k), { diaIndex: v.diaIndex, expandedEtapas: new Set(v.expandedEtapas) });
        });
        setAlumnoStates(map);
      }

      // Restaurar modo y selección si aplica
      if (saved.mode === 'alumno' && isAlumno) {
        setMode('alumno');
        setSelectedAlumnoIds([currentUser!.id]);
        await loadAlumnoPlans([currentUser!.id], saved.currentAlumnoIndex || 0);
      } else if (saved.mode === 'entrenador' && isEntrenador) {
        setMode('entrenador');
        // Si hay alumnos guardados, cargar sus planes
        if (saved.selectedAlumnoIds?.length) {
          setSelectedAlumnoIds(saved.selectedAlumnoIds);
          await loadAlumnoPlans(saved.selectedAlumnoIds, saved.currentAlumnoIndex || 0);
        } else {
          // Si no hay alumnos seleccionados previamente, cargar lista pero NO abrir el selector
          await fetchAlumnos();
          // Usuario debe pulsar "Cambiar alumnos" manualmente
        }
      }
    } else {
      if (isAlumno && !isEntrenador) {
        // Solo alumno: cargar su plan activo directamente
        setMode('alumno');
        await loadAlumnoPlans([currentUser!.id]);
      } else if (isEntrenador && !isAlumno) {
        // Solo entrenador: mostrar selector de alumnos SOLO en primer acceso
        setMode('entrenador');
        await fetchAlumnos();
        setShowAlumnoSelector(true);
      } else if (isAlumno && isEntrenador) {
        // Ambos roles: mostrar selector de modo
        setShowModeSelector(true);
      }
    }
    
    setInitialized(true);
    setLoading(false);
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

  const fetchAlumnos = async () => {
    try {
      const res = await api.get('/personas');
      const alumnosActivos = (res.data || []).filter((p: Persona & { esAlumno: boolean; alumnoActivo: boolean }) => 
        p.esAlumno && p.alumnoActivo
      );
      setAlumnos(alumnosActivos);
    } catch (err) {
      console.error('fetch alumnos', err);
    }
  };

  const openAlumnoSelector = async () => {
    if (alumnos.length === 0) {
      await fetchAlumnos();
    }
    setShowAlumnoSelector(true);
  };

  const handleModeSelect = async (selectedMode: UserMode) => {
    setMode(selectedMode);
    setShowModeSelector(false);
    
    if (selectedMode === 'alumno') {
      setSelectedAlumnoIds([currentUser!.id]);
      await loadAlumnoPlans([currentUser!.id]);
      savePersistentState({ modeOverride: 'alumno' });
    } else {
      await fetchAlumnos();
      setShowAlumnoSelector(true);
      // Guardar preferencia de modo aunque aún no haya selección
      savePersistentState({ modeOverride: 'entrenador', selectedAlumnoIdsOverride: [] });
    }
  };

  const handleAlumnosConfirm = async () => {
    if (selectedAlumnoIds.length === 0) return;
    setShowAlumnoSelector(false);
    await loadAlumnoPlans(selectedAlumnoIds);
    savePersistentState();
  };

  const loadAlumnoPlans = async (alumnoIds: number[], savedAlumnoIndex?: number) => {
    try {
      setLoading(true);
      const res = await api.get('/planes');
      const allPlanes: Plan[] = res.data || [];
      
      // Filtrar planes activos de los alumnos seleccionados
      const activePlans = allPlanes.filter(p => 
        p.activo && alumnoIds.includes(p.alumnoId)
      );

      // Cargar días y detalles para cada plan
      for (const plan of activePlans) {
        const diasRes = await api.get(`/plan-dias?planId=${plan.id}`);
        plan.dias = diasRes.data || [];
        
        // Cargar detalles de cada día
        if (plan.dias) {
          for (const dia of plan.dias) {
            const detallesRes = await api.get(`/plan-detalles?planDiaId=${dia.id}`);
            dia.detalles = detallesRes.data || [];
            
            // Cargar historial vigente para cada detalle
            if (dia.detalles) {
              for (const detalle of dia.detalles) {
                try {
                  await getActualHistorial(detalle.id);
                } catch (err) {
                  console.error(`No se pudo cargar historial para detalle ${detalle.id}`, err);
                }
              }
            }
          }
        }
      }

      setPlanesActivos(activePlans);
      
      // Restaurar índice de alumno si se proporciona
      const indexToRestore = savedAlumnoIndex !== undefined 
        ? Math.min(Math.max(savedAlumnoIndex, 0), Math.max(activePlans.length - 1, 0))
        : 0;
      
      setCurrentAlumnoIndex(indexToRestore);
      
      // Restaurar estado del alumno (día y etapas expandidas)
      if (activePlans.length > 0) {
        const alumnoId = activePlans[indexToRestore]?.alumnoId;
        if (alumnoId) {
          const savedState = alumnoStates.get(alumnoId);
          if (savedState) {
            setCurrentDiaIndex(savedState.diaIndex);
            setExpandedEtapas(new Set(savedState.expandedEtapas));
          } else {
            setCurrentDiaIndex(0);
            setExpandedEtapas(new Set());
          }
        }
      }
    } catch (err) {
      console.error('load planes', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlumnoSelection = (alumnoId: number) => {
    setSelectedAlumnoIds(prev => 
      prev.includes(alumnoId) 
        ? prev.filter(id => id !== alumnoId)
        : [...prev, alumnoId]
    );
  };

  // Guardar estado del alumno actual antes de cambiar
  const saveCurrentAlumnoState = () => {
    if (planesActivos.length === 0) return;
    const alumnoId = planesActivos[currentAlumnoIndex]?.alumnoId;
    if (!alumnoId) return;
    
    const newMap = new Map(alumnoStates);
    newMap.set(alumnoId, {
      diaIndex: currentDiaIndex,
      expandedEtapas: new Set(expandedEtapas),
    });
    setAlumnoStates(newMap);
  };

  // Restaurar estado del alumno cuando cambia
  const restoreAlumnoState = (newIndex: number) => {
    const alumnoId = planesActivos[newIndex]?.alumnoId;
    if (!alumnoId) return;
    
    const savedState = alumnoStates.get(alumnoId);
    if (savedState) {
      setCurrentDiaIndex(savedState.diaIndex);
      setExpandedEtapas(new Set(savedState.expandedEtapas));
    } else {
      // Si no hay estado guardado, resetear a valores por defecto
      setCurrentDiaIndex(0);
      setExpandedEtapas(new Set());
    }
  };

  const handlePrevAlumno = () => {
    saveCurrentAlumnoState();
    const newIndex = Math.max(0, currentAlumnoIndex - 1);
    setCurrentAlumnoIndex(newIndex);
    restoreAlumnoState(newIndex);
    savePersistentState({ currentAlumnoIndexOverride: newIndex });
  };

  const handleNextAlumno = () => {
    saveCurrentAlumnoState();
    const newIndex = Math.min(planesActivos.length - 1, currentAlumnoIndex + 1);
    setCurrentAlumnoIndex(newIndex);
    restoreAlumnoState(newIndex);
    savePersistentState({ currentAlumnoIndexOverride: newIndex });
  };

  const handlePrevDia = () => {
    setCurrentDiaIndex(prev => {
      const newDia = Math.max(0, prev - 1);
      const alumnoId = planesActivos[currentAlumnoIndex]?.alumnoId;
      if (alumnoId) {
        const map = new Map(alumnoStates);
        const prevState = map.get(alumnoId) ?? { diaIndex: 0, expandedEtapas: new Set<number>() };
        map.set(alumnoId, { diaIndex: newDia, expandedEtapas: new Set(prevState.expandedEtapas) });
        setAlumnoStates(map);
        savePersistentState({ alumnoStatesOverride: map });
      }
      return newDia;
    });
  };

  const handleNextDia = () => {
    const currentPlan = planesActivos[currentAlumnoIndex];
    if (currentPlan?.dias) {
      setCurrentDiaIndex(prev => {
        const newDia = Math.min(currentPlan.dias!.length - 1, prev + 1);
        const alumnoId = planesActivos[currentAlumnoIndex]?.alumnoId;
        if (alumnoId) {
          const map = new Map(alumnoStates);
          const prevState = map.get(alumnoId) ?? { diaIndex: 0, expandedEtapas: new Set<number>() };
          map.set(alumnoId, { diaIndex: newDia, expandedEtapas: new Set(prevState.expandedEtapas) });
          setAlumnoStates(map);
          savePersistentState({ alumnoStatesOverride: map });
        }
        return newDia;
      });
    }
  };

  // Toggle etapas expandidas/colapsadas
  const toggleEtapa = (etapaId: number) => {
    setExpandedEtapas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(etapaId)) {
        newSet.delete(etapaId);
      } else {
        newSet.add(etapaId);
      }
      const alumnoId = planesActivos[currentAlumnoIndex]?.alumnoId;
      if (alumnoId) {
        const map = new Map(alumnoStates);
        const prevState = map.get(alumnoId) ?? { diaIndex: currentDiaIndex, expandedEtapas: new Set<number>() };
        map.set(alumnoId, { diaIndex: prevState.diaIndex, expandedEtapas: new Set(newSet) });
        setAlumnoStates(map);
        savePersistentState({ alumnoStatesOverride: map });
      }
      return newSet;
    });
  };

  // Toggle ejercicios expandidos (descripción completa)
  const toggleExercise = (detalleId: number, ejercicioId?: number) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      const opening = !newSet.has(detalleId);
      if (newSet.has(detalleId)) {
        newSet.delete(detalleId);
      } else {
        newSet.add(detalleId);
      }
      // if opening, fetch latest historial for this detalle and alternativos for this ejercicio
      if (opening) {
        getActualHistorial(detalleId);
        if (ejercicioId && !ejercicioAlternativos.has(ejercicioId)) {
          fetchAlternativosForEjercicio(ejercicioId);
        }
      }
      return newSet;
    });
  };

  // Funciones para manejar modal de ejercicio alternativo
  const fetchAlternativosForEjercicio = async (ejercicioId: number) => {
    try {
      const res = await api.get(`/ejercicio-alternativos/${ejercicioId}`);
      setEjercicioAlternativos(prev => {
        const newMap = new Map(prev);
        newMap.set(ejercicioId, res.data || []);
        return newMap;
      });
    } catch (err) {
      console.error('Error al cargar alternativos', err);
    }
  };

  const openAlternativoModal = (ejercicio: Ejercicio) => {
    setSelectedAlternativo(ejercicio);
    setAlternativoModalOpen(true);
  };

  const closeAlternativoModal = () => {
    setAlternativoModalOpen(false);
    setSelectedAlternativo(null);
  };

  // Formatear tiempo: segundos con " o minutos'segundos" si >= 60
  const formatTiempo = (segundos: number): string => {
    if (segundos < 60) {
      return `${segundos}"`;
    }
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return segs > 0 ? `${minutos}'${segs}"` : `${minutos}'`;
  };

  // Siempre que cambia el alumno actual o se cargan planes, restaurar su estado guardado
  useEffect(() => {
    if (planesActivos.length > 0) {
      restoreAlumnoState(currentAlumnoIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAlumnoIndex, planesActivos.length]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    const minSwipeDistance = 50;

    // Solo navegación horizontal (alumnos)
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        handlePrevAlumno();
      } else {
        handleNextAlumno();
      }
    }
  };

  const currentPlan = planesActivos[currentAlumnoIndex];
  const currentDia = currentPlan?.dias?.[currentDiaIndex];
  const detalles = currentDia?.detalles || [];

  // Group detalles by etapa
  const detallesPorEtapa: { [key: string]: PlanDetalle[] } = {};
  const sinEtapa: PlanDetalle[] = [];

  detalles.forEach(det => {
    if (det.etapaId) {
      const etapaKey = `etapa_${det.etapaId}`;
      if (!detallesPorEtapa[etapaKey]) {
        detallesPorEtapa[etapaKey] = [];
      }
      detallesPorEtapa[etapaKey].push(det);
    } else {
      sinEtapa.push(det);
    }
  });

  // Sort detalles within each group by orden
  Object.keys(detallesPorEtapa).forEach(key => {
    detallesPorEtapa[key].sort((a, b) => a.orden - b.orden);
  });
  sinEtapa.sort((a, b) => a.orden - b.orden);

  // Get etapas sorted by orden
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#f5f5f5',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y pan-x'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mode Selector Dialog */}
      <Dialog open={showModeSelector} maxWidth="xs" fullWidth>
        <DialogTitle>Seleccionar Modo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Tenés permisos de alumno y entrenador. ¿Cómo querés ingresar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleModeSelect('alumno')} variant="contained">
            Como Alumno
          </Button>
          <Button onClick={() => handleModeSelect('entrenador')} variant="outlined">
            Como Entrenador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alumno Selector Dialog */}
      <Dialog open={showAlumnoSelector} onClose={() => { setShowAlumnoSelector(false); savePersistentState(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar Alumnos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Seleccioná los alumnos cuyos planes querés visualizar:
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Buscar alumno (nombre o DNI)"
            value={alumnoSearch}
            onChange={(e) => setAlumnoSearch(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Box sx={{ mt: 2, maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
            <Stack spacing={1}>
              {alumnos
                .filter(a => {
                  const q = alumnoSearch.trim().toLowerCase();
                  if (!q) return true;
                  return a.nombre.toLowerCase().includes(q) || (a.dni || '').toLowerCase().includes(q);
                })
                .map(alumno => (
                  <FormControlLabel
                    key={alumno.id}
                    control={
                      <Checkbox
                        checked={selectedAlumnoIds.includes(alumno.id)}
                        onChange={() => toggleAlumnoSelection(alumno.id)}
                      />
                    }
                    label={`${alumno.nombre} (DNI: ${alumno.dni})`}
                  />
                ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowAlumnoSelector(false); savePersistentState(); }}>
            Cancelar
          </Button>
          <Button onClick={handleAlumnosConfirm} variant="contained" disabled={selectedAlumnoIds.length === 0}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit PlanDetalle Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Detalle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Series" type="number" value={editSeries} onChange={(e) => setEditSeries(e.target.value === '' ? '' : Number(e.target.value))} fullWidth />
            <TextField label="Repeticiones" type="number" value={editReps} onChange={(e) => setEditReps(e.target.value === '' ? '' : Number(e.target.value))} fullWidth />
            <TextField label="Tiempo (seg)" type="number" value={editTiempo} onChange={(e) => setEditTiempo(e.target.value === '' ? '' : Number(e.target.value))} fullWidth />
            <TextField label="Carga (kg)" type="number" value={editCarga} onChange={(e) => setEditCarga(e.target.value === '' ? '' : Number(e.target.value))} fullWidth />
            <TextField label="Fecha desde" type="date" value={editFechaDesde} onChange={(e) => setEditFechaDesde(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={saveEditDetalle} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      {planesActivos.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No hay planes activos para mostrar
          </Typography>
          {mode === 'entrenador' && (
            <Button variant="contained" onClick={openAlumnoSelector}>
              Seleccionar Alumnos
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Header */}
          <Paper sx={{ p: 2, borderRadius: 0 }} elevation={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                {/* Botones de navegación de alumnos */}
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <IconButton 
                    onClick={handlePrevAlumno} 
                    disabled={currentAlumnoIndex === 0}
                    size="small"
                    color="primary"
                    sx={{ padding: '2px' }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={handleNextAlumno} 
                    disabled={currentAlumnoIndex === planesActivos.length - 1}
                    size="small"
                    color="primary"
                    sx={{ padding: '2px' }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h5" fontWeight="bold">
                      {currentPlan?.alumno.nombre}
                    </Typography>
                    {mode === 'entrenador' && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={openAlumnoSelector}
                        sx={{ textTransform: 'none' }}
                      >
                        Cambiar alumnos
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Entrenador: {currentPlan?.entrenador.nombre}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {/* Botones de navegación de días */}
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <IconButton 
                    onClick={handlePrevDia} 
                    disabled={currentDiaIndex === 0}
                    size="small"
                    color="secondary"
                    sx={{ padding: '2px' }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={handleNextDia} 
                    disabled={!currentPlan?.dias || currentDiaIndex === currentPlan.dias.length - 1}
                    size="small"
                    color="secondary"
                    sx={{ padding: '2px' }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box textAlign="right">
                  <Chip 
                    label={`Día ${currentDia?.nroDia || 0}`} 
                    color="primary" 
                    sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                  />
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {currentDia?.descripcion}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Exercise Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {detalles.length === 0 ? (
              <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                No hay ejercicios para este día
              </Typography>
            ) : (
              <Stack spacing={3}>
                {/* Render etapas in order */}
                {etapasOrdenadas.map(etapa => {
                  const etapaDetalles = detallesPorEtapa[`etapa_${etapa.id}`];
                  if (!etapaDetalles || etapaDetalles.length === 0) return null;
                  
                  const isExpanded = expandedEtapas.has(etapa.id);

                  return (
                    <Box key={etapa.id}>
                      <Box
                        onClick={() => toggleEtapa(etapa.id)}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          mb: 2,
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          color="primary"
                          sx={{ flex: 1 }}
                        >
                          {etapa.descripcion}
                        </Typography>
                        {isExpanded ? <ExpandLessIcon color="primary" /> : <ExpandMoreIcon color="primary" />}
                      </Box>
                      
                      {isExpanded && (
                        <Stack spacing={2}>
                          {etapaDetalles.map(detalle => {
                            const ejercicio = ejercicios.find(e => e.id === detalle.ejercicioId);
                            const isExerciseExpanded = expandedExercises.has(detalle.id);
                            
                            return (
                              <Card 
                                key={detalle.id} 
                                elevation={2}
                                onClick={() => toggleExercise(detalle.id, detalle.ejercicioId)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <CardContent sx={{ pb: isMobile && !isExerciseExpanded ? 2 : undefined }}>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: isMobile && !isExerciseExpanded ? 0 : 1 }}>
                                    <Typography variant="h6" fontWeight="bold" component="span">
                                      {ejercicio?.codEjercicio || `Ejercicio ${detalle.ejercicioId}`}
                                    </Typography>
                                    {(() => {
                                      const hv = latestHistorial[detalle.id];
                                      const series = hv?.series ?? detalle.series;
                                      const repeticiones = hv?.repeticiones ?? detalle.repeticiones;
                                      const tiempoEnSeg = hv?.tiempoEnSeg ?? detalle.tiempoEnSeg;
                                      const carga = hv?.carga ?? detalle.carga;
                                      return (
                                        <>
                                          {series > 0 && (
                                            <Chip label={`${series} S`} size="small" color="secondary" />
                                          )}
                                          {repeticiones > 0 && (
                                            <Chip 
                                              label={`${repeticiones} R`} 
                                              size="small" 
                                              sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 500 }}
                                            />
                                          )}
                                          {tiempoEnSeg > 0 && (
                                            <Chip 
                                              label={formatTiempo(tiempoEnSeg)} 
                                              size="small" 
                                              sx={{ 
                                                bgcolor: tiempoEnSeg < 60 ? '#87CEEB' : '#1976d2',
                                                color: tiempoEnSeg < 60 ? '#0d47a1' : '#fff',
                                                fontWeight: 500
                                              }}
                                            />
                                          )}
                                          {carga > 0 && (
                                            <Chip label={`${carga} kg`} size="small" color="error" />
                                          )}
                                        </>
                                      );
                                    })()}
                                  </Box>
                                  
                                  {/* En móvil: mostrar descripción y botón solo si está expandido */}
                                  {/* En PC: mostrar siempre */}
                                  {(isMobile ? isExerciseExpanded : true) && (
                                    <>
                                      <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                      >
                                        {ejercicio?.descripcion}
                                      </Typography>
                                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button size="small" variant="outlined" onClick={(ev) => { ev.stopPropagation(); openEditDetalle(detalle); }}>Editar valores</Button>
                                      </Box>
                                    </>
                                  )}
                                  {isExerciseExpanded && ejercicio && (ejercicioAlternativos.get(ejercicio.id)?.length ?? 0) > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                        Ejercicios alternativos:
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {ejercicioAlternativos.get(ejercicio.id)?.map((alt) => (
                                          <Chip
                                            key={alt.id}
                                            label={alt.alternativo.codEjercicio}
                                            size="small"
                                            onClick={(ev) => {
                                              ev.stopPropagation();
                                              openAlternativoModal(alt.alternativo);
                                            }}
                                            sx={{ cursor: 'pointer' }}
                                            color="info"
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                  {isExerciseExpanded && ejercicio && (ejercicio.imagenes || ejercicio.links) && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                                      {ejercicio.imagenes && ejercicio.imagenes.trim() && (
                                        <Box sx={{ mb: 2 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            Imágenes:
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {ejercicio.imagenes.split(',').filter(u => u.trim()).map((url, idx) => (
                                              <Box key={idx} sx={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                                <img 
                                                  src={url.trim()} 
                                                  alt={`${ejercicio.codEjercicio} ${idx + 1}`}
                                                  style={{ width: '150px', height: '150px', objectFit: 'cover', display: 'block' }}
                                                  onError={(e) => { 
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    console.error('Error loading image:', url.trim());
                                                  }}
                                                />
                                              </Box>
                                            ))}
                                          </Box>
                                        </Box>
                                        
                                      )}
                                      {ejercicio.links && ejercicio.links.trim() && (
                                        <Box>
                                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                            Videos/Links:
                                          </Typography>
                                          <Stack spacing={0.5}>
                                            {ejercicio.links.split(',').map((url, idx) => (
                                              <Box key={idx}>
                                                <a 
                                                  href={url.trim()} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  style={{ fontSize: '0.875rem', color: '#1976d2', textDecoration: 'none' }}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  {url.trim().length > 50 ? url.trim().substring(0, 50) + '...' : url.trim()}
                                                </a>
                                              </Box>
                                            ))}
                                          </Stack>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                  );
                })}

                {/* Render sin etapa */}
                {sinEtapa.length > 0 && (
                  <Box>
                    <Box
                      onClick={() => toggleEtapa(0)} // Use 0 for "sin etapa"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        mb: 2,
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        fontWeight="bold" 
                        color="text.secondary"
                        sx={{ flex: 1 }}
                      >
                        Otros Ejercicios
                      </Typography>
                      {expandedEtapas.has(0) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    
                    {expandedEtapas.has(0) && (
                      <Stack spacing={2}>
                        {sinEtapa.map(detalle => {
                          const ejercicio = ejercicios.find(e => e.id === detalle.ejercicioId);
                          const isExerciseExpanded = expandedExercises.has(detalle.id);
                          
                          return (
                            <Card 
                              key={detalle.id} 
                              elevation={2}
                              onClick={() => toggleExercise(detalle.id, detalle.ejercicioId)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <CardContent sx={{ pb: isMobile && !isExerciseExpanded ? 2 : undefined }}>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: isMobile && !isExerciseExpanded ? 0 : 1 }}>
                                  <Typography variant="h6" fontWeight="bold" component="span">
                                    {ejercicio?.codEjercicio || `Ejercicio ${detalle.ejercicioId}`}
                                  </Typography>
                                  {(() => {
                                    const hv = latestHistorial[detalle.id];
                                    const series = hv?.series ?? detalle.series;
                                    const repeticiones = hv?.repeticiones ?? detalle.repeticiones;
                                    const tiempoEnSeg = hv?.tiempoEnSeg ?? detalle.tiempoEnSeg;
                                    const carga = hv?.carga ?? detalle.carga;
                                    return (
                                      <>
                                        {series > 0 && (
                                          <Chip label={`${series} S`} size="small" color="secondary" />
                                        )}
                                        {repeticiones > 0 && (
                                          <Chip 
                                            label={`${repeticiones} R`} 
                                            size="small" 
                                            sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 500 }}
                                          />
                                        )}
                                        {tiempoEnSeg > 0 && (
                                          <Chip 
                                            label={formatTiempo(tiempoEnSeg)} 
                                            size="small" 
                                            sx={{ 
                                              bgcolor: tiempoEnSeg < 60 ? '#87CEEB' : '#1976d2',
                                              color: tiempoEnSeg < 60 ? '#0d47a1' : '#fff',
                                              fontWeight: 500
                                            }}
                                          />
                                        )}
                                        {carga > 0 && (
                                          <Chip label={`${carga} kg`} size="small" color="error" />
                                        )}
                                      </>
                                    );
                                  })()}
                                </Box>
                                
                                {/* En móvil: mostrar descripción solo si está expandido */}
                                {/* En PC: mostrar siempre */}
                                {(isMobile ? isExerciseExpanded : true) && (
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                  >
                                    {ejercicio?.descripcion}
                                  </Typography>
                                )}
                                {isExerciseExpanded && ejercicio && (ejercicio.imagenes || ejercicio.links) && (
                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                                    {ejercicio.imagenes && ejercicio.imagenes.trim() && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                          Imágenes:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          {ejercicio.imagenes.split(',').filter(u => u.trim()).map((url, idx) => (
                                            <Box key={idx} sx={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                              <img 
                                                src={url.trim()} 
                                                alt={`${ejercicio.codEjercicio} ${idx + 1}`}
                                                style={{ width: '150px', height: '150px', objectFit: 'cover', display: 'block' }}
                                                onError={(e) => { 
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  console.error('Error loading image:', url.trim());
                                                }}
                                              />
                                            </Box>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                      {/* Show effective date from historial if available for this detalle */}
                                      {latestHistorial[detalle.id] && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" color="text.secondary">Valores vigentes desde: {new Date(latestHistorial[detalle.id].fechaDesde).toLocaleDateString()}</Typography>
                                        </Box>
                                      )}
                                    {ejercicio.links && ejercicio.links.trim() && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                          Videos/Links:
                                        </Typography>
                                        <Stack spacing={0.5}>
                                          {ejercicio.links.split(',').map((url, idx) => (
                                            <Box key={idx}>
                                              <a 
                                                href={url.trim()} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.875rem', color: '#1976d2', textDecoration: 'none' }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {url.trim().length > 50 ? url.trim().substring(0, 50) + '...' : url.trim()}
                                              </a>
                                            </Box>
                                          ))}
                                        </Stack>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        </>
      )}

      {/* Modal de ejercicio alternativo */}
      <Dialog open={alternativoModalOpen} onClose={closeAlternativoModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ejercicio Alternativo - {selectedAlternativo?.codEjercicio}
        </DialogTitle>
        <DialogContent>
          {selectedAlternativo && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Descripción:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedAlternativo.descripcion}
              </Typography>

              {selectedAlternativo.imagenes && selectedAlternativo.imagenes.trim() && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Imágenes:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedAlternativo.imagenes.split(',').filter(u => u.trim()).map((url, idx) => (
                      <Box key={idx} sx={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                        <img 
                          src={url.trim()} 
                          alt={`${selectedAlternativo.codEjercicio} ${idx + 1}`}
                          style={{ width: '150px', height: '150px', objectFit: 'cover', display: 'block' }}
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {selectedAlternativo.links && selectedAlternativo.links.trim() && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Videos/Links:</strong>
                  </Typography>
                  <Stack spacing={0.5}>
                    {selectedAlternativo.links.split(',').map((url, idx) => (
                      <Box key={idx}>
                        <a 
                          href={url.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.875rem', color: '#1976d2', textDecoration: 'none' }}
                        >
                          {url.trim().length > 50 ? url.trim().substring(0, 50) + '...' : url.trim()}
                        </a>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAlternativoModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
