import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  extractIp, normalizeIp, parseIpCn, parseIpService, parsePchome, parseTrace, probes, summarize,
} from '../dist/split-probes.js';
import {WIDGET_IDS, formatLocation, runProbes, statusLabels} from '../dist/split-core.js';
import {setLanguage, translate} from '../dist/i18n.js';

test('parseTrace reads ip, loc, colo and warp, ignoring empty lines', () => {
  assert.deepEqual(parseTrace('\r\nip=203.0.113.7\r\n\r\nloc=JP\r\ncolo=NRT\r\nwarp=off\r\n'),
    {ip: '203.0.113.7', loc: 'JP', colo: 'NRT', warp: 'off'});
  assert.deepEqual(parseTrace('ip=2001:DB8::7\nwarp=on'),
    {ip: '2001:db8::7', loc: null, colo: null, warp: 'on'});
  assert.equal(parseTrace('loc=JP\ncolo=NRT'), null);
  assert.equal(parseTrace('ip=not-an-ip\nwarp=on'), null);
  assert.equal(parseTrace('ip=203.0.113.7:443'), null);
  assert.equal(parseTrace('\n\r\n'), null);
  assert.equal(parseTrace(null), null);
  assert.equal(parseTrace('\uFEFF  <!doctype html>\nip=203.0.113.7\n</html>'), null);
});

test('extractIp accepts IPv4, IPv6, chains and port-qualified endpoints', () => {
  for (const [input, expected] of [
    [' 203.0.113.7 ', '203.0.113.7'],
    ['2001:db8::443', '2001:db8::443'],
    ['203.0.113.7, 198.51.100.8', '203.0.113.7'],
    ['unknown, [2001:DB8::7]:443, 203.0.113.7', '2001:db8::7'],
    ['203.0.113.7:443', '203.0.113.7'],
    ['[2001:db8::7]', '2001:db8::7'],
    ['ip=203.0.113.7,443', '203.0.113.7'],
  ]) assert.equal(extractIp(input), expected, input);
});

test('extractIp rejects empty and malformed values', () => {
  for (const input of [undefined, null, '', ' ', 'unknown', '999.0.0.1', '1.2.3',
    '2001:::1', '203.0.113.7:65536', '[2001:db8::7]:abc', 'fe80::1%eth0',
    'https://203.0.113.7/', '203.0.113.7<script>']) {
    assert.equal(extractIp(input), null, String(input));
  }
});

test('normalizeIp canonicalizes IPv6 and treats IPv4 leading zeros as decimal', () => {
  assert.equal(normalizeIp('2001:0DB8:0000:0000:0:0:0000:0007'), '2001:db8::7');
  assert.equal(normalizeIp('2001:DB8::7'), '2001:db8::7');
  assert.equal(normalizeIp('010.008.000.001'), '10.8.0.1');
  assert.equal(normalizeIp('256.008.000.001'), null);
});

test('parsePchome accepts a valid IP with or without a province', () => {
  assert.deepEqual(parsePchome({ip: '203.0.113.7', addr: ' 北京 '}),
    {ip: '203.0.113.7', location: '北京'});
  assert.deepEqual(parsePchome({ip: '2001:db8::7', err: 'noprovince'}),
    {ip: '2001:db8::7', location: ''});
  assert.deepEqual(parsePchome({ip: '203.0.113.7', addr: '\uFFFD\uFFFD'}),
    {ip: '203.0.113.7', location: ''});
  assert.equal(parsePchome({addr: '北京', err: 'noprovince'}), null);
  assert.equal(parsePchome(null), null);
});

test('text and JSON IP services require a real IP field', () => {
  assert.deepEqual(parseIpCn('ip：203.0.113.7 归属地：日本'), {ip: '203.0.113.7', location: '日本'});
  assert.deepEqual(parseIpCn('IP: 2001:db8::7\n归属地: Tokyo'), {ip: '2001:db8::7', location: 'Tokyo'});
  assert.equal(parseIpCn('<html>ip：203.0.113.7</html>'), null);
  assert.deepEqual(parseIpService({ip: '203.0.113.7', country: 'Japan', city: 'Tokyo'},
    {countryKey: 'country', cityKey: 'city'}), {ip: '203.0.113.7', location: 'Japan · Tokyo'});
  assert.deepEqual(parseIpService({ip: '2001:db8::7', country_name: 'Japan'},
    {countryKey: 'country_name'}), {ip: '2001:db8::7', location: 'Japan'});
  assert.equal(parseIpService({country_name: 'Japan'}, {countryKey: 'country_name'}), null);
});

test('summarize groups equivalent addresses into one egress', () => {
  assert.deepEqual(summarize([
    {status: 'success', ip: '2001:DB8::7'},
    {status: 'success', ip: '2001:db8:0:0:0:0:0:7'},
    {status: 'timeout'},
  ]), {successful: 2, groups: [{ip: '2001:db8::7', count: 2}]});
});

test('summarize counts multiple egresses and ignores failed or invalid results', () => {
  const results = [
    {status: 'success', ip: '203.0.113.7'},
    {status: 'success', ip: '198.51.100.008'},
    {status: 'success', ip: '198.51.100.8'},
    {status: 'success', ip: 'bad'},
    {status: 'failed', ip: '203.0.113.9'},
    {status: 'unavailable'}, {status: 'timeout'},
  ];
  assert.deepEqual(summarize(results), {successful: 3, groups: [
    {ip: '198.51.100.8', count: 2}, {ip: '203.0.113.7', count: 1},
  ]});
  assert.deepEqual(summarize(results.slice(3)), {successful: 0, groups: []});
});

test('parseTrace preserves an unknown colo and drops malformed metadata', () => {
  assert.deepEqual(parseTrace('ip=203.0.113.7\nloc=JP\ncolo=XXX\nwarp=unknown'),
    {ip: '203.0.113.7', loc: 'JP', colo: 'XXX', warp: null});
  assert.deepEqual(parseTrace('ip=203.0.113.7\nloc=invalid\ncolo=invalid'),
    {ip: '203.0.113.7', loc: null, colo: null, warp: null});
});

test('split summary counters are translated in English and Japanese', () => {
  assert.equal(translate('1 个站点返回出口 IP', 'en'), '1 site returned an egress IP');
  assert.equal(translate('发现 2 个出口', 'en'), '2 egress IPs found');
  assert.equal(translate('21 个站点', 'ja'), '21 サイト');
});

test('v2 keeps 20 unique probes and the same Discord fallback', () => {
  assert.equal(probes.length, 20);
  assert.equal(new Set(probes.map(probe => probe.id)).size, probes.length);
  assert.ok(probes.every(probe => /^[a-z0-9.-]+$/.test(probe.id)));
  assert.ok(probes.every(probe => new URL(probe.url).hostname !== 'ipapi.co'));
  assert.deepEqual(probes.filter(probe => probe.fallback).map(probe => [probe.id, probe.fallback]),
    [['discord.com', 'https://gateway.discord.gg/cdn-cgi/trace']]);
  assert.deepEqual(WIDGET_IDS.map(id => probes.find(probe => probe.id === id)?.label),
    ['ChatGPT', 'Claude', 'X', '网易', '字节跳动', '高通中国']);
  for (const probe of probes) {
    assert.equal(probe.host, new URL(probe.url).hostname);
    assert.equal(probe.icon, `/icons/${probe.id.replaceAll('.', '-')}.png`);
    assert.equal(probe.short, [...probe.label][0].toUpperCase());
  }
});

test('runner preserves selected order and groups header geolocation requests by IP', async t => {
  const ids = WIDGET_IDS;
  const updates = [];
  let concurrent = 0;
  let peak = 0;
  let geoRequests = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit');
    concurrent++;
    peak = Math.max(peak, concurrent);
    await new Promise(resolve => setImmediate(resolve));
    concurrent--;
    if (url.hostname === 'free.freeipapi.com') {
      geoRequests++;
      assert.match(decodeURIComponent(url.pathname), /\/2001:db8::1$/);
      return Response.json({countryCode: 'JP', countryName: 'Japan', cityName: 'Tokyo'});
    }
    if (url.hostname === 'necaptcha.nosdn.127.net') {
      return new Response('', {headers: {'cdn-user-ip': '2001:DB8:0:0:0:0:0:1'}});
    }
    if (url.hostname === 'perfops.byte-test.com') {
      return new Response('', {headers: {'x-request-ip': '[2001:db8::1]:443'}});
    }
    return new Response('ip=203.0.113.7\nloc=JP\ncolo=NRT');
  });
  const results = await runProbes(ids, {onResult: (index, result) => updates.push([index, result])});
  assert.equal(peak, 6);
  assert.equal(geoRequests, 1);
  assert.deepEqual(results.map(result => result.ip), [
    '203.0.113.7', '203.0.113.7', '203.0.113.7',
    '2001:db8::1', '2001:db8::1', '203.0.113.7',
  ]);
  assert.equal(results[3].location, 'Japan · Tokyo');
  assert.equal(results[4].location, 'Japan · Tokyo');
  t.after(() => setLanguage('zh-CN'));
  for (const [locale, expected] of [['zh-CN', '日本 · Tokyo'], ['en', 'Japan · Tokyo'], ['ja', '日本 · Tokyo']]) {
    setLanguage(locale);
    assert.deepEqual(results.slice(3, 5).map(formatLocation), [expected, expected]);
  }
  assert.deepEqual(updates.filter(([, result]) => result.location).map(([index]) => index), [3, 4]);
});

test('runner cancels active requests and marks queued rows stopped', async t => {
  const controller = new AbortController();
  const ids = probes.slice(0, 10).map(probe => probe.id);
  let started = 0;
  let aborted = 0;
  const updates = [];
  t.mock.method(globalThis, 'fetch', (url, options) => {
    started++;
    if (url.hostname === 'chatgpt.com') return Promise.resolve(new Response('ip=203.0.113.7'));
    return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => {
        aborted++;
        reject(options.signal.reason);
      }, {once: true});
    });
  });
  const results = await runProbes(ids, {
    signal: controller.signal,
    onResult(index, result) {
      updates.push([index, result.status]);
      if (index === 0) controller.abort();
    },
  });
  assert.equal(started, 6);
  assert.equal(aborted, 5);
  assert.equal(results[0].status, 'success');
  assert.ok(results.slice(1).every(result => result.status === 'stopped' && !result.ip));
  assert.equal(updates.length, ids.length);
  assert.equal(statusLabels.stopped, '已停止');
});

test('runner keeps a measured no-IP response distinct from a blocked request', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.hostname === 'x.com') throw new TypeError('Blocked by browser');
    if (url.hostname === 'discord.com') return new Response('', {status: 403});
    if (url.hostname === 'gateway.discord.gg') return new Response('ip=203.0.113.7');
    return new Response('colo=NRT');
  });
  const [blocked, noIp, fallback] = await runProbes(['x.com', 'claude.ai', 'discord.com']);
  assert.deepEqual(blocked, {status: 'unavailable'});
  assert.equal(noIp.status, 'unavailable');
  assert.equal(noIp.ip, undefined);
  assert.ok(Number.isFinite(noIp.latency));
  assert.equal(fallback.status, 'success');
  assert.equal(fallback.usedFallback, true);
});

test('HTTP 403 and 429 are blocked, with the response code and elapsed time', async t => {
  const statuses = [403, 429];
  const ids = ['chatgpt.com', 'claude.ai'];
  t.mock.method(globalThis, 'fetch', async url =>
    new Response('', {status: statuses[ids.indexOf(url.hostname)]}));
  const results = await runProbes(ids);
  assert.deepEqual(results.map(result => result.status), ['blocked', 'blocked']);
  assert.deepEqual(results.map(result => result.httpStatus), statuses);
  assert.ok(results.every(result => Number.isFinite(result.latency) && !result.ip));
  assert.deepEqual(summarize(results), {successful: 0, groups: []});
  assert.equal(statusLabels.blocked, '被拦截');
});

test('HTTP 451 and 503 are blocked while 500 is a timed failure', async t => {
  const statuses = [451, 503, 500];
  const ids = ['x.com', 'grok.com', 'openai.com'];
  t.mock.method(globalThis, 'fetch', async url =>
    new Response('', {status: statuses[ids.indexOf(url.hostname)]}));
  const results = await runProbes(ids);
  assert.deepEqual(results.map(result => result.status),
    ['blocked', 'blocked', 'failed']);
  assert.deepEqual(results.slice(0, 2).map(result => result.httpStatus), [451, 503]);
  assert.ok(results.every(result => Number.isFinite(result.latency) && !result.ip));
});

test('an aborted six-second probe retains its elapsed time as a timeout', async t => {
  const timeout = AbortSignal.timeout;
  const request = new AbortController();
  const durations = [];
  t.mock.method(AbortSignal, 'timeout', ms => {
    durations.push(ms);
    return ms === 6000 ? request.signal : timeout(ms);
  });
  t.mock.method(globalThis, 'fetch', (_, {signal}) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), {once: true});
    queueMicrotask(() => request.abort(new DOMException('Timed out', 'TimeoutError')));
  }));
  const [result] = await runProbes(['chatgpt.com']);
  assert.ok(durations.includes(6000));
  assert.equal(result.status, 'timeout');
  assert.ok(Number.isFinite(result.latency));
  assert.equal(result.ip, undefined);
});

test('trace and IP service locations reflect the current interface language', t => {
  t.after(() => setLanguage('zh-CN'));
  const result = {loc: 'JP', colo: 'NRT'};
  const service = parseIpService({ip: '203.0.113.7', country_code: 'us', country: 'United States', city: 'Boston'},
    {countryKey: 'country', cityKey: 'city'});
  setLanguage('zh-CN');
  assert.equal(formatLocation(result), '日本 · 东京 (NRT)');
  assert.equal(formatLocation(service), '美国 · Boston');
  setLanguage('en');
  assert.equal(formatLocation(result), 'Japan · Tokyo (NRT)');
  assert.equal(formatLocation(service), 'United States · Boston');
  setLanguage('ja');
  assert.equal(formatLocation(result), '日本 · 東京 (NRT)');
  assert.equal(formatLocation({location: '供应商地名'}), '供应商地名');
});
