# PWA - Progressive Web App

## ¿Qué es?

La aplicación ahora funciona como una **PWA (Progressive Web App)**, lo que significa que puede instalarse en dispositivos móviles y funcionar como una app nativa.

## Características

✅ **Instalable**: Los usuarios pueden instalar la app en su pantalla de inicio
✅ **Funciona offline**: Cache de recursos para funcionalidad básica sin conexión
✅ **Icono en pantalla de inicio**: Aparece como cualquier otra app
✅ **Splash screen**: Pantalla de carga personalizada
✅ **Sin barra del navegador**: Experiencia fullscreen

## Cómo instalar en móvil

### Android (Chrome)
1. Abrí la app en Chrome
2. El navegador mostrará un banner de "Agregar a la pantalla de inicio"
3. O en el menú (⋮) → "Agregar a pantalla de inicio"
4. La app se instalará como una aplicación independiente

### iOS (Safari)
1. Abrí la app en Safari
2. Tocá el botón de compartir (cuadrado con flecha)
3. Seleccioná "Agregar a pantalla de inicio"
4. Confirmá el nombre y agregá

### Desktop (Chrome/Edge)
1. Visitá la app
2. Aparecerá un ícono de instalación en la barra de direcciones
3. Click en "Instalar"

## Archivos de la PWA

- `manifest.json`: Define nombre, iconos, colores de la app
- `service-worker.js`: Maneja cache y funcionalidad offline
- `icon-192.svg` y `icon-512.svg`: Iconos de la aplicación
- `serviceWorkerRegistration.ts`: Registra el service worker

## Personalización

### Cambiar nombre de la app
Editá `manifest.json`:
```json
"name": "Tu Nombre Aquí",
"short_name": "Nombre Corto"
```

### Cambiar colores
Editá `manifest.json`:
```json
"background_color": "#ffffff",
"theme_color": "#1976d2"
```

### Cambiar iconos
Reemplazá los archivos SVG con tus propios iconos (recomendado: PNG de 192x192 y 512x512)

## Notas importantes

⚠️ **HTTPS requerido**: Para que funcione en producción, el sitio debe estar en HTTPS
⚠️ **Actualización de cache**: Si cambiás archivos, actualizá la versión en `service-worker.js`:
```javascript
const CACHE_NAME = 'plan-entrenamiento-v2'; // Incrementar versión
```

## Testing

Para probar la PWA:
1. Build de producción: `npm run build`
2. Serví los archivos con HTTPS
3. Abrí en un móvil
4. Verificá que aparezca el prompt de instalación

## Lighthouse Audit

Podés verificar tu PWA con Chrome DevTools:
1. Abrí DevTools (F12)
2. Pestaña "Lighthouse"
3. Seleccioná "Progressive Web App"
4. Click en "Generate report"
