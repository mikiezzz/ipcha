export function ipType(value) {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return value.split('.').every(x => +x <= 255 && (x === '0' || !x.startsWith('0'))) ? 'IPv4' : null;
  if (!value.includes(':') || value.includes('%')) return null;
  try { new URL(`http://[${value}]/`); return 'IPv6'; } catch { return null; }
}
let requestCounter=0;
async function freshText(url,{fetchImpl=globalThis.fetch,timeout=6000}={}) {
  const target=new URL(url,globalThis.location?.href || 'https://localhost/');
  target.searchParams.set('_ipcha',`${Date.now()}-${++requestCounter}`);
  const response=await fetchImpl(target.href,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(timeout)});
  if(!response.ok)throw new Error('Detection service unavailable');
  return (await response.text()).trim();
}
export async function readConnection(options={}) {
  const trace=await freshText('/cdn-cgi/trace',{...options,timeout:3500});
  const entries=Object.fromEntries(trace.split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
  const type=ipType(entries.ip || '');
  if(!type)throw new Error('Invalid connection address');
  return {ip:entries.ip,type,countryCode:/^[A-Z]{2}$/.test(entries.loc || '')?entries.loc:null,source:'same-origin'};
}
export async function detectAddress(type,connection,options={}) {
  // Reuse this run's same-origin connection, never a previous run's address.
  try { const result=await connection;if(result.type===type)return result; } catch {}
  const urls=type==='IPv4'?['https://api.ipify.org','https://ipv4.icanhazip.com']:['https://api6.ipify.org','https://ipv6.icanhazip.com'];
  return Promise.any(urls.map(async url=>{const ip=await freshText(url,options);if(ipType(ip)!==type)throw new Error('Address type mismatch');return {ip,type,source:new URL(url).hostname};}));
}
