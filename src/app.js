import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import corsOptions from './config/cors.js';
import { morganStream } from './config/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import ApiError from './utils/apiError.js';
import { sendSuccess } from './utils/apiResponse.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import businessRoutes from './modules/businesses/business.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import serviceRoutes from './modules/services/service.routes.js';
import scheduleRoutes from './modules/schedules/schedule.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import uploadsRoutes from './modules/uploads/uploads.routes.js';
import setupSwagger from './config/swagger.js';

const app = express();

// 1. Configuraciones de Seguridad Global
app.use(helmet());
app.use(cors(corsOptions));

// 2. Registro de Solicitudes HTTP (Logs)
// Formato morgan simplificado para la consola de desarrollo y Winston
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, { stream: morganStream }));

// 3. Parsers de Datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rutas Base de la API
app.get('/health', (req, res) => {
  return sendSuccess(res, 'API de Turnito activa y respondiendo.', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

app.get('/', (req, res) => {
  return sendSuccess(res, 'Bienvenido al backend de Turnito. Sistema base listo para escalar.');
});

// 4.1 Documentación de API (Swagger)
setupSwagger(app, '/api-docs');

// Rutas de Módulos
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/businesses', businessRoutes);
app.use('/employees', employeeRoutes);
app.use('/services', serviceRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/upload', uploadsRoutes);

// 5. Manejo de Rutas no Encontradas (404)
app.use((req, res, next) => {
  return next(ApiError.notFound(`La ruta ${req.method} ${req.originalUrl} no está definida en este servidor.`));
});

// 6. Manejo de Errores Globales (Debe registrarse al final)
app.use(errorHandler);

export default app;
