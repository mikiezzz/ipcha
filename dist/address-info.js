import ranges from './anycast-ranges.js';
import {ipType} from './network.js';
function numericIP(ip){
  const type=ipType(ip);if(!type)return null;
  if(type==='IPv4')return {bits:32,value:ip.split('.').reduce((v,n)=>(v<<8n)|BigInt(n),0n)};
  let value=new URL(`http://[${ip}]`).hostname.slice(1,-1),sides=value.split('::'),left=sides[0]?sides[0].split(':'):[],right=sides[1]?sides[1].split(':'):[];
  const words=sides.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
  return {bits:128,value:words.reduce((v,n)=>(v<<16n)|BigInt('0x'+n),0n)};
}
export function inRange(ip,cidr){
  const [network,prefix]=cidr.split('/'),address=numericIP(ip),base=numericIP(network),n=Number(prefix);
  if(!address||!base||address.bits!==base.bits||!Number.isInteger(n)||n<0||n>base.bits)return false;
  const shift=BigInt(base.bits-n);return address.value>>shift===base.value>>shift;
}
const services=[
  {ips:['1.1.1.1','1.0.0.1','2606:4700:4700::1111','2606:4700:4700::1001'],provider:'Cloudflare DNS',source:'https://developers.cloudflare.com/1.1.1.1/ip-addresses/'},
  {ips:['8.8.8.8','8.8.4.4','2001:4860:4860::8888','2001:4860:4860::8844'],provider:'Google Public DNS',source:'https://developers.google.com/speed/public-dns/docs/using'},
];
export function classifyAddress(ip){
  if(ip==='255.255.255.255')return {kind:'broadcast',evidence:'limited-broadcast'};
  if(inRange(ip,'224.0.0.0/4')||inRange(ip,'ff00::/8'))return {kind:'multicast'};
  for(const service of services)if(service.ips.some(value=>inRange(ip,`${value}/${ipType(value)==='IPv4'?32:128}`)))return {kind:'anycast',role:'service',provider:service.provider,source:service.source,updated:ranges.updated};
  const match=ranges.ranges.find(cidr=>inRange(ip,cidr));
  if(match)return {kind:'anycast',role:'edge',provider:ranges.provider,range:match,source:ranges.source,updated:ranges.updated};
  return {kind:'unknown'};
}
