import {
  formatLocation, geoEndpoint, probes, runProbes, statusLabels, summarize, WIDGET_IDS,
} from './split-core.js';

const widget = document.getElementById('split-widget');
const byId = new Map(probes.map(probe => [probe.id, probe]));
const widgetProbes = WIDGET_IDS.map(id => byId.get(id));
const missing = '—';
let activeRun = null;
let autoPending = true;
let cancelIdle = null;

function node(tag, className = '', value = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function text(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function makeIcon(probe) {
  const icon = node('span', 'split-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.dataset.letter = [...(probe.short || probe.label)][0];
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

function buildCard(probe) {
  const card = node('li', 'split-widget-card');
  card.dataset.probe = probe.id;
  const content = node('div', 'split-widget-card-content');
  const top = node('div', 'split-widget-card-heading');
  const label = node('span', 'split-widget-name', probe.label);
  const location = node('span', 'badge split-widget-location', missing);
  const status = node('span', 'split-widget-status', statusLabels.waiting);
  top.append(label, location);

  const latency = node('div', 'split-latency');
  const track = node('span', 'split-latency-track');
  const fill = node('span', 'split-latency-fill');
  track.setAttribute('aria-hidden', 'true');
  track.append(fill);
  const value = node('span', 'split-latency-value', missing);
  value.setAttribute('data-i18n-skip', '');
  latency.append(node('span', 'sr-only', '延迟'), track, value);
  content.append(top, latency, status);
  card.append(makeIcon(probe), content);
  return {card, location, status, latency, fill, value};
}

function button(label, className) {
  const control = node('button', className, label);
  control.type = 'button';
  return control;
}

const cards = widgetProbes.map(buildCard);
const list = node('ul', 'split-widget-grid');
list.id = 'split-widget-sites';
list.append(...cards.map(view => view.card));

const header = node('div', 'section-top split-widget-header');
const titles = node('div', 'split-widget-titles');
const title = node('h2', '', '分流快照');
title.id = 'split-widget-title';
widget.removeAttribute('aria-label');
widget.setAttribute('aria-labelledby', title.id);
titles.append(node('span', 'eyebrow', 'SPLIT SNAPSHOT'), title);
titles.append(node('p', 'split-widget-intro', '打开页面后会自动检测 6 个常用站点'));
const controls = node('div', 'split-widget-controls');
const stop = button('停止', 'text-button split-widget-stop');
const restart = button('重新检测', 'primary split-widget-restart');
for (const control of [stop, restart]) control.setAttribute('aria-controls', list.id);
controls.append(stop, restart);
header.append(titles, controls);

const summary = node('div', 'split-widget-summary');
summary.setAttribute('role', 'status');
summary.setAttribute('aria-atomic', 'true');
const exits = node('span', 'split-widget-stat', '0 个出口');
const average = node('span', 'split-widget-stat');
const same = node('span', 'badge', '同一出口');
average.hidden = true;
same.hidden = true;
summary.append(exits, average, same);

const notice = node('details', 'split-widget-notice');
const hosts = [...new Set([...widgetProbes.map(probe => probe.host), new URL(geoEndpoint).hostname])];
notice.append(node('summary', '', '页面加载后会自动连接以下站点…'));
notice.append(node('p', '', hosts.join(' · ')));

const footer = node('div', 'split-widget-footer');
const link = node('a', 'split-widget-link', '查看全部 20 个站点 →');
link.href = '/split/';
footer.append(node('p', 'small', 'HTTP 请求耗时，不是 ICMP Ping'), link);
widget.replaceChildren(header, notice, summary, list, footer);

let results = WIDGET_IDS.map(() => ({status: 'waiting'}));

function renderCard(index) {
  const view = cards[index];
  const result = results[index];
  const pending = result.status === 'waiting' || result.status === 'running';
  const measured = Number.isFinite(result.latency);
  const status = result.status === 'unavailable' && measured ? '仅延迟' : statusLabels[result.status];
  view.card.classList.toggle('is-pending', pending);
  view.latency.classList.toggle('is-measured', measured);
  view.fill.style.width = measured ? `${Math.min(100, Math.max(0, result.latency) / 600 * 100)}%` : '0%';
  text(view.value, measured ? `${Math.round(result.latency)} ms` : missing);
  text(view.location, formatLocation(result) || missing);
  text(view.status, status);
  view.status.title = result.httpStatus ? `HTTP ${result.httpStatus}` : '';
  view.status.classList.toggle('is-success', result.status === 'success');
}

function renderSummary() {
  const {successful, groups} = summarize(results);
  const measured = results.filter(result =>
    result.status === 'success' && Number.isFinite(result.latency));
  text(exits, `${groups.length} 个出口`);
  if (measured.length) {
    const mean = measured.reduce((total, result) => total + result.latency, 0) / measured.length;
    text(average, `平均 ${Math.round(mean)} ms`);
  }
  average.hidden = measured.length === 0;
  same.hidden = Boolean(activeRun) || successful < 2 || groups.length !== 1;
}

function renderControls() {
  const busy = autoPending || Boolean(activeRun);
  list.setAttribute('aria-busy', String(busy));
  stop.disabled = !busy;
  restart.disabled = Boolean(activeRun);
}

function setPendingRows(status) {
  results.forEach((result, index) => {
    if (result.status === 'waiting' || result.status === 'running') {
      results[index] = {status};
      renderCard(index);
    }
  });
}

function cancelAutomaticStart() {
  autoPending = false;
  cancelIdle?.();
  cancelIdle = null;
}

function stopRun() {
  cancelAutomaticStart();
  const run = activeRun;
  activeRun = null;
  run?.abort();
  setPendingRows('stopped');
  renderSummary();
  renderControls();
}

async function startRun() {
  cancelAutomaticStart();
  activeRun?.abort();
  const run = new AbortController();
  activeRun = run;
  results = WIDGET_IDS.map(() => ({status: 'running'}));
  cards.forEach((_, index) => renderCard(index));
  renderSummary();
  renderControls();
  try {
    await runProbes(WIDGET_IDS, {
      signal: run.signal,
      onResult(index, result) {
        if (activeRun !== run || run.signal.aborted) return;
        results[index] = result;
        renderCard(index);
        renderSummary();
      },
    });
  } catch (error) {
    if (activeRun === run && !run.signal.aborted) console.error('Split snapshot failed', error);
  } finally {
    if (activeRun === run) {
      activeRun = null;
      setPendingRows(run.signal.aborted ? 'stopped' : 'failed');
      renderSummary();
      renderControls();
    }
  }
}

function scheduleAutomaticStart() {
  if (!autoPending || cancelIdle || document.hidden) return;
  function startWhenVisible() {
    cancelIdle = null;
    if (autoPending && !document.hidden) void startRun();
  }
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(startWhenVisible, {timeout: 1000});
    cancelIdle = () => window.cancelIdleCallback(id);
  } else {
    const id = window.setTimeout(startWhenVisible, 0);
    cancelIdle = () => window.clearTimeout(id);
  }
}

stop.addEventListener('click', stopRun);
restart.addEventListener('click', () => void startRun());
window.addEventListener('pagehide', stopRun);
document.addEventListener('visibilitychange', scheduleAutomaticStart);
document.addEventListener('ipcha:language', () => {
  cards.forEach((_, index) => renderCard(index));
  renderSummary();
});
cards.forEach((_, index) => renderCard(index));
renderControls();
scheduleAutomaticStart();
