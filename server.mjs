import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const allowed=['/','/index.html','/style.css','/app.js','/i18n.js','/network.js','/dns.js','/address-info.js','/anycast-ranges.js','/logo.svg'];if(!allowed.includes(path)){res.writeHead(404);return res.end('Not found');}const file=path==='/'?'/index.html':path;const body=await readFile(fileURLToPath(new URL('./dist'+file,import.meta.url)));res.writeHead(200,{'Content-Type':types[file.slice(file.lastIndexOf('.'))],'Cache-Control':'no-cache'});res.end(body);}catch{res.writeHead(500);res.end('Server error');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
