import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyAddress,inRange} from '../dist/address-info.js';
import {queryDNS} from '../dist/dns.js';
test('Cloudflare edge addresses identify anycast using a specific official range',()=>{
  for(const ip of ['172.65.197.160','104.16.0.1','2606:4700::1']){const result=classifyAddress(ip);assert.equal(result.kind,'anycast');assert.equal(result.provider,'Cloudflare');assert.ok(result.range);assert.equal(result.originIp,undefined);}
});
test('CIDR boundaries and compressed IPv6 compare correctly',()=>{
  assert.equal(inRange('172.63.255.255','172.64.0.0/13'),false);assert.equal(inRange('172.71.255.255','172.64.0.0/13'),true);assert.equal(inRange('172.72.0.0','172.64.0.0/13'),false);
  assert.equal(inRange('2606:4700:ffff:ffff::1','2606:4700::/32'),true);assert.equal(inRange('2606:4701::1','2606:4700::/32'),false);assert.equal(inRange('1.1.1.1','::/0'),false);
});
test('public DNS anycast services do not claim a hidden origin, and unknown is not unicast',()=>{
  const result=classifyAddress('8.8.8.8');assert.equal(result.kind,'anycast');assert.equal(result.role,'service');assert.equal(result.originIp,undefined);
  assert.equal(classifyAddress('203.0.113.10').kind,'unknown');
});
test('broadcast, multicast and anycast are not conflated; .255 alone proves nothing',()=>{
  assert.equal(classifyAddress('255.255.255.255').kind,'broadcast');assert.equal(classifyAddress('224.0.0.1').kind,'multicast');assert.equal(classifyAddress('ff02::1').kind,'multicast');assert.equal(classifyAddress('203.0.113.255').kind,'unknown');
});
test('public CNAME traces preserve inline and subsequent aliases without inventing an origin',async()=>{
  const fetchImpl=async url=>{const name=new URL(url).searchParams.get('name');return Response.json({Status:0,Answer:name==='a.example'?[{name,type:5,data:'b.example.'}]:[{name:'b.example.',type:5,data:'c.example.'},{name:'c.example.',type:1,data:'203.0.113.1'}]});};
  const result=await queryDNS('a.example','A',{fetchImpl});assert.deepEqual(result.chain,['a.example','b.example','c.example']);assert.deepEqual(result.values,['203.0.113.1']);assert.equal(result.originIp,undefined);
});
