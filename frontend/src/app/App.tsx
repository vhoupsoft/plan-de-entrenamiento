import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Ejercicios from "../pages/Ejercicios";
import Personas from "../pages/Personas";
import Etapas from "../pages/Etapas";
import Planes from "../pages/Planes";
import Roles from "../pages/Roles";
import Administracion from "../pages/Administracion";
import { Box, Button, Typography, Menu, MenuItem, IconButton } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AuthProvider, useAuth } from "../context/AuthContext";

// Dashboard removed to avoid duplicate navigation (use header menu instead)

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const nombre = user?.nombre || user?.usuario || '';

  // menu for quick navigation when clicking the app title
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const handleTitleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const go = (path: string) => {
    handleMenuClose();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
      <Box>
        <Box display="flex" alignItems="center">
          <Typography
            variant="h6"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', userSelect: 'none', mr: 0.5 }}
            aria-label="Ir al panel principal"
          >
            Plan de Entrenamiento
          </Typography>
          <IconButton
            size="small"
            onClick={handleTitleClick}
            aria-controls={menuOpen ? 'app-nav-menu' : undefined}
            aria-haspopup="true"
            aria-label="Abrir menú de navegación"
          >
            <ExpandMoreIcon />
          </IconButton>

          <Menu
            id="app-nav-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem onClick={() => go('/?reset=1')}>Panel Principal</MenuItem>
            <MenuItem onClick={() => go('/ejercicios')}>Ejercicios</MenuItem>
            <MenuItem onClick={() => go('/etapas')}>Etapas</MenuItem>
            <MenuItem onClick={() => go('/personas')}>Personas</MenuItem>
            <MenuItem onClick={() => go('/planes')}>Planes</MenuItem>
            {user?.roles?.includes('Admin') && <MenuItem onClick={() => go('/administracion')}>Administración</MenuItem>}
          </Menu>
        </Box>
      </Box>
      <Box display="flex" alignItems="center" gap={2}>
        {nombre && <Typography variant="body2">{nombre}</Typography>}
        <Button size="small" onClick={handleLogout}>Cerrar sesión</Button>
      </Box>
    </Box>
  );
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Box>
      <Header />
      {children}
    </Box>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ejercicios"
          element={
            <ProtectedRoute>
              <Ejercicios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas"
          element={
            <ProtectedRoute>
              <Personas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etapas"
          element={
            <ProtectedRoute>
              <Etapas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planes"
          element={
            <ProtectedRoute>
              <Planes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administracion"
          element={
            <ProtectedRoute>
              <Administracion />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
