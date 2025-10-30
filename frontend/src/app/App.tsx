import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "../pages/Login";
import Ejercicios from "../pages/Ejercicios";
import { Box, Button, Typography } from "@mui/material";
import { AuthProvider, useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Panel Principal</h1>
      <p>Bienvenido. Aquí irá la navegación y el contenido principal.</p>
      <nav style={{ marginTop: 16 }}>
        <Link to="/ejercicios" style={{ marginRight: 12 }}>
          Ejercicios
        </Link>
      </nav>
    </div>
  );
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const nombre = user?.nombre || user?.usuario || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
      <Typography variant="h6">Plan de Entrenamiento</Typography>
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
      </Routes>
    </AuthProvider>
  );
}
