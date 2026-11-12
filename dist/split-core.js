import {
  coloCities, extractIp, geoEndpoint, parseIpCn, parseIpService, parsePchome,
  parseTrace, probes, providerLocation, summarize,
} from './split-probes.js';
import {getLocale, translate} from './i18n.js';

// Both views import this contract. Probe order is stable and IDs select a subset.
// Probe: {id, label, short, category, kind, method, host, url, icon, headers, fallback}
// short is the monogram text. icon is the local /icons/<id-with-dashes>.png URL.
export {geoEndpoint, probes, summarize};

export const WIDGET_IDS = ['chatgpt.com', 'claude.ai', 'x.com', 'netease', 'bytedance', 'www.qualcomm.cn'];

export const statusLabels = {
  waiting: '等待测试', running: '测试中…', success: '成功',
  timeout: '超时', unavailable: '不可用', blocked: '被拦截', failed: '失败', stopped: '已停止',
};

const concurrency = 6;
const requestTimeout = 6000;
const runTimeout = 29500;
const geoCacheMs = 10 * 60 * 1000;
const empty = '—';
const blockedHttpStatuses = new Set([403, 429, 451, 503]);
const probesById = new Map(probes.map(probe => [probe.id, probe]));
const geoCache = new Map();
let nonce = 0;

function probeUrl(value) {
  const url = new URL(value);
  url.searchParams.set('_ipcha_split', `${Date.now()}-${++nonce}`);
  return url;
}

function probeFetch(url, signal) {
  return fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    signal,
  });
}

function cancelBody(response) {
  response.body?.cancel().catch(() => {});
}

function timedSignal(parent, ms) {
  if (typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function') {
    return {signal: AbortSignal.any([parent, AbortSignal.timeout(ms)]), close() {}};
  }
  const controller = new AbortController();
  const abort = () => controller.abort(parent.reason);
  const timer = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), ms);
  if (parent.aborted) abort();
  else parent.addEventListener('abort', abort, {once: true});
  return {
    signal: controller.signal,
    close() {
      clearTimeout(timer);
      parent.removeEventListener('abort', abort);
    },
  };
}

function jsonp(url, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) throw signal.reason;
    const callback = `ipchaSplit${nonce}`;
    url.searchParams.set('callback', callback);
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('credentialless', '');
    frame.referrerPolicy = 'no-referrer';
    // Run the third-party script in an opaque origin, isolated from the app.
    // Accept a response only from this request's frame and callback channel.
    frame.srcdoc = `<!doctype html><meta name="referrer" content="no-referrer"><script>
      const channel = ${JSON.stringify(callback)};
      const reply = (data, loadFailed = false) => parent.postMessage({channel, data, loadFailed}, '*');
      const receive = (data) => reply({
        ip: typeof data?.ip === 'string' ? data.ip : null,
        addr: typeof data?.addr === 'string' ? data.addr : null
      });
      window[channel] = window.IPCallBack = receive;
      const script = document.createElement('script');
      script.charset = 'GBK';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => reply(null);
      script.onerror = () => reply(null, true);
      script.src = ${JSON.stringify(url.href)};
      document.head.append(script);
    </script>`;
    function cleanup() {
      window.removeEventListener('message', onMessage);
      signal.removeEventListener('abort', onAbort);
      frame.remove();
    }
    function onMessage(event) {
      if (event.source !== frame.contentWindow || event.origin !== 'null' ||
          event.data?.channel !== callback) return;
      cleanup();
      if (event.data.loadFailed === true) reject(new TypeError('JSONP script could not be loaded'));
      else resolve(event.data.data);
    }
    function onAbort() {
      cleanup();
      reject(signal.reason);
    }
    window.addEventListener('message', onMessage);
    signal.addEventListener('abort', onAbort, {once: true});
    document.body.append(frame);
  });
}

async function readProbe(probe, url, signal) {
  if (probe.kind === 'jsonp') return parsePchome(await jsonp(url, signal));
  const response = await probeFetch(url, signal);
  if (!response.ok) {
    cancelBody(response);
    throw Object.assign(new Error(`HTTP ${response.status}`), {httpStatus: response.status});
  }
  if (probe.kind === 'headers') {
    let ip = null;
    for (const header of probe.headers) {
      ip = extractIp(response.headers.get(header));
      if (ip) break;
    }
    cancelBody(response);
    return ip ? {ip} : null;
  }
  if (probe.kind === 'json') return parseIpService(await response.json(), probe);
  const text = await response.text();
  return probe.kind === 'trace' ? parseTrace(text) : parseIpCn(text);
}

async function attempt(probe, url, runSignal) {
  const started = performance.now();
  const request = timedSignal(runSignal, requestTimeout);
  const {signal} = request;
  try {
    if (signal.aborted) throw signal.reason;
    const data = await readProbe(probe, probeUrl(url), signal);
    if (signal.aborted) throw signal.reason;
    return {status: data ? 'success' : 'unavailable', ...data,
      latency: Math.round(performance.now() - started)};
  } catch (error) {
    const latency = Math.round(performance.now() - started);
    if (signal.reason?.name === 'TimeoutError' || error?.name === 'TimeoutError') {
      return {status: 'timeout', latency};
    }
    if (blockedHttpStatuses.has(error?.httpStatus)) {
      return {status: 'blocked', latency, httpStatus: error.httpStatus};
    }
    if (error instanceof TypeError) return {status: 'unavailable'};
    return {status: 'failed', latency};
  } finally {
    request.close();
  }
}

async function probeSite(probe, signal) {
  const result = await attempt(probe, probe.url, signal);
  if (probe.fallback && result.status !== 'success' && !signal.aborted) {
    const fallback = await attempt(probe, probe.fallback, signal);
    return {...fallback, usedFallback: fallback.status === 'success'};
  }
  return result;
}

async function pool(items, signal, work) {
  let next = 0;
  async function worker() {
    while (!signal.aborted && next < items.length) {
      const index = next++;
      await work(items[index], index);
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, worker));
}

function localizedCountry(code, fallback = '') {
  if (code && typeof Intl.DisplayNames === 'function') {
    return new Intl.DisplayNames([getLocale()], {type: 'region'}).of(code) || fallback || code;
  }
  return fallback || code || '';
}

export function formatLocation(result) {
  if (result.countryCode) {
    const country = localizedCountry(result.countryCode, result.countryName);
    return [country, result.cityName].filter(Boolean).join(' · ');
  }
  if (result.location) return result.location;
  const country = localizedCountry(result.loc);
  const city = coloCities[result.colo];
  const node = city ? `${translate(city)} (${result.colo})` : result.colo;
  return [country, node].filter(Boolean).join(' · ') || empty;
}

async function lookupGeo(ip, signal) {
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.time < geoCacheMs) return cached.location;
  const request = timedSignal(signal, requestTimeout);
  let location;
  try {
    const response = await probeFetch(probeUrl(geoEndpoint + encodeURIComponent(ip)), request.signal);
    if (response.ok) {
      const data = await response.json();
      location = providerLocation(data.countryName, data.cityName, data.countryCode);
    } else {
      cancelBody(response);
    }
  } catch {
    // Location is optional. Keep the observed IP when the lookup fails.
  } finally {
    request.close();
  }
  if (request.signal.aborted || !(location?.location || location?.countryCode)) return;
  geoCache.set(ip, {location, time: Date.now()});
  return location;
}

async function enrichLocations(selected, results, signal, publish) {
  const indices = new Map();
  results.forEach((result, index) => {
    if (selected[index].kind !== 'headers' || !result.ip) return;
    if (!indices.has(result.ip)) indices.set(result.ip, []);
    indices.get(result.ip).push(index);
  });
  for (const [ip, cached] of geoCache) {
    if (Date.now() - cached.time >= geoCacheMs) geoCache.delete(ip);
  }
  await pool([...indices], signal, async ([ip, matches]) => {
    const location = await lookupGeo(ip, signal);
    if (signal.aborted || !location) return;
    for (const index of matches) publish(index, {...results[index], ...location});
  });
}

// ids are ordered. onResult(index, result) publishes a finished row and may
// publish it again after an optional geolocation lookup. The resolved array
// is in the original ID order, including stopped rows after cancellation.
export async function runProbes(ids, {signal = new AbortController().signal, onResult = () => {}} = {}) {
  const selected = ids.map(id => {
    const probe = probesById.get(id);
    if (!probe) throw new RangeError('Unknown split probe: ' + id);
    return probe;
  });
  const results = selected.map(() => ({status: 'waiting'}));
  const scope = timedSignal(signal, runTimeout);
  function publish(index, result) {
    results[index] = result;
    onResult(index, result);
  }

  try {
    await pool(selected, scope.signal, async (probe, index) => {
      const result = await probeSite(probe, scope.signal);
      publish(index, signal.aborted ? {status: 'stopped'} : result);
    });
    results.forEach((result, index) => {
      if (result.status === 'waiting') publish(index, {status: signal.aborted ? 'stopped' : 'timeout'});
    });
    if (!scope.signal.aborted) await enrichLocations(selected, results, scope.signal, publish);
    return results;
  } finally {
    scope.close();
  }
}
