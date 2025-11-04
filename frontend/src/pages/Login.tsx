import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Container, Box, Typography, Alert, IconButton } from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { usuario, clave });
    const { token, user } = res.data;
      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      }
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
            type={showPassword ? 'text' : 'password'}
            value={clave} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClave(e.target.value)} 
            margin="normal"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label="mostrar/ocultar contraseña"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
            Entrar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
