import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "../pages/Login";
import Ejercicios from "../pages/Ejercicios";

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
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
  );
}
