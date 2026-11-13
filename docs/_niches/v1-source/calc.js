const N=require('./niches.js'),S=require('./sectors.js');
const W=[15,10,10,8,8,18,12,6,8,5];
const doms={};S.forEach(s=>s.dom.forEach(d=>doms[d[0]]=s.id));
const out=N.map(n=>{const s=n[3].split('').map(Number);if(s.length!==10)console.log('BAD',n[1]);const sc=s.reduce((a,v,i)=>a+W[i]*(v-1)/4,0);const k=n[2].split(' | ');if(k.length<2||k.length>5)console.log('SK',n[1],k.length);if(!doms[n[0]])console.log('DOM',n[0]);return {n:n[1],sec:doms[n[0]],sc,ko:n[6].ko,w:!!n[6].w}});
console.log('total',out.length);
const bySec={};out.forEach(o=>bySec[o.sec]=(bySec[o.sec]||0)+1);console.log(bySec);
const domc={};N.forEach(n=>domc[n[0]]=(domc[n[0]]||0)+1);console.log(Object.entries(domc).filter(([k,v])=>v<2||v>4));
out.sort((a,b)=>b.sc-a.sc);out.slice(0,25).forEach((o,i)=>console.log(i+1,o.sc.toFixed(1),o.n,o.sec,o.ko?'KO':'',o.w?'':'NO-WHY'));
const h=[0,0,0,0,0,0,0,0,0,0];out.forEach(o=>h[Math.floor(o.sc/10)]++);console.log('hist',h);
