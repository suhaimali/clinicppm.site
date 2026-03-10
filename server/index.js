import express from 'express';
import cors from 'cors';

import { connectToDatabase } from './src/config/db.js';
import { env } from './src/config/env.js';
import clinicStateRoutes from './src/routes/clinicStateRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'clinicppm-mongo-api',
    message: 'MongoDB API is running.'
  });
});

app.use('/api', clinicStateRoutes);

app.use((error, _request, response, _next) => {
  console.error('[api] Unhandled error:', error);
  response.status(500).json({
    ok: false,
    message: error.message || 'Unexpected server error.'
  });
});

const startServer = async () => {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`[api] Listening on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('[api] Failed to start server:', error);
  process.exit(1);
});