import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carga y parsea la especificación OpenAPI 3.0 desde el archivo swagger.yaml.
 * El archivo se lee una sola vez al iniciar la aplicación.
 */
const swaggerYamlPath = path.resolve(__dirname, '../../docs/swagger.yaml');
let swaggerDocument;

try {
  const yamlContent = fs.readFileSync(swaggerYamlPath, 'utf8');
  swaggerDocument = yaml.load(yamlContent);
} catch (error) {
  console.error('⚠️  Error al cargar swagger.yaml:', error.message);
  console.error('   La documentación Swagger no estará disponible.');
  swaggerDocument = null;
}

/**
 * Opciones de personalización para Swagger UI.
 */
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2rem; }
  `,
  customSiteTitle: 'Turnito API – Documentación',
  customfavIcon: '',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    persistAuthorization: true,
  },
};

/**
 * Registra las rutas de Swagger UI en la aplicación Express.
 *
 * @param {import('express').Express} app - Instancia de Express
 * @param {string} [basePath='/api-docs'] - Ruta base para la documentación
 */
export const setupSwagger = (app, basePath = '/api-docs') => {
  if (!swaggerDocument) {
    console.warn('⚠️  Swagger UI no se registró: no se pudo cargar la especificación.');
    return;
  }

  // Servir la interfaz de Swagger UI
  app.use(basePath, swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

  // Endpoint para descargar la especificación en JSON
  app.get(`${basePath}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  });

  // Endpoint para descargar la especificación en YAML
  app.get(`${basePath}.yaml`, (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(swaggerYamlPath);
  });

  console.log(`📖 Swagger UI disponible en: ${basePath}`);
  console.log(`📄 Spec JSON: ${basePath}.json`);
  console.log(`📄 Spec YAML: ${basePath}.yaml`);
};

export default setupSwagger;
