# 📖 Turnito API – Documentación REST

> **Versión:** 1.0.0 | **Formato:** OpenAPI 3.0 | **Autenticación:** JWT Bearer Token (Supabase Auth)

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías](#tecnologías)
- [Configurar Swagger UI](#configurar-swagger-ui)
- [Autenticación](#autenticación)
- [Formato de Respuestas](#formato-de-respuestas)
- [Códigos HTTP](#códigos-http)
- [Tabla Resumen de Endpoints](#tabla-resumen-de-endpoints)
- [Ejemplos de Llamadas HTTP](#ejemplos-de-llamadas-http)
- [Roles y Permisos](#roles-y-permisos)
- [Schemas (Modelos de Datos)](#schemas-modelos-de-datos)

---

## Descripción General

**Turnito** es una plataforma SaaS de gestión de citas multi-tenant que permite a negocios administrar empleados, servicios, horarios laborales y reservas de forma segura y escalable.

La API sigue los principios REST y utiliza JSON como formato de intercambio de datos.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| **Node.js** | Runtime del servidor |
| **Express.js** | Framework HTTP |
| **Supabase PostgreSQL** | Base de datos relacional |
| **Supabase Auth** | Autenticación y gestión de usuarios |
| **JWT** | Tokens de autenticación |
| **Zod** | Validación de schemas |
| **Swagger UI** | Documentación interactiva |

---

## Configurar Swagger UI

### 1. Instalar dependencias

```bash
npm install swagger-ui-express js-yaml
```

### 2. Integrar en Express

Agrega la configuración de Swagger en tu archivo `app.js`:

```javascript
import { setupSwagger } from './config/swagger.js';

// ... después de registrar las rutas ...
setupSwagger(app, '/api-docs');
```

### 3. Acceder a la documentación

Una vez el servidor esté corriendo:

| Recurso | URL |
|---|---|
| **Swagger UI** | `http://localhost:3000/api-docs` |
| **Spec JSON** | `http://localhost:3000/api-docs.json` |
| **Spec YAML** | `http://localhost:3000/api-docs.yaml` |

### 4. Alternativa: Visualizar sin servidor

Puedes visualizar el archivo `docs/swagger.yaml` directamente con:

- **Swagger Editor Online:** [https://editor.swagger.io](https://editor.swagger.io) (importar archivo)
- **VS Code Extension:** [Swagger Viewer](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer)
- **Redocly:** `npx @redocly/cli preview-docs docs/swagger.yaml`

---

## Autenticación

La API utiliza **JWT Bearer Tokens** emitidos por Supabase Auth.

### Header requerido

```
Authorization: Bearer {access_token}
```

### Obtener token

1. Registrar usuario: `POST /auth/register`
2. Iniciar sesión: `POST /auth/login` → Obtener `access_token` del response
3. Incluir token en todas las peticiones protegidas

### Endpoints públicos (no requieren token)

- `GET /health`
- `GET /`
- `POST /auth/register`
- `POST /auth/login`

---

## Formato de Respuestas

### ✅ Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación realizada correctamente.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "juan@ejemplo.com"
  }
}
```

### ❌ Respuesta de Error

```json
{
  "success": false,
  "message": "Error de validación en el cuerpo de la solicitud",
  "errors": [
    {
      "field": "email",
      "message": "El formato del correo electrónico es inválido"
    }
  ]
}
```

---

## Códigos HTTP

| Código | Significado | Cuándo se usa |
|---|---|---|
| `200` | OK | Operación exitosa (GET, PUT, DELETE) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Token no proporcionado, inválido o expirado |
| `403` | Forbidden | El usuario no tiene permisos para esta acción |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (slug duplicado, doble reserva, etc.) |
| `500` | Internal Server Error | Error inesperado del servidor |

---

## Tabla Resumen de Endpoints

### 🔐 Auth

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar nuevo usuario | Público |
| `POST` | `/auth/login` | Iniciar sesión | Público |
| `POST` | `/auth/logout` | Cerrar sesión | Autenticado |

### 👤 Users

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/users/me` | Obtener perfil propio | Autenticado |
| `PUT` | `/users/me` | Actualizar perfil propio | Autenticado |

### 🏢 Businesses

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/businesses` | Crear negocio | Admin |
| `GET` | `/businesses` | Listar negocios | Autenticado |
| `GET` | `/businesses/{id}` | Obtener negocio por ID | Autenticado |
| `PUT` | `/businesses/{id}` | Actualizar negocio | Owner |

### 👥 Employees

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/employees` | Crear empleado | Owner |
| `GET` | `/employees/business/{id}` | Listar empleados del negocio | Autenticado |
| `PUT` | `/employees/{id}?businessId=` | Actualizar empleado | Owner |
| `DELETE` | `/employees/{id}?businessId=` | Eliminar empleado | Owner |

### 💇 Services

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/services` | Crear servicio | Owner |
| `GET` | `/services/business/{id}` | Listar servicios del negocio | Autenticado |
| `PUT` | `/services/{id}?businessId=` | Actualizar servicio | Owner |
| `DELETE` | `/services/{id}?businessId=` | Eliminar servicio | Owner |

### 🕒 Schedules

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/schedules` | Crear horario laboral | Owner |
| `GET` | `/schedules/business/{id}` | Listar horarios del negocio | Autenticado |
| `PUT` | `/schedules/{id}?businessId=` | Actualizar horario | Owner |
| `DELETE` | `/schedules/{id}?businessId=` | Eliminar horario | Owner |

### 📅 Appointments (Core)

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/appointments` | Crear cita | Autenticado (cliente) |
| `GET` | `/appointments/user` | Mis citas (con paginación) | Autenticado |
| `GET` | `/appointments/business/{id}` | Agenda del negocio (con filtros) | Owner / Staff |
| `PUT` | `/appointments/{id}/status?businessId=` | Cambiar estado de cita | Owner / Staff |
| `DELETE` | `/appointments/{id}?businessId=` | Cancelar cita | Autenticado |

### 📤 Uploads

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/upload/avatar` | Subir imagen de perfil propia | Autenticado |
| `POST` | `/upload/logo` | Subir logo de un negocio | Owner / Admin / Manager |

---

## Ejemplos de Llamadas HTTP

### 🔐 Registrar usuario

```http
POST /auth/register HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "juan.perez@ejemplo.com",
  "password": "MiPassword123!",
  "fullName": "Juan Pérez",
  "avatarUrl": ""
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Usuario registrado correctamente.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "juan.perez@ejemplo.com"
    },
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "juan.perez@ejemplo.com",
      "full_name": "Juan Pérez",
      "avatar_url": "",
      "created_at": "2026-06-17T14:30:00Z",
      "updated_at": "2026-06-17T14:30:00Z"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "v1.MjQ5ZDc4...",
      "expires_in": 3600,
      "token_type": "bearer"
    }
  }
}
```

---

### 🔐 Iniciar sesión

```http
POST /auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "juan.perez@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "juan.perez@ejemplo.com"
    },
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "juan.perez@ejemplo.com",
      "full_name": "Juan Pérez",
      "avatar_url": ""
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "v1.MjQ5ZDc4...",
      "expires_in": 3600,
      "token_type": "bearer"
    }
  }
}
```

---

### 🔐 Cerrar sesión

```http
POST /auth/logout HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Cierre de sesión exitoso y sesión terminada.",
  "data": null
}
```

---

### 👤 Obtener perfil

```http
GET /users/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido correctamente.",
  "data": {
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "juan.perez@ejemplo.com",
      "full_name": "Juan Pérez",
      "avatar_url": ""
    },
    "roles": {
      "ownedBusinesses": [
        {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "Barbería El Corte",
          "slug": "barberia-el-corte",
          "logo_url": null,
          "created_at": "2026-06-15T12:00:00Z"
        }
      ],
      "employeeRoles": []
    }
  }
}
```

---

### 👤 Actualizar perfil

```http
PUT /users/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fullName": "Juan A. Pérez",
  "avatarUrl": "https://ejemplo.com/nuevo-avatar.jpg"
}
```

---

### 🏢 Crear negocio

```http
POST /businesses HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Barbería El Corte",
  "description": "La mejor barbería de la ciudad",
  "phone": "+1-809-555-0100",
  "address": "Av. 27 de Febrero #123, Santo Domingo",
  "logo_url": "https://ejemplo.com/logo.png"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Negocio creado correctamente.",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Barbería El Corte",
    "slug": "barberia-el-corte",
    "description": "La mejor barbería de la ciudad",
    "phone": "+1-809-555-0100",
    "address": "Av. 27 de Febrero #123, Santo Domingo",
    "logo_url": "https://ejemplo.com/logo.png"
  }
}
```

---

### 👥 Crear empleado

```http
POST /employees HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "business_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "full_name": "Carlos Rodríguez",
  "email": "carlos@ejemplo.com",
  "phone": "+1-809-555-0200",
  "specialty": "Corte de cabello",
  "role": "staff"
}
```

---

### 💇 Crear servicio

```http
POST /services HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "business_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Corte Clásico",
  "description": "Corte de cabello tradicional con navaja",
  "price": 25.00,
  "duration_minutes": 30
}
```

---

### 🕒 Crear horario laboral

```http
POST /schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "business_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employee_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "18:00"
}
```

---

### 📅 Crear cita

```http
POST /appointments HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "business_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "service_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "employee_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "start_time": "2026-06-20T10:00:00Z",
  "client_name": "María García",
  "client_email": "maria@ejemplo.com",
  "client_phone": "+1-809-555-0300",
  "notes": "Prefiero corte con tijera"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Cita agendada exitosamente.",
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "business_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "employee_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "service_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "start_time": "2026-06-20T10:00:00Z",
    "end_time": "2026-06-20T10:30:00Z",
    "status": "pending",
    "client_name": "María García",
    "client_email": "maria@ejemplo.com",
    "client_phone": "+1-809-555-0300",
    "notes": "Prefiero corte con tijera"
  }
}
```

---

### 📅 Obtener citas del usuario

```http
GET /appointments/user?status=pending&page=1&limit=10 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 📅 Obtener agenda del negocio

```http
GET /appointments/business/a1b2c3d4-e5f6-7890-abcd-ef1234567890?date=2026-06-20&status=pending HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 📅 Confirmar cita

```http
PUT /appointments/e5f6a7b8-c9d0-1234-efab-567890123456/status?businessId=a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Estado de la cita actualizado a \"confirmed\".",
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "status": "confirmed"
  }
}
```

---

### 📅 Cancelar cita

```http
DELETE /appointments/e5f6a7b8-c9d0-1234-efab-567890123456?businessId=a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Cita cancelada correctamente.",
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "status": "cancelled"
  }
}
```

---

### 📤 Subir imagen de perfil (Avatar)

```http
POST /upload/avatar HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="mi-foto.png"
Content-Type: image/png

[Contenido binario del archivo]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Avatar de usuario subido correctamente.",
  "data": {
    "url": "https://bczslyugprpyiohhthkq.supabase.co/storage/v1/object/public/avatars/550e8400-e29b-41d4-a716-446655440000/1687498200000-abcd.png"
  }
}
```

---

### 📤 Subir logo de un negocio

```http
POST /upload/logo HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="businessId"

a1b2c3d4-e5f6-7890-abcd-ef1234567890
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="logo-negocio.jpg"
Content-Type: image/jpeg

[Contenido binario del archivo]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Logo del negocio subido correctamente.",
  "data": {
    "url": "https://bczslyugprpyiohhthkq.supabase.co/storage/v1/object/public/business-logos/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1687498200000-xyz.jpg"
  }
}
```

---

## Roles y Permisos

### Roles del sistema

| Rol | Descripción |
|---|---|
| `admin` | Administrador global (Supabase Auth metadata) |
| `owner` | Propietario de un negocio específico |
| `manager` | Gerente del negocio |
| `staff` | Empleado regular |
| `client` | Usuario autenticado que agenda citas |

### Matriz de permisos por módulo

| Acción | Admin | Owner | Manager | Staff | Client |
|---|:---:|:---:|:---:|:---:|:---:|
| Crear negocio | ✅ | ❌ | ❌ | ❌ | ❌ |
| Actualizar negocio | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear empleado | ❌ | ✅ | ❌ | ❌ | ❌ |
| Gestionar empleados | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear servicio | ❌ | ✅ | ❌ | ❌ | ❌ |
| Gestionar servicios | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear horario | ❌ | ✅ | ❌ | ❌ | ❌ |
| Gestionar horarios | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear cita | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ver citas del negocio | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cambiar estado de cita | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cancelar cita propia | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Schemas (Modelos de Datos)

### Profile
```json
{
  "id": "uuid",
  "email": "string (email)",
  "full_name": "string",
  "avatar_url": "string (uri) | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Business
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "logo_url": "string (uri) | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Employee
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "profile_id": "uuid | null",
  "full_name": "string",
  "email": "string (email) | null",
  "phone": "string | null",
  "specialty": "string | null",
  "role": "owner | admin | manager | staff",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Service
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "name": "string",
  "description": "string | null",
  "price": "number (2 decimales)",
  "duration_minutes": "integer",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Schedule
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "employee_id": "uuid",
  "day_of_week": "integer (0-6)",
  "start_time": "string (HH:MM)",
  "end_time": "string (HH:MM)",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Appointment
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "client_id": "uuid | null",
  "employee_id": "uuid",
  "service_id": "uuid",
  "start_time": "datetime (ISO 8601)",
  "end_time": "datetime (ISO 8601)",
  "status": "pending | confirmed | cancelled | completed | no_show",
  "client_name": "string",
  "client_email": "string (email)",
  "client_phone": "string | null",
  "notes": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Notification
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "message": "string",
  "type": "appointment_created | appointment_confirmed | appointment_cancelled | reminder | system",
  "is_read": "boolean",
  "created_at": "datetime"
}
```

### ErrorResponse
```json
{
  "success": false,
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ],
  "stack": "string (solo en desarrollo)"
}
```

---

## Estructura de Archivos de la Documentación

```
Turnito/
├── docs/
│   └── swagger.yaml          # Especificación OpenAPI 3.0 completa
├── src/
│   └── config/
│       └── swagger.js        # Integración Swagger UI con Express
└── README-API.md             # Este documento
```

---

> 📌 **Generado para el proyecto Turnito** – SaaS de Gestión de Citas Multi-Tenant
