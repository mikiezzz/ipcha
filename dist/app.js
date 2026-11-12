import {dnsRecords as dns, resolveDomain} from './dns.js';
import {classifyAddress} from './address-info.js';

import {ipType, readConnection, detectAddress} from './network.js';
import {getLocale, translate, initializeLanguages} from './i18n.js';
const $ = id => document.getElementById(id);
const cache = new Map();
let latest = null, currentData = null, lookupSequence = 0, currentSequence = 0, toastTimer;
export {ipType} from './network.js';
export function parseTarget(raw) {
  const input = raw.trim();
  if (!input || /\s/.test(input)) throw new Error('请输入有效的 IP、域名或 HTTP(S) 网址。');
  const plain = input.startsWith('[') && input.endsWith(']') ? input.slice(1,-1) : input;
  if (ipType(plain)) return { host: plain, type: ipType(plain) };
  if (/^[\d.]+$/.test(plain)) throw new Error('IPv4 地址格式不正确，每段应为 0–255。');
  let url;
  try { url = new URL(input.includes('://') ? input : `https://${input}`); } catch { throw new Error('地址格式不正确，请检查后重试。'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('仅支持不含账号密码的 HTTP(S) 网址。');
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (ipType(host)) return { host, type: ipType(host) };
  if (host.length > 253 || !host.includes('.') || !host.split('.').every(x => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(x))) throw new Error('请输入有效的公网域名，例如 example.com。');
  return { host, type: 'domain' };
}
export function reverseName(ip) {
  if (ipType(ip) === 'IPv4') return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  let hex = ip.toLowerCase();
  if (hex.includes('.')) { const end = hex.slice(hex.lastIndexOf(':') + 1).split('.').map(Number); hex = hex.slice(0,hex.lastIndexOf(':') + 1) + ((end[0]<<8)|end[1]).toString(16) + ':' + ((end[2]<<8)|end[3]).toString(16); }
  const parts = hex.split('::'), left = parts[0] ? parts[0].split(':') : [], right = parts[1] ? parts[1].split(':') : [];
  const all = parts.length === 2 ? [...left, ...Array(8-left.length-right.length).fill('0'), ...right] : left;
  return all.map(x=>x.padStart(4,'0')).join('').split('').reverse().join('.') + '.ip6.arpa';
}
async function getJSON(url, timeout = 10000) {
  const response = await fetch(url, {signal: AbortSignal.timeout(timeout), credentials: 'omit', referrerPolicy: 'no-referrer'});
  if (response.status === 429) throw new Error('免费数据服务查询额度已用完，请稍后重试。');
  if (!response.ok) throw new Error(`数据服务暂时不可用（${response.status}），请稍后重试。`);
  return response.json();
}
async function details(ip) {
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.time < 600000) return cached.data;
  const [geo, ptr] = await Promise.allSettled([geolocation(ip), dns(reverseName(ip),'PTR')]);
  const data = {ip, type:ipType(ip), hostname:ptr.status === 'fulfilled' ? (ptr.value.join(', ') || '无 PTR 记录') : '反向解析暂不可用', queriedAt:new Date().toISOString()};
  if (geo.status === 'fulfilled' && geo.value.success) Object.assign(data,geo.value);
  else data.error = geo.status === 'rejected' ? readable(geo.reason) : (geo.value.message === 'Reserved range' ? '该地址属于保留或内网范围，没有公网归属地。' : '未获取到公网归属地：' + (geo.value.message || '数据服务暂不可用'));
  data.addressInfo=classifyAddress(ip);
  if (!data.error && ptr.status === 'fulfilled') cache.set(ip,{time:Date.now(),data});
  return data;
}
// 主数据源无需密钥，备用源在主服务不可用时接管。
// 不提交网址的路径、参数或页面内容，只查询规范化后的 IP。
async function geolocation(ip) {
  try {
    const d=await getJSON(`https://free.freeipapi.com/api/v1/json/${encodeURIComponent(ip)}`,6500);
    if (!d.ipAddress || d.countryCode === '-') throw new Error('未获取到公网归属地');
    return {success:true,ip:d.ipAddress,type:ipType(d.ipAddress),country:d.countryName,country_code:d.countryCode,region:d.regionName,city:d.cityName,latitude:d.latitude,longitude:d.longitude,connection:{asn:d.asn,org:d.asnOrganization},timezone:{id:d.timeZones?.length===1?d.timeZones[0]:null},source:'FreeIPAPI'};
  } catch {
    const d=await getJSON(`https://ipwho.is/${encodeURIComponent(ip)}`,6500);
    return {...d,source:'ipwho.is'};
  }
}
function readable(error) { return error.name === 'TimeoutError' ? '连接数据服务超时，请稍后重试。' : error instanceof TypeError ? '无法连接数据服务，请检查网络后重试。' : error.message || '查询失败，请重试。'; }
function el(tag, cls, text) { const node = document.createElement(tag); if(cls) node.className=cls; if(text != null) node.textContent=text; return node; }
function country(d) { try { return d.country_code ? new Intl.DisplayNames([getLocale()],{type:'region'}).of(d.country_code) : d.country || '—'; } catch { return d.country || '—'; } }
function fields(d, small=false) {
  const all = small ? [['国家 / 地区',country(d)],['城市',d.city],['网络 / ASN', [d.connection?.isp || d.connection?.org,d.connection?.asn && `AS${d.connection.asn}`].filter(Boolean).join(' · ')],['主机名',d.hostname]] : [['IP 地址',d.ip],['地址类型',d.type],['主机名（PTR）',d.hostname],['国家 / 地区',country(d)],['省 / 州',d.region],['城市',d.city],['网络 / 组织',d.connection?.isp || d.connection?.org],['ASN',d.connection?.asn && `AS${d.connection.asn}`],['所属组织',d.connection?.org],['时区',d.timezone?.id],['UTC 偏移',d.timezone?.utc],['近似经纬度',d.latitude != null ? `${d.latitude}, ${d.longitude}` : null]];
  const fragment = document.createDocumentFragment();
  for (const [label,value] of all) { const displayed=d.addressInfo?.kind==='anycast'&&['国家 / 地区','省 / 州','城市','近似经纬度','时区','UTC 偏移'].includes(label)?'多节点部署，无单一位置':value;const dl=el('dl','detail'); dl.append(el('dt','',label),el('dd','',displayed || '—')); fragment.append(dl); }
  return fragment;
}
function showData(data) { latest=data; const container=$('resultDetails'); container.replaceChildren();renderAddressInfo(data,container); const grid=el('div','result-grid'); grid.append(fields(data)); container.append(grid); if(data.error) container.append(el('p','footnote',data.error)); const locale=getLocale(); const labels=locale==='en'?['Data:','Queried at','Approximate location only']:locale==='ja'?['データ：','検索時刻','位置情報は目安です']:['数据：','查询于','地理位置仅供参考']; $('resultMeta').textContent=`${labels[0]} ${data.source || translate('暂不可用')} · PTR：Public DNS · ${labels[1]} ${new Date(data.queriedAt).toLocaleTimeString(locale)} · ${labels[2]}`; }
function renderAddressInfo(data,container){
  const info=data.addressInfo || classifyAddress(data.ip);
  if(info.kind==='anycast'){
    const panel=el('div','address-notice');panel.append(el('span','badge','任播（Anycast）'));
    const evidence=el('p','footnote');evidence.append(el('span','','识别依据：'),document.createTextNode(info.provider+(info.range?' · '+info.range:'')));
    const source=el('a','','查看公开依据 ↗');source.href=info.source;source.target='_blank';source.rel='noopener noreferrer';evidence.append(document.createTextNode(' · '),source);panel.append(evidence);
    const origin=el('dl','detail');origin.append(el('dt','','源站 / 原始 IP'),el('dd','','公开解析无法确定'));panel.append(origin);
    panel.append(el('p','footnote',info.role==='service'?'任播服务没有必然对应的单一原始 IP。此地址由多个节点共同提供服务。':'此地址属于任播入口网段。公开 DNS 只提供对外入口，不能据此反推出后端源站 IP。'));
    container.append(panel);
  } else if(info.kind==='broadcast'||info.kind==='multicast')container.append(el('p','address-notice',info.kind==='broadcast'?'IPv4 有限广播地址':'组播地址（Multicast）'));
  const traces=data.resolution?.traces || [];
  if(traces.length&&(info.kind==='anycast'||traces.some(t=>t.chain?.length>1))){
    const details=el('details','resolution-trace');details.open=true;details.append(el('summary','','公开 DNS 解析溯源'));
    for(const trace of traces){const line=el('p','footnote');line.append(document.createTextNode([...(trace.chain||[]),trace.addresses.join(' / ')].join(' → ')),el('span','muted',' · '+trace.provider));details.append(line);}
    details.append(el('p','footnote','以上是公开 DNS 链路；末端地址不自动等于源站 IP。'));container.append(details);
  }
}
function notice(text,error=false) { $('message').textContent=text; $('message').className=error?'error':''; }
function toast(text) { $('toast').textContent=text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300); }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast('已复制'); } catch { toast('浏览器未允许复制，请手动选择文字复制'); } }
function readHistory() { try { return JSON.parse(localStorage.getItem('ipcha.history') || '[]').filter(x=>typeof x === 'string').slice(0,8); } catch { return []; } }
function renderHistory() { const box=$('historyItems'); box.replaceChildren(); const values=readHistory(); if(!values.length) box.append(el('span','small','还没有查询记录，试着探索一个地址。')); for(const value of values){ const b=el('button','',value); b.type='button'; b.onclick=()=>{ $('query').value=value; lookup(value); }; box.append(b); } }
function saveHistory(value) { try { localStorage.setItem('ipcha.history',JSON.stringify([value,...readHistory().filter(x=>x!==value)].slice(0,8))); } catch {} renderHistory(); }
async function lookup(raw) {
  const sequence=++lookupSequence;
  $('searchButton').disabled=true; $('searchButton').textContent='查询中…'; notice('正在解析地址并查询网络信息…'); $('result').hidden=true; latest=null;
  try {
    const target=parseTarget(raw); let ips=[target.host], warnings=[], resolverNames=[], resolution=null;
    if(target.type === 'domain') {
      const resolved=await resolveDomain(target.host);
      ips=resolved.ips; resolverNames=resolved.providers;
      resolution={query:target.host,traces:resolved.traces};
      if(resolved.partial)warnings.push('部分 DNS 记录获取失败，可重试。');
    }
    const data=await details(ips[0]); if(sequence!==lookupSequence)return;
    $('resultTitle').textContent=target.host; const box=$('dnsResults'); box.replaceChildren();
    if(target.type==='domain') {
      const providerLine=el('p','dns-label');providerLine.append(el('span','','解析来源：'),document.createTextNode(resolverNames.join(' / ')));box.append(providerLine);
      box.append(el('p','dns-label',`DNS 解析 · ${ips.length} 个地址 · 点击切换（CDN 地址可能因地区而异）`)); const chips=el('div','dns-chips');
      for(const ip of ips){ const b=el('button',ip===ips[0]?'selected':'',`${ipType(ip)}  ${ip}`);if(classifyAddress(ip).kind==='anycast')b.append(el('span','anycast-chip','任播')); b.type='button'; b.onclick=async()=>{ const seq=++lookupSequence; notice('正在查询所选 IP…'); try { const selected=await details(ip); if(seq!==lookupSequence)return; showData({...selected,resolution}); for(const child of chips.children)child.classList.toggle('selected',child===b); notice(selected.error || '查询完成。',!!selected.error); } catch(e){if(seq===lookupSequence)notice(readable(e),true);} }; chips.append(b); } box.append(chips);
    }
    showData({...data,resolution}); $('result').hidden=false; saveHistory(target.host); notice([data.error || '查询完成。',...warnings].join(' '),!!data.error);
  } catch(error) { if(sequence===lookupSequence)notice(readable(error),true); }
  finally { if(sequence===lookupSequence){$('searchButton').disabled=false; $('searchButton').replaceChildren(document.createTextNode('查询 '),el('span','','↗'));} }
}
async function detect() {
  const sequence=++currentSequence;
  currentData=null;cache.clear();$('refresh').disabled=false;$('refresh').setAttribute('aria-busy','true');
  $('connectionIP').textContent='正在检测…';$('connectionIP').onclick=null;
  $('connectionStatus').textContent='检测中';$('connectionHint').textContent='优先检测访问本网站时的连接地址';
  $('myDetails').replaceChildren(el('p','muted','正在获取网络与归属地信息…'));
  const connection=readConnection();
  function displayConnection(result) {
    if(sequence!==currentSequence)return;
    $('connectionIP').textContent=result.ip;$('connectionIP').onclick=()=>copy(result.ip);
    $('connectionStatus').textContent=result.type;
    $('connectionHint').textContent=result.source==='same-origin'?'来自本次网站连接，不沿用上次结果':'网站同域检测不可用，已使用备用检测来源';
  }
  connection.then(displayConnection,()=>{});
  const tasks=[['v4','IPv4'],['v6','IPv6']].map(async([id,type])=>{
    $(id).textContent='正在检测…';$(id+'status').textContent='检测中';$(id+'status').className='badge';$(id).onclick=null;
    const view=$(id==='v4'?'view4':'view6');view.disabled=true;
    try {
      const result=await detectAddress(type,connection);
      if(sequence!==currentSequence)return null;
      $(id).textContent=result.ip;$(id+'status').textContent='已连接';$(id).onclick=()=>copy(result.ip);
      view.disabled=false;view.onclick=()=>{$('query').value=result.ip;lookup(result.ip);$('lookup').scrollIntoView({behavior:'smooth'});};
      return result;
    } catch {
      if(sequence===currentSequence){$(id).textContent='暂无法确认';$(id+'status').textContent='检测源不可达';$(id+'status').className='badge off';}
      return null;
    }
  });
  try {
    // The website connection can succeed even when every external detector is blocked.
    const preferred=connection.catch(()=>Promise.any(tasks.map(p=>p.then(value=>{if(!value)throw new Error('Unavailable');return value;}))));
    let result;try{result=await preferred;}catch{}
    if(sequence!==currentSequence)return;
    if(!result){$('connectionIP').textContent='检测服务不可达';$('connectionStatus').textContent='可重试';$('connectionHint').textContent='无法联系检测服务，不代表你没有 IP 地址';$('myDetails').replaceChildren(el('p','muted','检测服务暂不可达。可重新检测，或在下方查询指定 IP。'));return;}
    displayConnection(result);
    const data=await details(result.ip);if(sequence!==currentSequence)return;
    if(!data.country_code && result.countryCode)data.country_code=result.countryCode;
    currentData=data;$('myDetails').replaceChildren(fields(data,true));if(data.error)$('myDetails').append(el('p','footnote',data.error));
  } finally {await Promise.allSettled(tasks);if(sequence===currentSequence)$('refresh').setAttribute('aria-busy','false');}
}
if (typeof document !== 'undefined') {
  initializeLanguages();
  document.querySelectorAll('.nav-tab[aria-current="page"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (new URL(link.href).pathname === location.pathname) event.preventDefault();
    });
  });
  document.addEventListener('ipcha:language',()=>{if(currentData){$('myDetails').replaceChildren(fields(currentData,true));if(currentData.error)$('myDetails').append(el('p','footnote',currentData.error));}if(latest)showData(latest);});
  const root = document.documentElement;
  const theme = $('theme');
  function applyTheme(dark) {
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.style.backgroundColor = dark ? '#0f1b17' : '#f7f9f7';
    theme.setAttribute('aria-pressed', String(dark));
  }
  let dark = root.classList.contains('dark');
  try { dark = localStorage.getItem('ipcha.theme') === 'dark'; } catch {}
  applyTheme(dark);
  theme.onclick = () => {
    dark = !dark;
    applyTheme(dark);
    try { localStorage.setItem('ipcha.theme', dark ? 'dark' : 'light'); } catch {}
  };
  $('searchForm').onsubmit=e=>{e.preventDefault();lookup($('query').value);};
  document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('query').value=b.dataset.example;lookup(b.dataset.example);});
  $('refresh').onclick=detect; $('clearHistory').onclick=()=>{try{localStorage.removeItem('ipcha.history');}catch{}renderHistory();toast('查询历史已清空');};
  $('copy').onclick=()=>latest&&copy(JSON.stringify(latest,null,2));
  $('export').onclick=()=>{if(!latest)return;const url=URL.createObjectURL(new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=`ipcha-${latest.ip.replaceAll(':','-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  renderHistory(); detect();
}
// 快捷查询：按 / 键直接定位到 IP 搜索框。
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', event => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isEditing) {
      event.preventDefault();
      document.getElementById('query').focus();
    }
  });
}
