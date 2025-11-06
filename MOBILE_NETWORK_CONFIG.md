# Configuración de Red para Acceso Móvil

## Problema: La app no funciona desde datos móviles

Si la aplicación funciona en WiFi pero no en datos móviles (red celular), hay dos causas posibles:

1. **Problema de firewall/NAT de la red celular** (más común)
2. **Configuración incorrecta del proxy de Vite**

## ⚡ SOLUCIÓN RÁPIDA (Si ya tenés forwarding del 5173)

**NO necesitás configurar nada**. El proxy de Vite ya maneja todo.

Solo asegurate que:
1. ✅ Forwarding del puerto **5173** configurado
2. ✅ Backend corriendo en el mismo servidor
3. ✅ Archivo `.env` **vacío o comentado** (usa proxy por defecto)

Si seguís con problemas, puede ser:
- El firewall de la red de Claro bloqueando el puerto
- Problemas de DNS
- IP pública dinámica que cambió

**Prueba esto:**
```bash
# Desde tu móvil con datos, abrí Chrome y probá:
http://TU_IP_PUBLICA:5173
```

Si no carga, el problema es de red/firewall, no de código.

---

## 🔧 Solución Avanzada: VITE_API_URL (Solo si backend está en otro servidor)

### Paso 1: Obtener tu IP pública o configurar dominio

#### Opción A: IP Pública (Más rápido, menos seguro)
1. Obtén tu IP pública: https://www.cual-es-mi-ip.net/
2. Configura port forwarding en tu router:
   - Puerto externo: 3000
   - Puerto interno: 3000
   - IP interna: La IP de tu PC en la LAN (ej: 192.168.1.100)

#### Opción B: Dominio con DDNS (Recomendado)
1. Usa un servicio como No-IP o DuckDNS
2. Crea un dominio gratuito (ej: `miapp.ddns.net`)
3. Configura port forwarding igual que en Opción A
4. Instala el cliente DDNS para actualizar la IP automáticamente

#### Opción C: Deploy en la nube (Más profesional)
- Heroku, Railway, Render.com, DigitalOcean, etc.
- El backend tendrá una URL fija tipo `https://miapp.onrender.com`

### Paso 2: Configurar el archivo .env

Editá `frontend/.env`:

```bash
# Para desarrollo local desde tu PC
VITE_API_URL=http://localhost:3000

# Para acceso desde cualquier lugar (WiFi externa o datos móviles)
# Opción con IP pública (cambiar por tu IP real):
VITE_API_URL=http://TU_IP_PUBLICA:3000

# Opción con dominio DDNS:
VITE_API_URL=http://miapp.ddns.net:3000

# Opción con servidor en la nube (con HTTPS):
VITE_API_URL=https://miapp.onrender.com
```

### Paso 3: Reiniciar el servidor de desarrollo

```bash
cd frontend
npm run dev
```

⚠️ **IMPORTANTE**: Cada vez que cambies `.env`, tenés que reiniciar Vite.

## Configuración del Backend

El backend también necesita aceptar conexiones externas:

### 1. Editar `backend/src/server.ts`

Asegurate que el servidor escuche en todas las interfaces:

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {  // '0.0.0.0' es la clave
  console.log(`Backend corriendo en puerto ${PORT}`);
});
```

### 2. Configurar CORS correctamente

En `backend/src/app.ts`, agregá tu dominio/IP a los orígenes permitidos:

```typescript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://TU_IP_PUBLICA:5173',
    'http://miapp.ddns.net:5173',
    // Agregar todas las URLs desde donde se accederá
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### 3. Firewall de Windows

Si estás en Windows, permitir el puerto 3000:

```powershell
# PowerShell como Administrador
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Testing

### Desde datos móviles:
1. Abrí Chrome en el móvil
2. Activá datos móviles (desactivá WiFi)
3. Andá a: `http://TU_IP_PUBLICA:5173` o `http://miapp.ddns.net:5173`
4. Probá loguearte y navegar por la app

### Debugging:
Abrí la consola del navegador (Chrome DevTools remoto) para ver errores:
- `Network Error` = No puede conectarse al backend
- `CORS Error` = Backend rechaza la conexión
- `Timeout` = Backend muy lento o inalcanzable

## Recomendaciones de Producción

⚠️ **NO uses HTTP en producción**. Para datos móviles, muchas apps/navegadores requieren HTTPS.

### Opción 1: Certificado SSL gratuito
- Let's Encrypt con Certbot
- Configurar NGINX como reverse proxy
- URLs tipo: `https://miapp.ddns.net`

### Opción 2: Cloudflare Tunnel
- Servicio gratuito
- Crea un túnel seguro sin abrir puertos
- HTTPS automático
- Tutorial: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### Opción 3: Deploy completo
- Frontend: Vercel/Netlify (gratis, HTTPS automático)
- Backend: Render/Railway (gratis tier disponible)
- Base de datos: PostgreSQL en Render o Supabase

## Solución Rápida para Testing

Si solo querés testear desde datos móviles SIN configurar todo:

1. Usá **ngrok** (túnel temporal):
   ```bash
   # Instalar ngrok: https://ngrok.com/
   ngrok http 3000
   
   # Te dará una URL tipo: https://abc123.ngrok.io
   ```

2. Configurá `.env`:
   ```bash
   VITE_API_URL=https://abc123.ngrok.io
   ```

3. Reiniciá Vite y probá desde datos móviles

⚠️ La URL de ngrok cambia cada vez que lo reiniciás (en la versión gratis).
