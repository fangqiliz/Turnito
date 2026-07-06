# 🎨 Turnito - Guía de Diseño y Sistema de Componentes

Rediseño completo de la interfaz de Turnito siguiendo una identidad visual moderna y profesional, con estilo minimalista similar a Stripe, Linear y Notion.

## 📋 Paleta de Colores

### Color Principal - Azul Tecnológico
- **Hex**: `#2563EB`
- **Uso**: Dominante en toda la aplicación
  - Logo y navbar
  - Botones principales (CTA)
  - Links activos
  - Íconos principales
  - Elementos seleccionados
  - Estados de enfoque

### Color de Éxito - Verde Eficiencia
- **Hex**: `#22C55E`
- **Uso**: Para acciones exitosas
  - Confirmaciones
  - Reservas exitosas
  - Disponibilidad
  - Checks de turnos
  - Mensajes positivos
  - Indicadores de éxito

### Degradado Especial
```css
linear-gradient(90deg, #2563EB 0%, #22C55E 100%)
```
Utilizado en:
- Hero principal
- Botón especial
- Tarjetas promocionales
- Logo (cuando aplique)

### Color Secundario - Morado Innovación
- **Hex**: `#7C3AED`
- **Uso**: Acentos visuales secundarios
  - Badges
  - Etiquetas
  - Categorías
  - Servicios especiales
  - Indicadores secundarios
  - Chips

### Color de Texto - Gris Oscuro
- **Hex**: `#1F2937`
- **Uso**: Toda la tipografía
  - Títulos
  - Texto principal
  - Menús
  - Labels
  - Formularios

### Color de Fondo - Blanco
- **Hex**: `#FFFFFF`
- **Uso**: Espacio limpio
  - Fondo general
  - Tarjetas
  - Formularios
  - Modales
  - Espacios negativos

## 🎯 Variables CSS

Las variables están definidas en `src/index.css`:

```css
/* Colores Principales */
--color-primary: #2563EB
--color-success: #22C55E
--color-secondary: #7C3AED

/* Fondos */
--color-bg-primary: #FFFFFF
--color-bg-secondary: #F9FAFB
--color-bg-tertiary: #F3F4F6

/* Texto */
--color-text-primary: #1F2937
--color-text-secondary: #4B5563
--color-text-muted: #9CA3AF
```

## 🧩 Componentes

### Botones

#### Primario
```jsx
<button className="btn btn-primary">Acción Principal</button>
```
- Fondo: Azul (#2563EB)
- Texto: Blanco
- Hover: Azul oscuro con sombra

#### Secundario
```jsx
<button className="btn btn-secondary">Acción Secundaria</button>
```
- Fondo: Blanco
- Borde: Azul
- Texto: Azul

#### Éxito
```jsx
<button className="btn btn-success">Confirmación</button>
```
- Fondo: Verde (#22C55E)
- Texto: Blanco

#### Especial (Gradiente)
```jsx
<button className="btn btn-special">Acción Destacada</button>
```
- Gradiente: Azul → Verde
- Efecto hover: Elevación

### Tamaños
- **sm**: `btn-sm` - Pequeño
- **md**: `btn-md` - Mediano (default)
- **lg**: `btn-lg` - Grande

### Input / Formularios
```jsx
<div className="input-group">
  <label className="input-label">Email</label>
  <input className="input-field" type="email" />
</div>
```

Estados:
- Normal: Borde gris claro
- Hover: Borde gris más oscuro
- Focus: Borde azul + sombra sutil
- Error: Borde rojo

### Tarjetas
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Título</h3>
  </div>
  <div className="card-body">Contenido</div>
  <div className="card-footer">Acciones</div>
</div>
```

### Badges
```jsx
<span className="badge badge-primary">Etiqueta</span>
<span className="badge badge-success">Exitoso</span>
<span className="badge badge-secondary">Secundario</span>
```

### Alertas
```jsx
<div className="alert alert-info">
  <div className="alert-title">Información</div>
  <div className="alert-message">Mensaje descriptivo</div>
</div>
```

Tipos: `info`, `success`, `warning`, `danger`

### Modales
```jsx
<div className="modal-backdrop">
  <div className="modal">
    <div className="modal-header">
      <h2 className="modal-title">Título</h2>
    </div>
    <div className="modal-body">Contenido</div>
    <div className="modal-footer">Acciones</div>
  </div>
</div>
```

### Tabla
```jsx
<table className="table">
  <thead className="table-header">
    <tr>
      <th className="table-header-cell">Columna 1</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row">
      <td className="table-cell">Dato</td>
    </tr>
  </tbody>
</table>
```

## 🎨 Reglas de Diseño

✅ **Haz**
- Mantén un estilo minimalista
- Usa mucho espacio en blanco
- Bordes redondeados (12–16 px)
- Sombras muy suaves
- Iconografía moderna y clara
- Animaciones discretas y smooth
- Jerarquía visual clara

❌ **No hagas**
- Interfaces saturadas
- Colores fuera de la paleta
- Sombras fuertes o abigarradas
- Fuentes decorativas
- Animaciones que distraigan
- Múltiples colores primarios

## 📐 Espaciado

Usa las variables de espaciado:
```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
```

## 🎭 Estados

### Interactivos
- **Hover**: Cambio de color sutil + elevación
- **Focus**: Outline azul 2px + sombra
- **Active**: Presión visual
- **Disabled**: Opacidad 60% + cursor no-allowed

### Semánticos
- ✅ **Éxito**: Verde (#22C55E)
- ℹ️ **Información**: Azul (#2563EB)
- ⚠️ **Advertencia**: Ámbar
- ❌ **Error**: Rojo

## ♿ Accesibilidad

- Contraste AA mínimo (4.5:1 para texto)
- Texto legible y tamaño adecuado
- Botones claramente identificables
- Estados hover, focus y active visibles
- No depender únicamente del color
- Labels en formularios
- Alt text en imágenes

## 📝 Tipografía

**Familia**: Inter (Open Sans fallback)

**Pesos**:
- 400: Normal
- 500: Medium
- 600: Semibold
- 700: Bold
- 800: Extrabold

**Tamaños**:
- xs: 0.75rem
- sm: 0.8125rem
- base: 0.875rem
- md: 1rem
- lg: 1.125rem
- xl: 1.25rem
- 2xl: 1.5rem
- 3xl: 1.875rem
- 4xl: 2.25rem

## 🚀 Archivos Modificados

### Sistema Base
- `src/index.css` - Variables CSS actualizadas
- `src/components.css` - Sistema de componentes global

### Componentes UI
- `src/components/ui/Button.module.css`
- `src/components/ui/Input.module.css`
- `src/components/ui/Card.module.css`
- `src/components/ui/Badge.module.css`
- `src/components/ui/Modal.module.css`

### Layouts
- `src/components/layout/AuthLayout.module.css`
- `src/components/layout/Sidebar.module.css`
- `src/components/layout/TopBar.module.css`
- `src/components/layout/ClientLayout.module.css`
- `src/components/layout/DashboardLayout.module.css`

## 🎯 Próximos Pasos

1. Actualizar componentes React para usar nuevas clases
2. Revisar y actualizar imágenes/assets
3. Probar en diferentes navegadores
4. Validar accesibilidad (WCAG AA)
5. Obtener feedback de usuarios
6. Iterar según necesidad

---

**Última actualización**: 2026-07-05
