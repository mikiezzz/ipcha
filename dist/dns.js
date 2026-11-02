import {ipType} from './network.js';
const providers=[
  {name:'AliDNS',url:'https://dns.alidns.com/resolve'},
  {name:'Cloudflare DNS',url:'https://cloudflare-dns.com/dns-query'},
  {name:'Google Public DNS',url:'https://dns.google/resolve'},
];
const types={A:1,AAAA:28,PTR:12};
function cleanName(name){return String(name).toLowerCase().replace(/\.$/,'');}
async function fromProvider(provider,name,type,fetchImpl,signal){
  const visited=new Set(),chain=[cleanName(name)];
  for(let hop=0;hop<6;hop++){
    name=cleanName(name);if(visited.has(name))throw new Error('DNS alias loop');visited.add(name);
    const url=new URL(provider.url);url.searchParams.set('name',name);url.searchParams.set('type',type);
    const response=await fetchImpl(url.href,{headers:{Accept:'application/dns-json'},credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal});
    if(!response.ok)throw new Error(`DNS HTTP ${response.status}`);
    const data=await response.json();if(![0,3].includes(data.Status))throw new Error('DNS response failed');
    const answers=Array.isArray(data.Answer)?data.Answer:[];
    const aliases=new Map(answers.filter(a=>a.type===5&&typeof a.data==='string').map(a=>[cleanName(a.name||name),cleanName(a.data)]));
    let canonical=name;
    while(aliases.has(canonical)){
      const target=aliases.get(canonical);
      if(!/^[a-z\d_.-]+$/i.test(target)||target.length>253||chain.includes(target)||chain.length>=10)throw new Error('Invalid DNS alias chain');
      chain.push(target);canonical=target;
    }
    const values=[...new Set(answers.filter(a=>a.type===types[type]&&typeof a.data==='string').map(a=>a.data.trim().replace(/\.$/,'')))].filter(value=>type==='PTR'||ipType(value)===(type==='A'?'IPv4':'IPv6'));
    if(data.Status===0&&values.length)return {values,status:0,provider:provider.name,chain};
    if(data.Status===0&&canonical!==name){name=canonical;continue;}
    const negative=new Error('No matching DNS records');negative.negative=true;negative.status=data.Status;negative.provider=provider.name;throw negative;
  }
  throw new Error('DNS alias chain too long');
}
export async function queryDNS(name,type,{fetchImpl=globalThis.fetch,timeout=5000}={}){
  if(!Object.hasOwn(types,type))throw new Error('Unsupported DNS type');
  const controller=new AbortController(),signal=AbortSignal.any([controller.signal,AbortSignal.timeout(timeout)]);
  try{return await Promise.any(providers.map(provider=>fromProvider(provider,name,type,fetchImpl,signal)));}
  catch(error){const negatives=(error.errors||[]).filter(x=>x.negative);if(negatives.length)return {values:[],status:negatives.some(x=>x.status===0)?0:3,provider:negatives.map(x=>x.provider).join(' / ')};throw new Error('DNS 解析服务连接失败，请检查网络后重试。');}
  finally{controller.abort();}
}
export async function dnsRecords(name,type,options){return (await queryDNS(name,type,options)).values;}
export async function resolveDomain(host,options){
  const results=await Promise.allSettled([queryDNS(host,'A',options),queryDNS(host,'AAAA',options)]);
  const fulfilled=results.filter(x=>x.status==='fulfilled').map(x=>x.value),ips=[...new Set(fulfilled.flatMap(x=>x.values))];
  const partial=results.some(x=>x.status==='rejected');
  if(!ips.length){
    if(!fulfilled.length)throw new Error('DNS 解析服务连接失败，请检查网络后重试。');
    if(partial)throw new Error('部分 DNS 查询未完成，暂时无法确认该域名的地址，请重试。');
    if(fulfilled.every(x=>x.status===3))throw new Error('DNS 返回域名不存在，请检查拼写。');
    throw new Error('该域名没有可用的 IPv4 / IPv6 地址记录。');
  }
  return {ips,partial,providers:[...new Set(fulfilled.filter(x=>x.values.length).map(x=>x.provider))],traces:fulfilled.filter(x=>x.values.length).map(x=>({chain:x.chain,addresses:x.values,provider:x.provider}))};
}
