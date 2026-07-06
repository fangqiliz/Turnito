# ⚡ Comandos Rápidos para el Rediseño Turnito

## 🚀 Comenzar Ahora

```bash
# 1. Ir a frontend
cd frontend

# 2. Ejecutar servidor de desarrollo
npm run dev

# ✅ La app abrirá en http://localhost:5173
```

## 🔍 Verificar el Rediseño

### En el navegador:
1. Abre [http://localhost:5173/login](http://localhost:5173/login)
2. Presiona **F12** para abrir DevTools
3. Ve a **Elements** → Revisa el CSS

### Elementos para verificar:

**Logo y Hero:**
- Gradiente azul → verde visible
- Logo en la izquierda
- Texto blanco

**Formulario:**
- Fondo blanco
- Inputs con bordes grises
- Focus azul
- Botón gradiente

**Responsive:**
- Redimensiona ventana (Ctrl+Shift+M)
- Verifica mobile, tablet, desktop

## 🎨 Validar Colores

```css
/* Abre DevTools Console y copia: */

// Primario (Azul)
#2563EB

// Éxito (Verde)
#22C55E

// Secundario (Morado)
#7C3AED

// Texto (Gris oscuro)
#1F2937

// Fondo (Blanco)
#FFFFFF
```

## 📋 Checklist Rápida

- [ ] Ejecutar `npm run dev`
- [ ] Ver login en navegador
- [ ] Verificar colores
- [ ] Probar hover en botones
- [ ] Revisar inputs
- [ ] Responsive en mobile
- [ ] Sin errores en consola

## 🔧 Si Algo No Funciona

### Opción 1: Reload con caché limpio
```bash
# Termina npm (Ctrl+C)
# Limpia caché
rm -rf node_modules/.vite

# Reinicia
npm run dev
```

### Opción 2: Hard refresh navegador
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Opción 3: Limpiar todo
```bash
# Termina npm (Ctrl+C)
npm cache clean --force
rm -rf node_modules dist

# Reinstala y ejecuta
npm install
npm run dev
```

## 📁 Archivos Importantes

```
frontend/
├── src/
│   ├── index.css              ← Variables de color
│   ├── components.css         ← Sistema de componentes (NUEVO)
│   ├── main.jsx              ← Imports (actualizado)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.module.css      ← Botones
│   │   │   ├── Input.module.css       ← Inputs
│   │   │   ├── Card.module.css        ← Tarjetas
│   │   │   ├── Badge.module.css       ← Badges
│   │   │   └── Modal.module.css       ← Modales
│   │   └── layout/
│   │       ├── AuthLayout.module.css  ← Login/Register
│   │       ├── Sidebar.module.css
│   │       ├── TopBar.module.css
│   │       ├── ClientLayout.module.css
│   │       └── DashboardLayout.module.css
```

## 📚 Documentos de Referencia

```
REDISENO_EJECUTIVO.md        ← Resumen ejecutivo (LEER PRIMERO)
DESIGN_SYSTEM.md             ← Guía completa de componentes
REDISENO_RESUMEN.md          ← Cambios principales
VALIDATION_CHECKLIST.md      ← 100+ puntos de validación
INSTRUCCIONES_VERIFICACION.md ← Cómo revisar en detalle
```

## 🎯 Flujo de Verificación (5 min)

```bash
# 1. Terminal - Ejecutar app
cd frontend && npm run dev

# 2. Navegador - Abrir
http://localhost:5173/login

# 3. DevTools - Inspeccionar (F12)
Elementos CSS
Clases aplicadas
Variables utilizadas

# 4. Verificar
✓ Colores correctos
✓ Espaciado limpio
✓ Bordes redondeados
✓ Sombras suaves
✓ Responsive funciona
```

## 💡 Tips Útiles

### Ver variables CSS
```javascript
// En DevTools Console:
window.getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary')
```

### Buscar elemento por clase
```bash
# Ctrl + Shift + C en DevTools
# Luego haz click en elemento
```

### Forzar estado hover
```javascript
// En DevTools Console:
// Haz click derecho en elemento
// Elige ":hover"
```

### Ver todas las clases aplicadas
```javascript
// Abre DevTools
// Ve a Elements
// Mira la barra de clases en la parte derecha
```

## 🚨 Errores Comunes

### ❌ "CSS no se ve"
✅ Solución: `Ctrl+Shift+R` (hard refresh)

### ❌ "DevTools muestra archivo viejo"
✅ Solución: Limpia caché → `rm -rf node_modules/.vite`

### ❌ "No se ve en mobile"
✅ Solución: Abre DevTools → `Ctrl+Shift+M` → Selecciona dispositivo

### ❌ "Errores en console"
✅ Solución: Revisa `src/main.jsx` tiene imports de CSS

## 📞 Archivos por Tópico

### "¿Cómo uso botones?"
→ `DESIGN_SYSTEM.md` → Busca "Botones"

### "¿Qué colores cambiar?"
→ `REDISENO_RESUMEN.md` → Busca "Comparativa"

### "¿Cómo validar todo?"
→ `VALIDATION_CHECKLIST.md` → Completa lista

### "¿Cómo ver en detalle?"
→ `INSTRUCCIONES_VERIFICACION.md` → Paso a paso

## 🎨 Variables CSS Útiles

```css
/* En cualquier CSS nuevo, usa: */

background: var(--color-bg-primary);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
transition: all var(--transition-base);

/* Para azul primario */
background: var(--color-primary);

/* Para verde éxito */
background: var(--color-success);

/* Para hover */
:hover {
  box-shadow: var(--shadow-lg);
  color: var(--color-primary);
}
```

## 📊 Estructura de Botones

```html
<!-- Primario -->
<button class="btn btn-primary">Primario</button>

<!-- Secundario -->
<button class="btn btn-secondary">Secundario</button>

<!-- Éxito -->
<button class="btn btn-success">Éxito</button>

<!-- Tamaños -->
<button class="btn btn-primary btn-sm">Pequeño</button>
<button class="btn btn-primary btn-lg">Grande</button>

<!-- Ancho completo -->
<button class="btn btn-primary btn-full">Ancho completo</button>
```

## 📝 Estructura de Inputs

```html
<div class="input-group">
  <label class="input-label">Correo</label>
  <input class="input-field" type="email" />
  <div class="input-hint">Texto de ayuda</div>
</div>
```

## 🎯 Estructura de Tarjetas

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Título</h3>
  </div>
  <div class="card-body">
    Contenido
  </div>
  <div class="card-footer">
    Acciones
  </div>
</div>
```

## ✨ Animaciones Disponibles

```css
/* En CSS */
animation: fadeIn 200ms ease-out;      /* Desvanecimiento */
animation: slideUp 300ms ease-out;     /* Desliza hacia arriba */
animation: slideInLeft 0.6s ease-out;  /* Desliza desde izq */
```

## 🔐 Verificar Accesibilidad

```bash
# En DevTools (F12):
# 1. Ve a Lighthouse
# 2. Haz audit
# 3. Busca "Accessibility" score
# Debe ser >= 90
```

## 🎬 Próximos Comandos

```bash
# Build para producción
npm run build

# Preview build local
npm run preview

# Lint (si está configurado)
npm run lint
```

## ⏱️ Tiempo Estimado

- Ejecutar app: **30 segundos**
- Verificar login: **1 minuto**
- Revisar todos elementos: **5 minutos**
- Testing responsivo: **5 minutos**
- Total: **~15 minutos**

---

## 🎉 ¡Listo!

**Próximo paso:**
```bash
cd frontend && npm run dev
```

Luego abre el navegador y disfruta del nuevo diseño. 🚀
