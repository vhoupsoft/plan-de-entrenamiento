import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from '../api';
import { TextField, Button, Container, Box, Typography, Alert } from "@mui/material";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { usuario, clave });
    const { token, user } = res.data;
      localStorage.setItem("token", token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // also set the api helper instance header so subsequent calls use the token
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al iniciar sesión");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Iniciar sesión
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
          <TextField 
            fullWidth 
            label="Usuario" 
            value={usuario} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsuario(e.target.value)} 
            margin="normal" 
          />
          <TextField 
            fullWidth 
            label="Clave" 
            type="password" 
            value={clave} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClave(e.target.value)} 
            margin="normal" 
          />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
            Entrar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
