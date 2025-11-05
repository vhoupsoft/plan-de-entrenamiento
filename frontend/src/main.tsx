import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./app/App";
import "./styles.css";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Si hay un token de una sesión previa, configurar el header de Authorization
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Register service worker for PWA
serviceWorkerRegistration.register();
