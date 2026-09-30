/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Server Entry Point - Express with Vite middlewares
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { judgeRouter } from './server/routes/judge.ts';
import levelRouter from './server/routes/level.ts';
import npcRouter from './server/routes/npc.ts';
import storyRouter from './server/routes/story.ts';
import statusRouter from './server/routes/status.ts';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// API Routes
app.use('/api/judge', judgeRouter);
app.use('/api', levelRouter);
app.use('/api', npcRouter);
app.use('/api', storyRouter);
app.use('/api', statusRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Tầm Phục Ký - Việt Phục Remix',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Game server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
