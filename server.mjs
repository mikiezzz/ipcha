import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import {extname, isAbsolute, normalize, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

function withinRoot(file) {
  const local = relative(root, file);
  return local !== '..' && !local.startsWith('..' + sep) && !isAbsolute(local);
}

function text(res, status, message, headers = {}) {
  res.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8', ...headers});
  res.end(message);
}

http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return text(res, 405, 'Method not allowed', {Allow: 'GET, HEAD'});
  }

  let path;
  try {
    path = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    return text(res, 400, 'Invalid URL');
  }
  // Check the original path before normalization can discard dot segments.
  if (!path.startsWith('/') || path.startsWith('//') ||
      /[\\:\x00-\x1f\x7f]/.test(path) || path.split('/').includes('..')) {
    return text(res, 400, 'Invalid path');
  }
  if (path === '/split') {
    res.writeHead(301, {Location: '/split/'});
    return res.end();
  }

  const local = normalize('.' + (path.endsWith('/') ? path + 'index.html' : path));
  const file = resolve(root, local);
  const type = types.get(extname(file).toLowerCase());
  if (!withinRoot(file) || !type) return text(res, 404, 'Not found');
  try {
    const target = await realpath(file);
    if (!withinRoot(target) || !(await stat(target)).isFile()) {
      return text(res, 404, 'Not found');
    }
    const body = req.method === 'HEAD' ? undefined : await readFile(target);
    res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff'});
    res.end(body);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM'].includes(error.code)) {
      return text(res, 404, 'Not found');
    }
    return text(res, 500, 'Server error');
  }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
