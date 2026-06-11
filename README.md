# 🗓️ Turnito Backend - Core Bootstrap API

¡Bienvenido al backend de **Turnito**! Este repositorio aloja el motor central del SaaS de reserva de citas y gestión de turnos. Ha sido estructurado siguiendo mejores prácticas profesionales para garantizar estabilidad, seguridad y escalabilidad a largo plazo.

---

## 🛠️ Stack Tecnológico

El núcleo del backend utiliza las siguientes tecnologías de grado de producción:

*   **Runtime:** [Node.js](https://nodejs.org/) (v18+)
*   **Framework:** [Express.js](https://expressjs.com/) (Minimalista y veloz)
*   **Base de datos y Auth:** [Supabase](https://supabase.com/) (PostgreSQL administrado + Auth + Storage)
*   **Validación de Esquemas:** [Zod](https://zod.dev/) (Validación robusta en tiempo de ejecución tanto para peticiones como para configuración)
*   **Seguridad:** [Helmet](https://helmetjs.github.io/) (Configura cabeceras HTTP seguras) y [CORS](https://github.com/expressjs/cors)
*   **Logging:** [Winston](https://github.com/winstonjs/winston) (Registro persistente y categorizado) y [Morgan](https://github.com/expressjs/morgan) (Registro de peticiones HTTP)
*   **Variables de Entorno:** [dotenv](https://github.com/motdotla/dotenv)

---

## 📁 Arquitectura y Estructura de Carpetas

Este proyecto está diseñado en torno a una **Arquitectura Modular**. Esto significa que las reglas del negocio no se mezclan, sino que se aíslan en componentes autocontenidos en `src/modules`.

```
Turnito/
├── src/
│   ├── config/              # Configuraciones de integraciones globales
│   │   ├── env.js           # Validación Zod de variables de entorno
│   │   ├── supabase.js      # Cliente de base de datos Supabase
│   │   ├── cors.js          # Políticas de CORS dinámicas
│   │   └── logger.js        # Configuración Winston y Morgan
│   ├── middlewares/         # Middlewares globales de Express
│   │   ├── errorHandler.js  # Captura global de excepciones y sanitización
│   │   └── validate.js      # Validador de peticiones basado en Zod
│   ├── utils/               # Utilidades globales reutilizables
│   │   ├── apiResponse.js   # Respuestas de éxito estandarizadas
│   │   └── apiError.js      # Clase personalizada ApiError
│   ├── modules/             # Módulos de negocio aislados (ej. users, appointments)
│   │   └── .gitkeep         # Estructura inicial lista
│   ├── app.js               # Instancia y configuración de la app Express
│   └── server.js            # Punto de entrada HTTP y apagado controlado (Graceful Shutdown)
├── .env.example             # Plantilla de variables de entorno
├── .gitignore               # Configuración para ignorar archivos en git
├── package.json             # Dependencias y scripts
└── README.md                # Documentación del proyecto
```

---

## 🚀 Instalación y Configuración

Sigue estos pasos para levantar la infraestructura del backend en tu entorno local:

### 1. Clonar el repositorio e Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto copiando la plantilla:
```bash
cp .env.example .env
```
Abre el archivo `.env` y rellena las variables con los datos correspondientes. 

| Variable | Tipo | Descripción | Ejemplo |
| :--- | :---: | :--- | :--- |
| `PORT` | `Number` | Puerto donde escuchará la API. | `3000` |
| `NODE_ENV` | `Enum` | Entorno de ejecución (`development`, `production`, `test`). | `development` |
| `SUPABASE_URL` | `URL` | Endpoint de tu API de Supabase. | `https://x.supabase.co` |
| `SUPABASE_ANON_KEY` | `String` | API Key pública/anon de tu proyecto Supabase. | `eyJhbGciOi...` |
| `CORS_ORIGIN` | `String` | Orígenes permitidos para CORS (separados por comas o `*`). | `http://localhost:5173` |

### 3. Ejecutar en modo desarrollo
Levanta el servidor con recarga automática usando `nodemon`:
```bash
npm run dev
```

### 4. Ejecutar en producción
Compila (si corresponde) y levanta la aplicación en producción:
```bash
npm start
```

---

## 🛡️ Estándar de la API y Guía de Desarrollo

Para mantener la base de código limpia y homogénea, debes seguir los siguientes estándares al agregar lógica de negocio:

### 1. Validación de Entrada (Middleware `validate`)
Nunca confíes en el cliente. Define esquemas Zod en tus módulos y aplícalos mediante el middleware de validación.

```javascript
import { z } from 'zod';
import validate from '../../middlewares/validate.js';

const loginSchema = {
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres'),
  })
};

// Uso en las rutas del módulo:
router.post('/login', validate(loginSchema), authController.login);
```

### 2. Respuestas de Éxito Estandarizadas (`sendSuccess`)
Utiliza siempre la función utilitaria `sendSuccess` para responder al cliente. Esto garantiza consistencia en la UI que consume tus APIs.

```javascript
import { sendSuccess } from '../../utils/apiResponse.js';

export const getTurnos = async (req, res, next) => {
  try {
    const data = [{ id: 1, fecha: '2026-06-15' }];
    return sendSuccess(res, 'Turnos recuperados correctamente', data, 200);
  } catch (error) {
    next(error);
  }
};
```
Formato JSON resultante:
```json
{
  "success": true,
  "message": "Turnos recuperados correctamente",
  "data": [
    { "id": 1, "fecha": "2026-06-15" }
  ]
}
```

### 3. Manejo de Errores Operacionales (`ApiError`)
Si necesitas lanzar un error controlado dentro de tu lógica de negocio, lanza una instancia de `ApiError` o usa sus métodos estáticos auxiliares. Esto evitará que Express caiga y enviará un código de error y detalle estructurado al cliente de manera automatizada.

```javascript
import ApiError from '../../utils/apiError.js';

// Lanzar error si un recurso no existe
if (!bookingExists) {
  throw ApiError.notFound('La cita que busca no existe o ha sido cancelada.');
}

// Lanzar error por petición incorrecta con detalles
if (limitExceeded) {
  throw ApiError.badRequest('Límite de citas excedido.', [
    { field: 'slots', message: 'No quedan espacios disponibles en esta fecha.' }
  ]);
}
```

---

## 🪵 Sistema de Logs y Monitoreo

*   **Consola de desarrollo:** Muestra logs coloridos estructurados con marcas de tiempo e indicación de nivel (ERROR, WARN, INFO, HTTP, DEBUG).
*   **Archivos de logs localizados:** Los logs persistentes se almacenan automáticamente en la carpeta `/logs` (la cual se encuentra excluida de Git):
    *   `logs/error.log`: Registra fallos graves de sistema y excepciones de tipo 500.
    *   `logs/combined.log`: Registra el historial total de tráfico, incluyendo rutas de acceso de Morgan y trazas del servidor.
