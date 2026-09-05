'use strict';
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT     = 3003;
const DIR      = __dirname;
const DATA_DIR = path.join(DIR, 'data');
const HTML     = path.join(DIR, 'index.html');

function dataFile(ctx) {
  return path.join(DATA_DIR, ctx === 'lab' ? 'tudus-lab.json' : 'tudus-work.json');
}

function parseCtx(url) {
  try { return new URL(url, 'http://localhost').searchParams.get('ctx') === 'lab' ? 'lab' : 'work'; }
  catch { return 'work'; }
}

const MAX_BODY = 10 * 1024 * 1024; // 10 MB sanity cap

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve the app
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(HTML).pipe(res);
    return;
  }

  // Read data file
  if (req.method === 'GET' && req.url.startsWith('/data')) {
    const ctx  = parseCtx(req.url);
    const file = dataFile(ctx);
    const NO_CACHE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    if (!fs.existsSync(file)) {
      res.writeHead(200, NO_CACHE);
      res.end('null');
      return;
    }
    res.writeHead(200, NO_CACHE);
    fs.createReadStream(file).pipe(res);
    return;
  }

  // Write data file
  if (req.method === 'POST' && req.url.startsWith('/data')) {
    const ctx  = parseCtx(req.url);
    const file = dataFile(ctx);
    let body = '', size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed || parsed.version !== 1) throw new Error('unexpected schema');
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(parsed, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');

}).listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  tudus');
  console.log(`  → http://localhost:${PORT}`);
  console.log('');
  console.log('  Work data : data/tudus-work.json  (created on first save)');
  console.log('  Lab data  : data/tudus-lab.json   (created on first save)');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
