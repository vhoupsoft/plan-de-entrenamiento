import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Panel Principal</h1>
      <p>Bienvenido. Aquí irá la navegación y el contenido principal.</p>
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
    </Routes>
  );
}
