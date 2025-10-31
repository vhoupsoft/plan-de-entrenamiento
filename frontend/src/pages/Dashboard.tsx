import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../context/AuthContext';
import api from '../api';

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

type UserMode = 'alumno' | 'entrenador';

export default function Dashboard() {
  const { user: currentUser } = useAuth();
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
  const [expandedEtapas, setExpandedEtapas] = useState<Set<number>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  
  // Estado por alumno: guarda diaIndex y etapas expandidas para cada alumno
  const [alumnoStates, setAlumnoStates] = useState<Map<number, { diaIndex: number, expandedEtapas: Set<number> }>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const isAlumno = currentUser?.esAlumno || false;
  const isEntrenador = currentUser?.esEntrenador || currentUser?.roles?.includes('Entrenador') || false;

  useEffect(() => {
    initializeDashboard();
  }, [currentUser]);

  const initializeDashboard = async () => {
    setLoading(true);
    
    // Fetch ejercicios y etapas
    await Promise.all([fetchEjercicios(), fetchEtapas()]);

    if (isAlumno && !isEntrenador) {
      // Solo alumno: cargar su plan activo directamente
      setMode('alumno');
      await loadAlumnoPlans([currentUser!.id]);
    } else if (isEntrenador && !isAlumno) {
      // Solo entrenador: mostrar selector de alumnos
      setMode('entrenador');
      await fetchAlumnos();
      setShowAlumnoSelector(true);
    } else if (isAlumno && isEntrenador) {
      // Ambos roles: mostrar selector de modo
      setShowModeSelector(true);
    }
    
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

  const handleModeSelect = async (selectedMode: UserMode) => {
    setMode(selectedMode);
    setShowModeSelector(false);
    
    if (selectedMode === 'alumno') {
      await loadAlumnoPlans([currentUser!.id]);
    } else {
      await fetchAlumnos();
      setShowAlumnoSelector(true);
    }
  };

  const handleAlumnosConfirm = async () => {
    if (selectedAlumnoIds.length === 0) return;
    setShowAlumnoSelector(false);
    await loadAlumnoPlans(selectedAlumnoIds);
  };

  const loadAlumnoPlans = async (alumnoIds: number[]) => {
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
          }
        }
      }

      setPlanesActivos(activePlans);
      setCurrentAlumnoIndex(0);
      setCurrentDiaIndex(0);
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
  };

  const handleNextAlumno = () => {
    saveCurrentAlumnoState();
    const newIndex = Math.min(planesActivos.length - 1, currentAlumnoIndex + 1);
    setCurrentAlumnoIndex(newIndex);
    restoreAlumnoState(newIndex);
  };

  const handlePrevDia = () => {
    setCurrentDiaIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextDia = () => {
    const currentPlan = planesActivos[currentAlumnoIndex];
    if (currentPlan?.dias) {
      setCurrentDiaIndex(prev => Math.min(currentPlan.dias!.length - 1, prev + 1));
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
      return newSet;
    });
  };

  // Toggle ejercicios expandidos (descripción completa)
  const toggleExercise = (detalleId: number) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(detalleId)) {
        newSet.delete(detalleId);
      } else {
        newSet.add(detalleId);
      }
      return newSet;
    });
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
      <Dialog open={showAlumnoSelector} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar Alumnos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Seleccioná los alumnos cuyos planes querés visualizar:
          </Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {alumnos.map(alumno => (
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAlumnosConfirm} variant="contained" disabled={selectedAlumnoIds.length === 0}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      {planesActivos.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="h6" color="text.secondary">
            No hay planes activos para mostrar
          </Typography>
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
                  <Typography variant="h5" fontWeight="bold">
                    {currentPlan?.alumno.nombre}
                  </Typography>
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
                                onClick={() => toggleExercise(detalle.id)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
                                    <Typography variant="h6" fontWeight="bold" component="span">
                                      {ejercicio?.codEjercicio || `Ejercicio ${detalle.ejercicioId}`}
                                    </Typography>
                                    {detalle.series > 0 && (
                                      <Chip label={`${detalle.series} S`} size="small" color="secondary" />
                                    )}
                                    {detalle.repeticiones > 0 && (
                                      <Chip 
                                        label={`${detalle.repeticiones} R`} 
                                        size="small" 
                                        sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 500 }}
                                      />
                                    )}
                                    {detalle.tiempoEnSeg > 0 && (
                                      <Chip 
                                        label={formatTiempo(detalle.tiempoEnSeg)} 
                                        size="small" 
                                        sx={{ 
                                          bgcolor: detalle.tiempoEnSeg < 60 ? '#87CEEB' : '#1976d2',
                                          color: detalle.tiempoEnSeg < 60 ? '#0d47a1' : '#fff',
                                          fontWeight: 500
                                        }}
                                      />
                                    )}
                                    {detalle.carga > 0 && (
                                      <Chip label={`${detalle.carga} kg`} size="small" color="error" />
                                    )}
                                  </Box>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{
                                      ...(!isExerciseExpanded && {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      })
                                    }}
                                  >
                                    {ejercicio?.descripcion}
                                  </Typography>
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
                              onClick={() => toggleExercise(detalle.id)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
                                  <Typography variant="h6" fontWeight="bold" component="span">
                                    {ejercicio?.codEjercicio || `Ejercicio ${detalle.ejercicioId}`}
                                  </Typography>
                                  {detalle.series > 0 && (
                                    <Chip label={`${detalle.series} S`} size="small" color="secondary" />
                                  )}
                                  {detalle.repeticiones > 0 && (
                                    <Chip 
                                      label={`${detalle.repeticiones} R`} 
                                      size="small" 
                                      sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 500 }}
                                    />
                                  )}
                                  {detalle.tiempoEnSeg > 0 && (
                                    <Chip 
                                      label={formatTiempo(detalle.tiempoEnSeg)} 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: detalle.tiempoEnSeg < 60 ? '#87CEEB' : '#1976d2',
                                        color: detalle.tiempoEnSeg < 60 ? '#0d47a1' : '#fff',
                                        fontWeight: 500
                                      }}
                                    />
                                  )}
                                  {detalle.carga > 0 && (
                                    <Chip label={`${detalle.carga} kg`} size="small" color="error" />
                                  )}
                                </Box>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    ...(!isExerciseExpanded && {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    })
                                  }}
                                >
                                  {ejercicio?.descripcion}
                                </Typography>
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
    </Box>
  );
}
