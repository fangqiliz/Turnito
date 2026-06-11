import env from './env.js';

const getOrigins = () => {
  const originStr = env.CORS_ORIGIN;
  
  if (!originStr || originStr === '*') {
    return '*';
  }
  
  return originStr.split(',').map((origin) => origin.trim());
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getOrigins();
    
    // Permitir peticiones sin origen (como clientes móviles, Postman o llamadas directas de servidor)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS policy: El origen '${origin}' no está permitido.`), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;
