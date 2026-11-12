import {ipType} from './network.js';

const traceProbes = [
  ['chatgpt.com', 'ChatGPT', 'AI'],
  ['claude.ai', 'Claude', 'AI'],
  ['x.com', 'X', '国际'],
  ['grok.com', 'Grok', 'AI'],
  ['discord.com', 'Discord', '国际', 'gateway.discord.gg'],
  ['openai.com', 'OpenAI', 'AI'],
  ['sora.com', 'Sora', 'AI'],
  ['www.perplexity.ai', 'Perplexity', 'AI'],
  ['medium.com', 'Medium', '国际'],
  ['coinbase.com', 'Coinbase', '国际'],
  ['www.okx.com', 'OKX', '国际'],
  ['notion.so', 'Notion', '国际'],
  ['gitlab.com', 'GitLab', '国际'],
  ['cdnjs.cloudflare.com', 'cdnjs', '静态资源'],
  ['www.qualcomm.cn', '高通中国', '国内'],
];

export const probes = [
  ...traceProbes.map(([host, label, category, fallback]) => ({
    id: host, label, category, kind: 'trace', method: 'Cloudflare',
    url: `https://${host}/cdn-cgi/trace`,
    fallback: fallback ? `https://${fallback}/cdn-cgi/trace` : null,
  })),
  {id: 'netease', label: '网易', category: '国内', kind: 'headers', method: 'CDN 响应头',
    url: 'https://necaptcha.nosdn.127.net/ab7f4275c1744aa28e0a8f3a1c58c532.png',
    headers: ['cdn-user-ip']},
  {id: 'bytedance', label: '字节跳动', category: '国内', kind: 'headers', method: 'CDN 响应头',
    url: 'https://perfops.byte-test.com/500b-bench.jpg',
    headers: ['x-request-ip', 'x-response-cinfo']},
  {id: 'pchome', label: 'PChome', category: '国内', kind: 'jsonp', method: 'JSONP',
    url: 'https://whois.pconline.com.cn/ipJson.jsp'},
  {id: 'ip.cn', label: 'ip.cn', category: '国内', kind: 'text', method: 'IP 服务',
    url: 'https://my.ip.cn/'},
  {id: 'ip.sb', label: 'ip.sb', category: 'IP 服务', kind: 'json', method: 'IP 服务',
    url: 'https://api.ip.sb/geoip', countryKey: 'country', cityKey: 'city'},
].map(probe => ({
  headers: [],
  fallback: null,
  ...probe,
  host: new URL(probe.url).hostname,
  short: [...probe.label][0].toUpperCase(),
  icon: `/icons/${probe.id.replaceAll('.', '-')}.png`,
}));

export const geoEndpoint = 'https://free.freeipapi.com/api/v1/json/';
export const coloCities = {
  NRT: '东京', HKG: '香港', SIN: '新加坡', LAX: '洛杉矶', SFO: '旧金山',
  SEA: '西雅图', IAD: '华盛顿', EWR: '纽约', LHR: '伦敦', FRA: '法兰克福',
  AMS: '阿姆斯特丹', CDG: '巴黎', SYD: '悉尼', TPE: '台北', PEK: '北京',
  SHA: '上海', CAN: '广州', SZX: '深圳',
};

export function normalizeIp(value) {
  if (typeof value !== 'string') return null;
  let ip = value.trim();
  // Canonicalize decimal IPv4 octets before the shared strict validator.
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    ip = ip.split('.').map(part => String(Number(part))).join('.');
  }
  if (!/^[\da-f:.]+$/i.test(ip)) return null;
  const family = ipType(ip);
  if (family === 'IPv4') return ip;
  if (family === 'IPv6') return new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  return null;
}

export function extractIp(value) {
  if (typeof value !== 'string') return null;
  for (const part of value.split(',')) {
    const candidate = part.trim().replace(/^ip\s*=\s*/i, '');
    const plain = normalizeIp(candidate);
    if (plain) return plain;
    // Require brackets when an IPv6 address has an explicit port.
    const endpoint = candidate.match(/^\[([\da-f:.]+)\](?::(\d{1,5}))?$/i)
      || candidate.match(/^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$/);
    if (endpoint && (!endpoint[2] || Number(endpoint[2]) <= 65535)) {
      const ip = normalizeIp(endpoint[1]);
      if (ip) return ip;
    }
  }
  return null;
}

export function parseTrace(text) {
  // A challenge page can contain arbitrary lines, including strings that look
  // like trace fields. Require a text response before inspecting those fields.
  if (typeof text !== 'string' || text.trimStart().startsWith('<')) return null;
  const fields = new Map();
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator > 0) fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  const ip = normalizeIp(fields.get('ip'));
  if (!ip) return null;
  const loc = fields.get('loc');
  const colo = fields.get('colo');
  const warp = fields.get('warp');
  return {
    ip,
    loc: /^[A-Z]{2}$/.test(loc || '') ? loc : null,
    colo: /^[A-Z]{3}$/.test(colo || '') ? colo : null,
    warp: ['on', 'off', 'plus'].includes(warp) ? warp : null,
  };
}

export function parsePchome(data) {
  const ip = extractIp(data?.ip);
  if (!ip) return null;
  const location = typeof data.addr === 'string' && !data.addr.includes('\uFFFD')
    ? data.addr.trim() : '';
  return {ip, location};
}

export function parseIpCn(text) {
  const match = text.match(/^\s*ip\s*[:：]\s*(\S+?)\s*(?:归属地\s*[:：]\s*([^\r\n]*))?\s*$/i);
  const ip = match && extractIp(match[1]);
  return ip ? {ip, location: match[2]?.trim() || ''} : null;
}

export function providerLocation(country, city, code) {
  const clean = value => typeof value === 'string' && value.trim() !== '-' ? value.trim() : '';
  const countryName = clean(country);
  const cityName = clean(city);
  const countryCode = clean(code).toUpperCase();
  const location = [countryName, cityName].filter(Boolean).join(' · ');
  return /^[A-Z]{2}$/.test(countryCode)
    ? {location, countryCode, countryName, cityName}
    : {location};
}

export function parseIpService(data, {countryKey, cityKey}) {
  const ip = extractIp(data?.ip);
  if (!ip) return null;
  return {ip, ...providerLocation(data[countryKey], data[cityKey], data.country_code)};
}

export function summarize(results) {
  const counts = new Map();
  let successful = 0;
  for (const result of results) {
    const ip = result?.status === 'success' ? normalizeIp(result.ip) : null;
    if (!ip) continue;
    successful++;
    counts.set(ip, (counts.get(ip) || 0) + 1);
  }
  const groups = [...counts].map(([ip, count]) => ({ip, count})).sort((a, b) => b.count - a.count);
  return {successful, groups};
}
