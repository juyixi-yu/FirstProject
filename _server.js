const http = require('http');
const fs = require('fs');
const path = require('path');
const BASE = 'd:/Users/HBuilderProjects/婺韵新生';
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/';
  const fp = path.join(BASE, u);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + fp); return; }
    let ct = 'text/plain; charset=utf-8';
    if (fp.endsWith('.html')) ct = 'text/html; charset=utf-8';
    if (fp.endsWith('.js')) ct = 'application/javascript; charset=utf-8';
    if (fp.endsWith('.vue')) ct = 'text/html; charset=utf-8';
    if (fp.endsWith('.json')) ct = 'application/json; charset=utf-8';
    res.writeHead(200, {'Content-Type': ct});
    res.end(data);
  });
});
server.listen(8765, '127.0.0.1', () => console.log('OK listening on http://127.0.0.1:8765/'));
