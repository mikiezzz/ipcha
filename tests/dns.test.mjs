import {test} from 'node:test';
import assert from 'node:assert/strict';
import {queryDNS,resolveDomain} from '../dist/dns.js';
const reply=(Answer=[],Status=0)=>Response.json({Status,Answer});
test('blocked Google DNS does not prevent querying any domain through a backup',async()=>{
  const fetchImpl=async url=>{const u=new URL(url);if(u.host==='dns.google')throw new TypeError('Blocked');return reply([{type:1,data:'172.65.197.160'}]);};
  assert.deepEqual((await queryDNS('mc.hypixel.net','A',{fetchImpl})).values,['172.65.197.160']);
  assert.deepEqual((await queryDNS('other.example','A',{fetchImpl})).values,['172.65.197.160']);
});
test('a negative answer from one provider cannot beat positive addresses from another',async()=>{
  const fetchImpl=async url=>new URL(url).host==='dns.alidns.com'?reply([],3):reply([{type:1,data:'203.0.113.8'}]);
  assert.deepEqual((await queryDNS('example.com','A',{fetchImpl})).values,['203.0.113.8']);
});
test('CNAME-only responses are followed, with loop detection',async()=>{
  const fetchImpl=async url=>new URL(url).searchParams.get('name')==='alias.example'?reply([{type:5,data:'server.example.'}]):reply([{type:1,data:'203.0.113.2'}]);
  assert.deepEqual((await queryDNS('alias.example','A',{fetchImpl})).values,['203.0.113.2']);
  await assert.rejects(()=>queryDNS('loop.example','A',{fetchImpl:async()=>reply([{type:5,data:'loop.example.'}])}),/连接失败/);
});
test('IPv4-only and IPv6-only domains resolve successfully',async()=>{
  for(const [type,ip] of [['A','203.0.113.7'],['AAAA','2001:db8::7']]){
    const fetchImpl=async url=>new URL(url).searchParams.get('type')===type?reply([{type:type==='A'?1:28,data:ip}]):reply();
    assert.deepEqual((await resolveDomain('example.com',{fetchImpl})).ips,[ip]);
  }
});
test('an unreachable resolver, NXDOMAIN, no addresses and partial failure have distinct messages',async()=>{
  await assert.rejects(()=>resolveDomain('example.com',{fetchImpl:async()=>{throw new Error('Blocked');}}),/连接失败/);
  await assert.rejects(()=>resolveDomain('missing.example',{fetchImpl:async()=>reply([],3)}),/域名不存在/);
  await assert.rejects(()=>resolveDomain('no-address.example',{fetchImpl:async()=>reply()}),/没有可用/);
  await assert.rejects(()=>resolveDomain('partial.example',{fetchImpl:async url=>{if(new URL(url).searchParams.get('type')==='AAAA')throw new Error('Blocked');return reply();}}),/未完成/);
});
test('valid addresses survive failure of the other IP family, and malformed answers are rejected',async()=>{
  const fetchImpl=async url=>{if(new URL(url).searchParams.get('type')==='AAAA')throw new Error('SERVFAIL');return reply([{type:1,data:'203.0.113.9'},{type:1,data:'999.0.0.1'},{type:1,data:'203.0.113.9'}]);};
  const result=await resolveDomain('example.com',{fetchImpl});assert.deepEqual(result.ips,['203.0.113.9']);assert.equal(result.partial,true);
  await assert.rejects(()=>queryDNS('example.com','A',{fetchImpl:async()=>Response.json({Status:2})}),/连接失败/);
});
test('PTR trailing dots normalize correctly without requiring A records',async()=>{
  assert.deepEqual((await queryDNS('8.8.8.8.in-addr.arpa','PTR',{fetchImpl:async()=>reply([{type:12,data:'dns.google.'}])})).values,['dns.google']);
});
