import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {translate,setLanguage,getLocale} from '../dist/i18n.js';
test('English and Japanese cover visible Chinese page text',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const texts=[...html.matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(t=>/[\u4e00-\u9fff]/.test(t)&&!['中文','日本語','ip查.','ip查'].includes(t));
  for(const language of ['en','ja'])for(const text of texts)assert.notEqual(translate(text,language),text,`${language}: ${text}`);
});
test('parameterized DNS and service errors retain values in translation',()=>{
  assert.match(translate('DNS 解析 · 4 个地址 · 点击切换（CDN 地址可能因地区而异）','en'),/4 addresses/);
  assert.match(translate('数据服务暂时不可用（503），请稍后重试。','ja'),/503/);
  assert.match(translate('未获取到公网归属地：数据服务暂不可用','en'),/^Public geolocation unavailable:/);
  assert.equal(translate('2606:4700:4700::1111','ja'),'2606:4700:4700::1111');
});
test('language changes validate preferences and allow returning to Chinese',()=>{
  assert.equal(setLanguage('en'),true);assert.equal(getLocale(),'en');
  assert.equal(translate('城市'),'City');assert.equal(setLanguage('invalid'),false);assert.equal(getLocale(),'en');
  setLanguage('ja');assert.equal(translate('城市'),'都市');setLanguage('zh-CN');assert.equal(translate('城市'),'城市');
});
