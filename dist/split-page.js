import {formatLocation, geoEndpoint, probes, runProbes, statusLabels, summarize} from './split-core.js';
import {initializeLanguages} from './i18n.js';

const empty = '—';
const labels = ['网站', '方式', '出口 IP', '归属地', '延迟', '状态'];
const ids = probes.map(probe => probe.id);
const rows = document.getElementById('split-page-rows');
const stopButton = document.getElementById('split-page-stop');
const retryButton = document.getElementById('split-page-retry');
const filter = document.getElementById('split-page-category');
const egress = document.getElementById('split-page-egress');
const average = document.getElementById('split-page-average');
const toast = document.getElementById('toast');
let results = ids.map(() => ({status: 'waiting'}));
let activeRun;
let pendingAuto = true;
let cancelScheduled;
let toastTimer;

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value != null) node.textContent = value;
  return node;
}

function updateText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

function iconFor(probe) {
  const icon = element('span', 'split-icon');
  icon.dataset.letter = Array.from(probe.label)[0];
  icon.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => icon.classList.add('is-fallback'), {once: true});
  image.src = probe.icon;
  icon.append(image);
  return icon;
}

function buildRow(probe, index) {
  const row = element('tr');
  row.dataset.probe = probe.id;
  row.setAttribute('role', 'row');
  const cells = labels.map(label => {
    const cell = element('td');
    cell.setAttribute('role', 'cell');
    const mobileLabel = element('span', 'split-page-cell-label', label);
    mobileLabel.setAttribute('aria-hidden', 'true');
    cell.append(mobileLabel);
    row.append(cell);
    return cell;
  });

  const site = element('div', 'split-page-site');
  const siteText = element('div', 'split-page-site-text');
  siteText.append(element('strong', '', probe.label), element('small', '', probe.host));
  site.append(iconFor(probe), siteText);
  cells[0].append(site);
  cells[1].append(element('span', '', probe.method));

  const ipButton = element('button', 'split-page-ip');
  ipButton.type = 'button';
  ipButton.title = '复制出口 IP';
  const ip = element('bdi', '', empty);
  ip.setAttribute('data-i18n-skip', '');
  ipButton.append(ip);
  ipButton.addEventListener('click', () => {
    if (results[index].ip) void copyIp(results[index].ip);
  });
  cells[2].append(ipButton);

  const location = element('span', 'split-page-location', empty);
  cells[3].append(location);

  const latency = element('div', 'split-latency');
  latency.setAttribute('data-i18n-skip', '');
  const track = element('span', 'split-latency-track');
  track.setAttribute('aria-hidden', 'true');
  const fill = element('span', 'split-latency-fill');
  track.append(fill);
  const duration = element('span', 'split-latency-value', empty);
  latency.append(track, duration);
  cells[4].append(latency);

  const status = element('span', 'badge off', statusLabels.waiting);
  const fallback = element('span', 'split-page-fallback', '备用端点');
  fallback.hidden = true;
  const resultStatus = element('div', 'split-page-result-status');
  resultStatus.append(status, fallback);
  cells[5].append(resultStatus);
  return {row, ipButton, ip, location, fill, duration, status, fallback};
}

const views = probes.map(buildRow);
rows.replaceChildren(...views.map(view => view.row));

function updateRow(index) {
  const result = results[index];
  const view = views[index];
  const waiting = result.status === 'waiting' || result.status === 'running';
  const measured = Number.isFinite(result.latency);
  view.row.classList.toggle('is-pending', waiting);
  updateText(view.ip, result.ip || empty);
  view.ipButton.disabled = !result.ip;
  updateText(view.location, formatLocation(result));
  updateText(view.duration, measured ? `${result.latency} ms` : empty);
  view.fill.style.width = measured ? `${Math.min(100, result.latency / 600 * 100)}%` : '0%';
  updateText(view.status, result.status === 'unavailable' && measured ? '仅延迟' : statusLabels[result.status]);
  view.status.title = result.httpStatus ? `HTTP ${result.httpStatus}` : '';
  view.status.classList.toggle('off', result.status !== 'success');
  view.fallback.hidden = !result.usedFallback;
}

function renderSummary() {
  const {groups} = summarize(results);
  const measured = results.filter(result => result.status === 'success' && Number.isFinite(result.latency));
  const mean = measured.length ? Math.round(measured.reduce((total, result) => total + result.latency, 0) / measured.length) : null;
  updateText(egress, `${groups.length} 个出口`);
  updateText(average, mean == null ? '平均 —' : `平均 ${mean} ms`);
}

function renderAll() {
  views.forEach((_, index) => updateRow(index));
  renderSummary();
}

function showBusy(busy) {
  rows.setAttribute('aria-busy', String(busy));
  stopButton.disabled = !busy;
  retryButton.disabled = busy;
}

function cancelAutoStart() {
  pendingAuto = false;
  cancelScheduled?.();
  cancelScheduled = undefined;
  document.removeEventListener('visibilitychange', scheduleAutoStart);
}

function scheduleAutoStart() {
  if (!pendingAuto || cancelScheduled || document.visibilityState !== 'visible') return;
  const launch = () => {
    cancelScheduled = undefined;
    if (pendingAuto && document.visibilityState === 'visible') void start();
  };
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(launch, {timeout: 1000});
    cancelScheduled = () => cancelIdleCallback(id);
  } else {
    const id = setTimeout(launch, 0);
    cancelScheduled = () => clearTimeout(id);
  }
}

function replacePending(status) {
  results = results.map(result =>
    result.status === 'waiting' || result.status === 'running' ? {status} : result);
}

function stop() {
  cancelAutoStart();
  const run = activeRun;
  activeRun = undefined;
  run?.abort();
  replacePending('stopped');
  renderAll();
  showBusy(false);
}

async function start() {
  cancelAutoStart();
  activeRun?.abort();
  const run = new AbortController();
  activeRun = run;
  results = ids.map(() => ({status: 'running'}));
  renderAll();
  showBusy(true);
  try {
    await runProbes(ids, {
      signal: run.signal,
      onResult(index, result) {
        if (activeRun !== run || run.signal.aborted) return;
        results[index] = result;
        updateRow(index);
        renderSummary();
      },
    });
  } catch {
    if (activeRun === run) {
      replacePending('failed');
      renderAll();
    }
  } finally {
    if (activeRun === run) {
      activeRun = undefined;
      showBusy(false);
    }
  }
}

async function copyIp(ip) {
  try {
    await navigator.clipboard.writeText(ip);
    toast.textContent = '已复制';
  } catch {
    toast.textContent = '浏览器未允许复制，请手动选择文字复制';
  }
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

const theme = document.getElementById('theme');
const root = document.documentElement;
function applyTheme(dark) {
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.style.backgroundColor = dark ? '#0f1b17' : '#f7f9f7';
  theme.setAttribute('aria-pressed', String(dark));
}
let dark = root.classList.contains('dark');
try { dark = localStorage.getItem('ipcha.theme') === 'dark'; } catch {}
applyTheme(dark);
theme.addEventListener('click', () => {
  dark = !dark;
  applyTheme(dark);
  try { localStorage.setItem('ipcha.theme', dark ? 'dark' : 'light'); } catch {}
});

filter.addEventListener('change', () => {
  views.forEach(({row}, index) => {
    row.hidden = Boolean(filter.value && probes[index].category !== filter.value);
  });
});
retryButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', scheduleAutoStart);
document.addEventListener('ipcha:language', () => {
  views.forEach((view, index) => updateText(view.location, formatLocation(results[index])));
});

const probeHosts = new Set(probes.flatMap(({host, fallback}) =>
  fallback ? [host, new URL(fallback).hostname] : [host]));
probeHosts.add(new URL(geoEndpoint).hostname);
document.getElementById('split-page-hosts').textContent = [...probeHosts].join(' · ');
renderAll();
initializeLanguages();
document.querySelectorAll('.nav-tab[aria-current="page"]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (new URL(link.href).pathname === location.pathname) event.preventDefault();
  });
});
scheduleAutoStart();
