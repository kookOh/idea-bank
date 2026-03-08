import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { generateWithFallback, detectAvailableProviders } from './providers/index';
import type { GenerateRequest } from './types';

const PORT = Number(process.env.BRIDGE_PORT ?? 3100);
const MAX_BODY_BYTES = 1024 * 1024; // 1MB

const ALLOWED_ORIGIN = process.env.BRIDGE_ALLOWED_ORIGIN ?? 'http://localhost:3000';

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    const providers = await detectAvailableProviders();
    sendJson(res, 200, { status: 'ok', providers });
    return;
  }

  // Generate prompts
  if (url.pathname === '/generate' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const request: GenerateRequest = JSON.parse(body);

      if (!request.idea?.title) {
        sendJson(res, 400, { error: 'idea.title is required' });
        return;
      }

      const result = await generateWithFallback(request);
      sendJson(res, 200, result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[bridge] Error:', msg);
      sendJson(res, 502, { error: 'Generation failed. Check bridge server logs.' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[bridge] IdeaHunter AI Bridge running on http://localhost:${PORT}`);
  console.log('[bridge] Detecting available providers...');
  detectAvailableProviders().then((providers) => {
    for (const p of providers) {
      console.log(`[bridge]   ${p.name}: ${p.available ? 'available' : 'not found'}`);
    }
  });
});
