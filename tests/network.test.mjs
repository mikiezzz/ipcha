import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readConnection,detectAddress} from '../dist/network.js';
test('rechecking observes changed connection IP and never reuses a cached request',async()=>{
  const calls=[];const values=['203.0.113.1','198.51.100.8'];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return new Response(`ip=${values.shift()}\nloc=HK\n`);};
  assert.equal((await readConnection({fetchImpl})).ip,'203.0.113.1');
  assert.equal((await readConnection({fetchImpl})).ip,'198.51.100.8');
  assert.notEqual(calls[0].url,calls[1].url);
  for(const {options} of calls)assert.equal(options.cache,'no-store');
});
test('same-origin IP succeeds with all external services unavailable',async()=>{
  const connection=readConnection({fetchImpl:async()=>new Response('ip=203.0.113.9\nloc=CN\n')});
  let externalCalls=0;
  const result=await detectAddress('IPv4',connection,{fetchImpl:async()=>{externalCalls++;throw new Error('Blocked');}});
  assert.equal(result.ip,'203.0.113.9');assert.equal(externalCalls,0);
});
test('one failed detector does not hide a successful backup',async()=>{
  const connection=Promise.reject(new Error('Unavailable'));
  const result=await detectAddress('IPv4',connection,{fetchImpl:async url=>{if(url.includes('ipify'))throw new Error('Blocked');return new Response('198.51.100.5\n');}});
  assert.equal(result.ip,'198.51.100.5');
});
test('IPv4 response cannot be mislabelled as IPv6; all failures reject',async()=>{
  await assert.rejects(()=>detectAddress('IPv6',Promise.resolve({ip:'203.0.113.1',type:'IPv4'}),{fetchImpl:async()=>new Response('203.0.113.1')}),AggregateError);
  await assert.rejects(()=>readConnection({fetchImpl:async()=>new Response('<html>not a trace</html>')}));
});
