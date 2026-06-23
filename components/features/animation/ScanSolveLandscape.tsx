/* eslint-disable */
// @ts-nocheck
'use client';
import React from 'react';
import { Easing, clamp, interpolate, Sprite, useTime, EmbedStage } from './engine';

/* ===================== ScanSolve — 3-stage explainer ===================== */
/* Appended after the animation engine (Stage, Sprite, Easing, clamp, interpolate,
   useSprite, useTime are all in module scope). */

const FONT = "var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const C = {
  bg1:'#F5F4FC', bg2:'#E2E1F6', wall:'#EFEFFA', floor:'#DAD8EE',
  ink:'#15162C', inkSoft:'#5C6076', inkFaint:'#9A9FB3',
  violet:'#6B5BE6', violetDeep:'#5645CC', violetSoft:'#ECEAFB', violetLine:'#D8D4F4',
  green:'#1FA66B', greenSoft:'#E1F5EC',
  white:'#FFFFFF', pill:'#EFEFF5', line:'#ECECF3',
  amber:'#F2B33C',
};
const tween = (lt, a, b, from, to, ease=Easing.easeInOutCubic) =>
  interpolate([a,b],[from,to],ease)(lt);
const pop = (lt, at, dur=0.5) => Easing.easeOutBack(clamp((lt-at)/dur,0,1));
const fadeIn = (lt, at, dur=0.4) => clamp((lt-at)/dur,0,1);

/* ---- scene enter/exit transform ---- */
function sceneFx(lt, duration, dist=180){
  const inD=0.75, outD=0.7, outStart=duration-outD;
  let x=0,o=1,s=1;
  if(lt<inD){ const t=Easing.easeOutCubic(clamp(lt/inD,0,1)); x=(1-t)*dist; o=t; s=0.985+0.015*t; }
  else if(lt>outStart){ const t=Easing.easeInCubic(clamp((lt-outStart)/outD,0,1)); x=-t*dist; o=1-t; s=1-0.02*t; }
  return { transform:`translateX(${x}px) scale(${s})`, opacity:o, willChange:'transform,opacity' };
}

/* ============================ Shared atoms ============================ */
function QRTile({size=84, radius=20, light=0}){
  // ScanSolve logo image (violet QR tile)
  return (
    <img src="/scansolve-anim-logo.png" alt="ScanSolve" style={{
      width:size, height:size, objectFit:'contain', display:'block', borderRadius:Math.min(radius, size*0.24),
      filter:`drop-shadow(0 ${size*0.12}px ${size*0.26}px rgba(86,69,204,${0.34+light*0.25}))`,
    }}/>
  );
}

function QRPoster({lit=0}){
  const n=11;
  const on=(r,c)=>{
    const f=(R,C)=> r>=R&&r<R+3&&c>=C&&c<C+3;
    for(const [R,C] of [[0,0],[0,n-3],[n-3,0]]){
      if(f(R,C)){ const rr=r-R, cc=c-C; return rr===0||rr===2||cc===0||cc===2||(rr===1&&cc===1); }
    }
    return ((r*3 + c*7 + ((r*c)%5)) % 3) === 0;
  };
  const cells=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++) if(on(r,c)) cells.push([r,c]);
  const g=120/n;
  return (
    <div style={{width:184, background:'#fff', borderRadius:18, padding:'18px 18px 16px',
      boxShadow:'0 18px 40px -16px rgba(40,40,90,0.35)', textAlign:'center',
      border:`1px solid ${C.line}`, position:'relative'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginBottom:12}}>
        <QRTile size={22} radius={7}/>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:15, color:C.ink, letterSpacing:'-0.01em'}}>ScanSolve</div>
      </div>
      <div style={{position:'relative', width:120, height:120, margin:'0 auto', borderRadius:10, overflow:'hidden'}}>
        {cells.map(([r,c],i)=>(
          <div key={i} style={{position:'absolute', left:c*g, top:r*g, width:g, height:g, background:C.ink}}/>
        ))}
        {/* scan sweep */}
        <div style={{position:'absolute', left:0, right:0, top:`${lit*100}%`, height:3,
          background:'rgba(107,91,230,0.9)', boxShadow:'0 0 14px 4px rgba(107,91,230,0.6)',
          opacity: lit>0 && lit<1 ? 1:0}}/>
      </div>
      <div style={{fontFamily:FONT, fontWeight:700, fontSize:12.5, color:C.inkSoft, marginTop:11, letterSpacing:'0.02em'}}>
        Spot a problem? Scan me
      </div>
    </div>
  );
}

/* ---- ambient life: blink + drifting particles ---- */
function blinkAmt(t){ const p=((t%3.4)+3.4)%3.4; return p<0.14 ? Math.sin((p/0.14)*Math.PI) : 0; }
function Particles({t=0, color='rgba(107,91,230,0.12)', count=16, seed=1, blur=2}){
  const items=[];
  for(let i=0;i<count;i++){
    const hx=((i*97+seed*53)%100)/100, hy=((i*61+seed*29)%100)/100;
    const sz=7+((i*seed)%5)*4;
    const x=hx*1300-20 + Math.sin(t*0.34+i*1.7)*16;
    const y=((hy*760-20) - (t*10+i*40)%820 + 820)%820 - 20;
    items.push(<div key={i} style={{position:'absolute', left:x, top:y, width:sz, height:sz, borderRadius:'50%',
      background:color, filter:`blur(${blur}px)`, opacity:0.5+0.5*Math.sin(t*0.6+i)}}/>);
  }
  return <div style={{position:'absolute', inset:0, pointerEvents:'none'}}>{items}</div>;
}

/* ---- detailed cartoon repair worker (CSS) ---- */
function RepairWorker({reachT=0, t=0, scale=1, cheer=0, style={}}){
  const eo = 1-blinkAmt(t);                 // eye open
  const breathe = Math.sin(t*1.7);
  const sk='#F0C29A', skL='#FAD9B6', skS='#DBA078';
  const hairC='#6E4A2C', hairL='#8C6238';
  const shirt='#5588C2', shirtD='#46739F', sleeve='#6E9AD0';
  const belt='#3B3327', buckle='#CBA64E';
  const armRot = -10 - reachT*120;
  const Eye = ({left})=>(
    <div style={{position:'absolute', top:55, [left?'left':'right']:32, width:25, height:Math.max(3,27*eo),
      background:'#fff', borderRadius:'50%', overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.12)'}}>
      <div style={{position:'absolute', top:'54%', left: left?'58%':'42%', transform:'translate(-50%,-50%)', width:15, height:15, background:'#6B4A2C', borderRadius:'50%'}}>
        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:7, height:7, background:'#1E1712', borderRadius:'50%'}}/>
        <div style={{position:'absolute', top:2, left:2, width:5, height:5, background:'#fff', borderRadius:'50%'}}/>
      </div>
    </div>
  );
  return (
    <div style={{position:'absolute', transformOrigin:'bottom center',
      transform:`scale(${scale}) translateY(${breathe*1.2 - cheer*6}px)`, ...style}}>
      <div style={{position:'relative', width:150, height:300}}>
        {/* legs + boots */}
        <div style={{position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)', width:104, height:72}}>
          <div style={{position:'absolute', left:6, bottom:8, width:40, height:64, background:'#3A4254', borderRadius:'14px 14px 8px 8px'}}/>
          <div style={{position:'absolute', right:6, bottom:8, width:40, height:64, background:'#333B4C', borderRadius:'14px 14px 8px 8px'}}/>
          <div style={{position:'absolute', left:-2, bottom:-4, width:50, height:20, background:'#2A2018', borderRadius:'10px 13px 7px 7px'}}/>
          <div style={{position:'absolute', right:-2, bottom:-4, width:50, height:20, background:'#241B14', borderRadius:'13px 10px 7px 7px'}}/>
        </div>
        {/* torso */}
        <div style={{position:'absolute', left:'50%', bottom:58, transform:'translateX(-50%)', width:116, height:128,
          background:`linear-gradient(150deg, ${sleeve}, ${shirt} 55%, ${shirtD})`, borderRadius:'42px 42px 24px 24px',
          boxShadow:'inset 0 -10px 0 rgba(0,0,0,0.08)'}}>
          <div style={{position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', width:44, height:22, background:shirtD, clipPath:'polygon(0 0,100% 0,50% 100%)'}}/>
          <div style={{position:'absolute', top:26, left:'50%', transform:'translateX(-50%)', width:3, height:66, background:'rgba(0,0,0,0.10)'}}/>
          <div style={{position:'absolute', top:42, left:16, width:36, height:20, background:'#fff', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 2px rgba(0,0,0,0.12)'}}>
            <div style={{width:14, height:5, background:C.violet, borderRadius:3, transform:'rotate(-38deg)'}}/>
          </div>
        </div>
        {/* tool belt */}
        <div style={{position:'absolute', left:'50%', bottom:54, transform:'translateX(-50%)', width:122, height:18, background:belt, borderRadius:6, boxShadow:'0 2px 5px rgba(0,0,0,0.18)'}}>
          <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:18, height:12, background:buckle, borderRadius:3}}/>
          <div style={{position:'absolute', left:12, top:14, width:9, height:22, background:'#7A6E58', borderRadius:3}}/>
          <div style={{position:'absolute', right:14, top:14, width:11, height:26, background:'#6E7488', borderRadius:3}}/>
        </div>
        {/* left arm */}
        <div style={{position:'absolute', left:0, bottom:98, width:30, height:78, background:shirt, borderRadius:16,
          transformOrigin:'top center', transform:`rotate(${10 + breathe*1.6}deg)`}}>
          <div style={{position:'absolute', bottom:-7, left:'50%', transform:'translateX(-50%)', width:24, height:24, background:sk, borderRadius:'50%'}}/>
        </div>
        {/* right arm (reaches up with wrench) */}
        <div style={{position:'absolute', right:0, bottom:102, width:30, height:80, background:sleeve, borderRadius:16,
          transformOrigin:'top center', transform:`rotate(${armRot}deg)`}}>
          <div style={{position:'absolute', top:30, left:-3, right:-3, height:14, background:'#84A9D8', borderRadius:8}}/>
          <div style={{position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', width:26, height:26, background:sk, borderRadius:'50%'}}>
            <div style={{position:'absolute', top:-34, left:5, width:10, height:42, background:'#9AA0B2', borderRadius:4, transform:'rotate(6deg)'}}>
              <div style={{position:'absolute', top:-9, left:-5, width:20, height:16, background:'#B7BCCB', borderRadius:'6px 6px 3px 3px'}}/>
            </div>
          </div>
        </div>
        {/* head */}
        <div style={{position:'absolute', left:'50%', bottom:166, transform:'translateX(-50%)', width:124, height:120}}>
          <div style={{position:'absolute', bottom:-14, left:'50%', transform:'translateX(-50%)', width:34, height:30, background:skS, borderRadius:'10px 10px 8px 8px'}}/>
          <div style={{position:'absolute', top:52, left:-6, width:22, height:30, background:sk, borderRadius:'50%', boxShadow:'inset -2px 0 0 rgba(0,0,0,0.08)'}}/>
          <div style={{position:'absolute', top:52, right:-6, width:22, height:30, background:sk, borderRadius:'50%', boxShadow:'inset 2px 0 0 rgba(0,0,0,0.08)'}}/>
          <div style={{position:'absolute', inset:0, borderRadius:'48% 48% 46% 46% / 50% 50% 62% 62%',
            background:`radial-gradient(120% 110% at 38% 26%, ${skL}, ${sk} 56%, ${skS} 100%)`,
            boxShadow:'inset -7px -8px 16px rgba(180,120,80,0.20)'}}/>
          {/* side hair */}
          <div style={{position:'absolute', top:22, left:-3, width:24, height:50, background:hairC, borderRadius:'16px 6px 6px 16px'}}/>
          <div style={{position:'absolute', top:22, right:-3, width:24, height:50, background:hairC, borderRadius:'6px 16px 16px 6px'}}/>
          {/* quiff (hero hair) */}
          <div style={{position:'absolute', top:-12, left:2, right:2, height:52, background:hairC, borderRadius:'46% 46% 40% 40% / 72% 72% 28% 28%'}}/>
          <div style={{position:'absolute', top:-26, left:26, width:54, height:36, background:hairC, borderRadius:'62% 40% 50% 50% / 80% 60% 40% 40%', transform:'rotate(-13deg)'}}/>
          <div style={{position:'absolute', top:-22, left:58, width:42, height:30, background:hairL, borderRadius:'60% 50% 50% 50%', transform:'rotate(12deg)'}}/>
          <div style={{position:'absolute', top:4, left:26, width:52, height:9, background:hairL, borderRadius:8, opacity:0.45}}/>
          {/* brows */}
          <div style={{position:'absolute', top:45, left:26, width:25, height:7, background:hairC, borderRadius:6, transform:'rotate(-9deg)'}}/>
          <div style={{position:'absolute', top:45, right:26, width:25, height:7, background:hairC, borderRadius:6, transform:'rotate(9deg)'}}/>
          <Eye left={true}/>
          <Eye left={false}/>
          {/* nose */}
          <div style={{position:'absolute', top:75, left:'50%', transform:'translateX(-50%)', width:14, height:12, background:skS, borderRadius:'50% 50% 60% 60%', opacity:0.85}}/>
          {/* cheeks */}
          <div style={{position:'absolute', top:84, left:21, width:18, height:11, background:'rgba(231,131,111,0.32)', borderRadius:'50%'}}/>
          <div style={{position:'absolute', top:84, right:21, width:18, height:11, background:'rgba(231,131,111,0.32)', borderRadius:'50%'}}/>
          {/* mouth */}
          <div style={{position:'absolute', top:92, left:'50%', transform:`translateX(-50%) scaleY(${1+cheer*0.25})`, width:38, height:18, background:'#7C3B36', borderRadius:'10px 10px 22px 22px', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:7, background:'#fff'}}/>
            <div style={{position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:18, height:7, background:'#C85A52', borderRadius:'8px 8px 4px 4px'}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- phone in camera/scan mode ---- */
function ScanPhone({sweep=0, captured=false, w=210, style={}}){
  const h=w*2.05;
  const br = captured ? C.green : C.violet;
  return (
    <div style={{position:'absolute', width:w, height:h, borderRadius:34, background:'#15162C', padding:9,
      boxShadow:'0 30px 60px -20px rgba(40,30,90,0.5)', ...style}}>
      <div style={{width:'100%', height:'100%', borderRadius:26, overflow:'hidden', background:'#0E0F1E', position:'relative'}}>
        <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:60, height:6, background:'#000', borderRadius:4, zIndex:3}}/>
        {/* viewfinder */}
        <div style={{position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% 38%, #2A2B45, #0E0F1E)'}}/>
        <div style={{position:'absolute', top:'34%', left:'50%', transform:'translate(-50%,-50%)', width:118, height:118}}>
          {/* real ScanSolve QR being scanned */}
          <div style={{width:104, height:104, margin:'0 auto', background:'#fff', borderRadius:6, padding:5, boxShadow:'0 4px 14px rgba(0,0,0,0.4)'}}>
            <img src="/scansolve-anim-qr.png" alt="QR" style={{display:'block', width:'100%', height:'100%', objectFit:'contain', filter: captured?'none':'grayscale(0.1)'}}/>
          </div>
          {/* corner brackets */}
          {[[0,0],[1,0],[0,1],[1,1]].map(([rx,ry],i)=>(
            <div key={i} style={{position:'absolute', [ry?'right':'left']:-10, [rx?'bottom':'top']:-10, width:22, height:22,
              borderTop: rx?'none':`3px solid ${br}`, borderBottom: rx?`3px solid ${br}`:'none',
              borderLeft: ry?'none':`3px solid ${br}`, borderRight: ry?`3px solid ${br}`:'none', borderRadius:3}}/>
          ))}
          {/* scan sweep line */}
          {!captured && <div style={{position:'absolute', left:-6, right:-6, top:`${sweep*100}%`, height:3, background:br,
            boxShadow:`0 0 14px 3px ${br}`, borderRadius:3}}/>}
        </div>
        <div style={{position:'absolute', bottom:34, left:0, right:0, textAlign:'center', fontFamily:FONT, fontWeight:700,
          fontSize:13, color: captured?C.green:'#CFCBEC'}}>{captured?'✓  QR detected':'Scanning…'}</div>
      </div>
    </div>
  );
}

/* ---- Phone with survey ---- */
function PhoneSurvey({reveal=1, w=242, style={}}){
  const h=w*2.05;
  const chips=['Appliance Malfunction','Plumbing Issue','Cleaning Required','Broken Cabinet','Lighting Failure','Refrigerator'];
  const selIdx=4;
  const chipOn=(i)=>clamp((reveal*7) - 2 - i*0.45, 0, 1);
  const Chip=({label,i})=>{
    const o=chipOn(i); const sel=i===selIdx && reveal>0.92;
    return (
      <div style={{flex:'0 0 calc(50% - 4px)', background:'#fff', borderRadius:11, padding:'9px 10px',
        fontFamily:FONT, fontWeight:700, fontSize:9.5, color:sel?C.violetDeep:C.ink,
        border:`1.5px solid ${sel?C.violet:'#fff'}`, opacity:o, transform:`translateY(${(1-o)*8}px)`,
        boxShadow: sel?'0 4px 12px -4px rgba(107,91,230,0.5)':'0 2px 6px rgba(60,60,110,0.06)',
        lineHeight:1.15, transition:'none'}}>{label}</div>
    );
  };
  return (
    <div style={{position:'absolute', width:w, height:h, borderRadius:34, background:'#1B1C2E',
      padding:9, boxShadow:'0 30px 60px -20px rgba(40,30,90,0.5)', ...style}}>
      <div style={{width:'100%', height:'100%', borderRadius:26, overflow:'hidden',
        background:`linear-gradient(170deg, #F3F2FC, #E4E3F7)`, position:'relative'}}>
        <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:64, height:6, background:'#1B1C2E', borderRadius:4}}/>
        <div style={{padding:'26px 15px 14px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, opacity:fadeIn(reveal,0.02,0.2)}}>
            <QRTile size={17} radius={6}/>
            <div style={{fontFamily:FONT, fontWeight:700, fontSize:9.5, color:C.inkSoft}}>📍 Third floor kitchen</div>
          </div>
          <div style={{fontFamily:FONT, fontWeight:800, fontSize:18, color:C.ink, marginTop:6, opacity:fadeIn(reveal,0.06,0.2)}}>Report an Issue</div>
          <div style={{fontFamily:FONT, fontWeight:800, fontSize:8.5, letterSpacing:'0.08em', color:C.inkFaint, marginTop:13, opacity:fadeIn(reveal,0.12,0.2)}}>WHAT TYPE OF ISSUE?</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:8}}>
            {chips.map((c,i)=><Chip key={i} label={c} i={i}/>)}
          </div>
          <div style={{marginTop:13, background:'#fff', borderRadius:13, padding:'11px 12px',
            opacity:clamp(reveal*7-5,0,1), transform:`translateY(${(1-clamp(reveal*7-5,0,1))*10}px)`,
            boxShadow:'0 2px 8px rgba(60,60,110,0.06)'}}>
            <div style={{fontFamily:FONT, fontWeight:800, fontSize:8, letterSpacing:'0.06em', color:C.inkFaint}}>DESCRIPTION</div>
            <div style={{fontFamily:FONT, fontSize:10.5, color:C.inkFaint, marginTop:7, height:26}}>Ceiling light won't turn on…</div>
          </div>
          <div style={{marginTop:10, border:`1.5px dashed ${C.violetLine}`, borderRadius:12, padding:'13px',
            textAlign:'center', fontFamily:FONT, fontWeight:700, fontSize:10, color:C.violet,
            opacity:clamp(reveal*7-5.6,0,1)}}>📷 Tap to add a photo</div>
        </div>
      </div>
    </div>
  );
}

/* ---- Monitor + dashboard ---- */
function Dashboard({rows, reveal, resolvedIdx=-1, hoverIdx=-1, openCount=null, newIdx=-1, t=0}){
  const StatusPill=({s})=>{
    const r=s==='Resolved';
    return <span style={{fontFamily:FONT, fontWeight:700, fontSize:10, padding:'2px 8px', borderRadius:20,
      color:r?C.green:C.inkSoft, background:r?C.greenSoft:C.pill}}>{s}</span>;
  };
  return (
    <div style={{width:'100%', height:'100%', background:`linear-gradient(165deg,#F6F5FC,#E9E8F8)`, position:'relative', overflow:'hidden'}}>
      {/* top bar */}
      <div style={{display:'flex', alignItems:'center', gap:9, padding:'12px 16px', background:'rgba(255,255,255,0.6)', borderBottom:`1px solid ${C.line}`, opacity:fadeIn(reveal,0,0.2)}}>
        <QRTile size={22} radius={7}/>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:14, color:C.ink}}>ScanSolve</div>
        <div style={{fontFamily:FONT, fontWeight:600, fontSize:11, color:C.inkFaint}}>Org #1002</div>
        <div style={{marginLeft:'auto', display:'flex', gap:14, fontFamily:FONT, fontWeight:600, fontSize:11, color:C.inkSoft}}>
          <span>Labels</span><span>Insights</span><span>Billing</span><span>Settings</span>
        </div>
      </div>
      <div style={{padding:'14px 18px'}}>
        <div style={{display:'flex', alignItems:'center', opacity:fadeIn(reveal,0.1,0.25)}}>
          <div style={{fontFamily:FONT, fontWeight:800, fontSize:21, color:C.ink}}>Issues</div>
          <div style={{marginLeft:'auto', fontFamily:FONT, fontWeight:700, fontSize:11, color:'#fff', whiteSpace:'nowrap', lineHeight:1,
            background:C.violet, padding:'5px 12px', borderRadius:20, transform:`scale(${pop(reveal,0.35,0.5) * (newIdx>=0 && t>3.8 && t<4.3 ? 1.18 : 1)})`}}>
            {openCount!=null ? openCount : Math.max(1,rows.filter(r=>(r.status!=='Resolved')).length)} open
          </div>
        </div>
        <div style={{display:'flex', gap:7, marginTop:11, opacity:fadeIn(reveal,0.2,0.25)}}>
          {['All','Reported','Assigned','In Progress','Resolved'].map((f,i)=>(
            <div key={i} style={{fontFamily:FONT, fontWeight:700, fontSize:10.5, padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap', lineHeight:1,
              color:i===0?'#fff':C.inkSoft, background:i===0?C.violet:'#fff', border:i===0?'none':`1px solid ${C.line}`}}>{f}</div>
          ))}
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:9, marginTop:13}}>
          {rows.map((row,i)=>{
            const isNew = i===newIdx;
            const o= isNew ? Easing.easeOutBack(clamp((t-3.6)/0.7,0,1)) : clamp(reveal*5 - 1.3 - i*0.55, 0, 1);
            const resolved = i===resolvedIdx;
            const hov = i===hoverIdx;
            const glow = isNew ? clamp(1-(t-3.8)/1.6,0,1) : 0;
            return (
              <div key={i} style={{display:'flex', alignItems:'center', gap:12, background:'#fff', borderRadius:14,
                padding:'12px 15px', boxShadow: hov?'0 10px 24px -10px rgba(90,73,204,0.4)': glow>0?`0 0 0 ${2+glow*2}px rgba(107,91,230,${0.25*glow}), 0 8px 20px -10px rgba(90,73,204,0.35)`:'0 2px 10px rgba(60,60,110,0.05)',
                opacity:o, transform:`translateX(${(1-o)* (isNew?0:30)}px) translateY(${isNew?(1-o)*-22:0}px) scale(${hov?1.015:1})`,
                border:`1px solid ${hov||glow>0?C.violetLine:'transparent'}`}}>
                <div style={{width:34, height:34, borderRadius:11, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background: resolved?C.greenSoft:C.pill, color: resolved?C.green:C.inkFaint, fontWeight:800, fontFamily:FONT, fontSize:16}}>
                  {resolved?'✓':'!'}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, lineHeight:1, whiteSpace:'nowrap'}}>
                    <span style={{fontFamily:FONT, fontWeight:800, fontSize:13.5, color:C.ink, lineHeight:1}}>{row.title}</span>
                    <span style={{width:5, height:5, borderRadius:'50%', flexShrink:0, background: resolved?C.green:C.inkFaint, display:'inline-block'}}/>
                    <span style={{fontFamily:FONT, fontWeight:700, fontSize:11, color: resolved?C.green:C.inkSoft, lineHeight:1}}>{resolved?'Resolved':row.status}</span>
                    {isNew && t>3.7 && (
                      <span style={{fontFamily:FONT, fontWeight:800, fontSize:9.5, color:'#fff', background:C.violet, padding:'3px 7px', borderRadius:20, lineHeight:1, opacity:clamp(1-(t-5.4)/1.0,0,1)}}>NEW</span>
                    )}
                  </div>
                  <div style={{fontFamily:FONT, fontWeight:600, fontSize:11, color:C.inkFaint, marginTop:7, lineHeight:1, whiteSpace:'nowrap'}}>{row.loc} · {row.time}</div>
                </div>
                <div style={{color:C.inkFaint, fontSize:16}}>›</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Wall bulb fixture ---- */
function Bulb({on=0}){
  const rays=[];
  for(let i=0;i<8;i++){
    rays.push(<div key={i} style={{position:'absolute', left:'50%', top:'50%', width:4, height:26,
      background:C.amber, borderRadius:3, transformOrigin:'center -10px',
      transform:`translate(-50%,-50%) rotate(${i*45}deg) translateY(-30px) scaleY(${on})`, opacity:on}}/>);
  }
  return (
    <div style={{position:'relative', width:80, height:120}}>
      <div style={{position:'absolute', left:'50%', top:0, transform:'translateX(-50%)', width:10, height:34, background:'#9A9FB3', borderRadius:3}}/>
      <div style={{position:'absolute', left:'50%', top:30, transform:'translateX(-50%)', width:22, height:14, background:'#B9B4A2', borderRadius:'3px 3px 0 0'}}/>
      <div style={{position:'absolute', left:'50%', top:42, transform:'translateX(-50%)', width:54, height:54, borderRadius:'50% 50% 48% 48%',
        background: on>0.5 ? `radial-gradient(circle at 50% 40%, #FFF6D6, ${C.amber})` : '#E6E4F0',
        boxShadow: on>0.5 ? `0 0 ${28*on}px ${10*on}px rgba(242,179,60,0.55)` : 'inset 0 -4px 0 rgba(0,0,0,0.05)',
        transition:'none'}}/>
      <div style={{position:'absolute', left:'50%', top:74, transform:'translateX(-50%)', width:36, height:50}}>
        {rays}
      </div>
    </div>
  );
}

/* ---- floating mini "Resolved" card ---- */
function ResolvedCard({s=1}){
  return (
    <div style={{position:'absolute', display:'flex', alignItems:'center', gap:11, background:'#fff', borderRadius:16,
      padding:'13px 18px', boxShadow:'0 22px 50px -18px rgba(31,166,107,0.5)', transform:`scale(${s})`, transformOrigin:'center'}}>
      <div style={{width:40, height:40, borderRadius:12, background:C.greenSoft, color:C.green, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, fontWeight:800, fontSize:22}}>✓</div>
      <div>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:15, color:C.ink}}>Lighting Failure</div>
        <div style={{fontFamily:FONT, fontWeight:700, fontSize:12, color:C.green, marginTop:2}}>Resolved · Third floor kitchen</div>
      </div>
    </div>
  );
}

/* =============================== SCENES =============================== */

function Intro(){
  return <Sprite start={0} end={3.5}>{({localTime:lt, duration})=>{
    const fx = sceneFx(lt, duration, 0);
    const build = clamp(lt/0.9,0,1);
    return (
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:22, ...fx}}>
        <div style={{transform:`scale(${pop(lt,0.1,0.7)})`}}><QRTile size={120} radius={30} light={build}/></div>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:54, color:C.ink, letterSpacing:'-0.02em',
          opacity:fadeIn(lt,0.5,0.4), transform:`translateY(${(1-fadeIn(lt,0.5,0.4))*14}px)`}}>ScanSolve</div>
        <div style={{fontFamily:FONT, fontWeight:600, fontSize:21, color:C.inkSoft, opacity:fadeIn(lt,0.85,0.4)}}>
          One scan from problem to fixed.
        </div>
      </div>
    );
  }}</Sprite>;
}

function ScanScene(){
  return <Sprite start={3.3} end={11.8}>{({localTime:lt, duration})=>{
    const fx = sceneFx(lt, duration);
    const cam = tween(lt, 0, duration, 1, 1.045, Easing.linear);
    const riseT = Easing.easeOutBack(clamp((lt-0.5)/1.1,0,1));
    const phoneY = (1-riseT)*460;
    const bob = lt>1.6 ? Math.sin((lt-1.6)*1.9)*5 : 0;
    const sweep = clamp((lt-1.5)/1.0, 0, 1);
    const captured = lt>2.6;
    const shake = (lt>2.6 && lt<3.0) ? Math.sin(lt*90)*4 : 0;
    const surveyIn = Easing.easeOutCubic(clamp((lt-3.0)/0.7,0,1));
    const reveal = clamp((lt-3.5)/3.2, 0, 1);
    const tapShow = lt>6.2 && lt<7.4;
    const posterLit = captured ? 1 : sweep;
    const flickPhase = Math.sin(lt*7.3) + Math.sin(lt*17.1)*0.6 + Math.sin(lt*31.7)*0.35;
    const bulbFlick = flickPhase > 0.15 ? (0.85 + 0.12*Math.sin(lt*55)) : 0.07;
    return (
      <div style={{position:'absolute', inset:0, ...fx}}>
        <div style={{position:'absolute', inset:0, transform:`scale(${cam})`, transformOrigin:'50% 46%'}}>
          {/* room */}
          <div style={{position:'absolute', inset:0, background:`linear-gradient(180deg, #F1F0FB, ${C.wall})`}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:0, height:150, background:C.floor}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:150, height:2, background:'rgba(80,70,140,0.08)'}}/>
          <Particles t={lt} count={14} blur={3}/>
          {/* flickering broken bulb (the issue) — left third */}
          <div style={{position:'absolute', left:216, top:160, transform:'translateX(-50%)'}}>
            <Bulb on={bulbFlick}/>
          </div>
          {/* ScanSolve QR poster on wall — center third */}
          <div style={{position:'absolute', left:514, top:140}}>
            <div style={{background:'#fff', borderRadius:14, padding:9, boxShadow:'0 18px 40px -16px rgba(40,40,90,0.35)', border:`1px solid ${C.line}`}}>
              <img src="/scansolve-anim-poster.png" alt="ScanSolve poster" style={{display:'block', width:236, height:'auto', borderRadius:6}}/>
            </div>
            {/* scan sweep tint over the QR while scanning */}
            {sweep>0 && sweep<1 && (
              <div style={{position:'absolute', left:150, top:14, width:96, height:`${sweep*150}px`, maxHeight:150,
                background:'linear-gradient(180deg, rgba(107,91,230,0.0), rgba(107,91,230,0.22))', borderRadius:4, pointerEvents:'none'}}/>
            )}
            {/* detection rings over the QR on capture */}
            {captured && lt<3.5 && [0,1].map(i=>(
              <div key={i} style={{position:'absolute', left:188, top:90, width:64, height:64, borderRadius:'50%',
                border:`3px solid ${C.green}`, transform:`translate(-50%,-50%) scale(${pop(lt,2.6+i*0.12,0.6)*1.9})`,
                opacity:clamp(1-(lt-2.6-i*0.12)/0.8,0,1)}}/>
            ))}
          </div>
          {/* phone — scan mode, then survey — right third */}
          {surveyIn<1 && (
            <ScanPhone sweep={sweep} captured={captured} w={212}
              style={{left:1024, top:96, opacity:clamp(1-surveyIn*1.4,0,1),
                transform:`translateX(-50%) translate(${shake}px, ${phoneY+bob}px) scale(${tween(surveyIn,0,1,1,1.04)})`,
                transformOrigin:'center'}}/>
          )}
          {surveyIn>0 && (
            <PhoneSurvey reveal={reveal} w={232}
              style={{left:1024, top:74, opacity:clamp(surveyIn*1.6,0,1),
                transform:`translateX(-50%) translateY(${bob*0.4}px) scale(${tween(surveyIn,0,1,0.92,1)})`,
                transformOrigin:'center'}}/>
          )}
          {/* finger tap on selected chip */}
          {tapShow && (
            <div style={{position:'absolute', left:966, top:300}}>
              <div style={{position:'absolute', width:46, height:46, borderRadius:'50%', border:`3px solid ${C.violet}`,
                transform:`translate(-50%,-50%) scale(${pop(lt,6.2,0.5)*1.7})`, opacity:clamp(1-(lt-6.2)/0.7,0,1)}}/>
              <div style={{position:'absolute', width:26, height:26, borderRadius:'50%', background:'rgba(107,91,230,0.85)',
                transform:`translate(-50%,-50%) scale(${pop(lt,6.25,0.4)})`, opacity:clamp(1-(lt-6.5)/0.6,0,1)}}/>
            </div>
          )}
        </div>
      </div>
    );
  }}</Sprite>;
}

function TrackScene(){
  const rows=[
    {title:'Lighting Failure', loc:'Third floor kitchen', time:'Today, 09:14', status:'Reported'},
    {title:'Cleaning Required', loc:'Bathroom', time:'11 May, 16:46', status:'Reported'},
    {title:'Clogged Toilet', loc:'Toilet upstairs', time:'11 May, 15:23', status:'Reported'},
    {title:'Toilet damaged', loc:'Floor 1 Toilet', time:'7 May, 00:56', status:'Resolved'},
  ];
  return <Sprite start={11.6} end={20.0}>{({localTime:lt, duration})=>{
    const fx = sceneFx(lt, duration);
    const cam = tween(lt, 0, duration, 1, 1.05, Easing.linear);
    const rise = Easing.easeOutBack(clamp((lt-0.5)/0.95,0,1));
    const float = lt>1.6 ? Math.sin((lt-1.6)*1.3)*3 : 0;
    const reveal = clamp((lt-0.9)/3.0,0,1);
    const openCount = lt<3.8 ? Math.round(tween(lt,1.1,2.6,0,2)) : 3;
    const refl = clamp((lt-1.5)/1.0,0,1);            // reflection sweep
    const toastIn = clamp((lt-3.7)/0.45,0,1)*(1-clamp((lt-5.6)/0.45,0,1));
    const hoverIdx = (lt>5.0 && lt<6.6) ? 0 : -1;
    const cursorX = tween(lt, 4.4, 5.2, 600, 250);
    const cursorY = tween(lt, 4.4, 5.2, 400, 168);
    const clickR = pop(lt, 5.35, 0.4);
    return (
      <div style={{position:'absolute', inset:0, ...fx}}>
        <div style={{position:'absolute', inset:0, transform:`scale(${cam})`, transformOrigin:'50% 42%'}}>
          <div style={{position:'absolute', inset:0, background:`linear-gradient(180deg, #F1F0FB, ${C.wall})`}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:0, height:128, background:'#CFC9E6'}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:118, height:18, background:'#B7B0D8'}}/>
          <Particles t={lt} count={12} blur={3}/>
          {/* monitor */}
          <div style={{position:'absolute', left:'50%', top:tween(rise,0,1,150,70)+float, transform:`translateX(-50%)`, opacity:clamp(rise*1.3,0,1)}}>
            <div style={{width:640, height:392, background:'#15162C', borderRadius:18, padding:11, boxShadow:'0 36px 70px -28px rgba(30,24,70,0.55)'}}>
              <div style={{width:'100%', height:'100%', borderRadius:10, overflow:'hidden', position:'relative'}}>
                <Dashboard rows={rows} reveal={reveal} hoverIdx={hoverIdx} openCount={openCount} newIdx={0} t={lt}/>
                {/* reflection sweep */}
                {refl>0 && refl<1 && (
                  <div style={{position:'absolute', top:0, bottom:0, left:`${refl*150-40}%`, width:90,
                    background:'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)',
                    transform:'skewX(-12deg)', pointerEvents:'none'}}/>
                )}
                {/* toast */}
                {toastIn>0.01 && (
                  <div style={{position:'absolute', top:tween(toastIn,0,1,-46,14), right:16, display:'flex', alignItems:'center', gap:10,
                    background:'#fff', borderRadius:13, padding:'9px 13px', boxShadow:'0 14px 30px -12px rgba(60,40,140,0.45)',
                    opacity:clamp(toastIn*1.5,0,1), zIndex:6, border:`1px solid ${C.violetLine}`}}>
                    <div style={{width:9, height:9, borderRadius:'50%', background:C.violet, boxShadow:`0 0 0 ${4+Math.sin(lt*8)*2}px rgba(107,91,230,0.18)`}}/>
                    <div>
                      <div style={{fontFamily:FONT, fontWeight:800, fontSize:11.5, color:C.ink, lineHeight:1}}>New report received</div>
                      <div style={{fontFamily:FONT, fontWeight:600, fontSize:10.5, color:C.inkSoft, lineHeight:1, marginTop:4}}>Lighting Failure · 3rd floor kitchen</div>
                    </div>
                  </div>
                )}
                {/* cursor + click ripple */}
                {lt>4.0 && lt<6.6 && (
                  <div style={{position:'absolute', left:cursorX, top:cursorY, zIndex:7}}>
                    {lt>5.2 && lt<5.9 && (
                      <div style={{position:'absolute', left:0, top:2, width:30, height:30, borderRadius:'50%', border:`2px solid ${C.violet}`,
                        transform:`translate(-50%,-50%) scale(${clickR*1.6})`, opacity:clamp(1-(lt-5.35)/0.5,0,1)}}/>
                    )}
                    <div style={{width:0, height:0, borderLeft:'11px solid #15162C', borderTop:'7px solid transparent', borderBottom:'7px solid transparent', transform:'rotate(-38deg)', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}}/>
                  </div>
                )}
              </div>
              <div style={{position:'absolute', left:'50%', bottom:-2, transform:'translateX(-50%)', width:130, height:14, background:'#0E0F22', borderRadius:'0 0 8px 8px'}}/>
            </div>
            <div style={{width:120, height:46, margin:'0 auto', background:'#1A1B30', clipPath:'polygon(28% 0,72% 0,100% 100%,0 100%)'}}/>
            <div style={{width:170, height:12, margin:'-2px auto 0', background:'#2A2A44', borderRadius:7}}/>
          </div>
        </div>
      </div>
    );
  }}</Sprite>;
}

function ResolveScene(){
  return <Sprite start={19.8} end={27.6}>{({localTime:lt, duration})=>{
    const fx = sceneFx(lt, duration);
    const cam = tween(lt, 0, 4.0, 1.0, 1.07, Easing.easeOutCubic);
    // flicker (broken) for the first ~2.6s, then snap to fixed/steady glow
    const flickPhase = Math.sin(lt*7.3) + Math.sin(lt*17.1)*0.6 + Math.sin(lt*31.7)*0.35;
    const flick = flickPhase > 0.15 ? (0.82 + 0.14*Math.sin(lt*55)) : 0.06;
    const fixT = Easing.easeOutBack(clamp((lt-2.6)/0.6,0,1));
    const fixed = lt >= 2.6;
    const bulbOn = fixed ? Math.max(0.06, fixT) : flick;
    const cardIn = pop(lt, 3.2, 0.6) * clamp(1-(lt-7.2)/0.5,0,1);
    return (
      <div style={{position:'absolute', inset:0, ...fx}}>
        <div style={{position:'absolute', inset:0, transform:`scale(${cam})`, transformOrigin:'50% 46%'}}>
          <div style={{position:'absolute', inset:0, background:`linear-gradient(180deg, #F1F0FB, ${C.wall})`}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:0, height:150, background:C.floor}}/>
          <div style={{position:'absolute', left:0, right:0, bottom:150, height:2, background:'rgba(80,70,140,0.08)'}}/>
          <Particles t={lt} count={13} blur={3} color="rgba(242,179,60,0.16)"/>
          {/* big warm glow once fixed */}
          <div style={{position:'absolute', left:'50%', top:300, width:680, height:680, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(242,179,60,0.34), rgba(242,179,60,0))',
            opacity: fixed ? bulbOn : bulbOn*0.4,
            transform:`translate(-50%,-50%) scale(${0.6+bulbOn*0.5})`}}/>
          {/* full-size bulb, centered */}
          <div style={{position:'absolute', left:'50%', top:300, transform:`translate(-50%,-50%) scale(2.6)`, transformOrigin:'center'}}>
            <Bulb on={bulbOn}/>
          </div>
          {/* resolved card */}
          {cardIn>0 && (
            <div style={{position:'absolute', left:'50%', top:486, transform:'translateX(-50%)'}}>
              <ResolvedCard s={cardIn}/>
            </div>
          )}
          {/* sparkle burst when fixed */}
          {fixed && bulbOn>0.5 && [0,1,2,3,4,5].map(i=>{
            const ang = i*(360/6) * Math.PI/180;
            const rad = 150 + (i%2)*40;
            const ax = Math.cos(ang)*rad, ay = Math.sin(ang)*rad - 30;
            return <div key={i} style={{position:'absolute', left:640+ax, top:280+ay, width:15, height:15,
              background:C.amber, clipPath:'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
              transform:`scale(${pop(lt,2.7+i*0.08,0.5)}) rotate(${lt*45+i*30}deg)`,
              opacity:clamp(1-(lt-3.4-i*0.08)/1.6,0,1)}}/>;
          })}
        </div>
      </div>
    );
  }}</Sprite>;
}

function Outro(){
  return <Sprite start={27.4} end={29}>{({localTime:lt, duration})=>{
    const inT=fadeIn(lt,0,0.5);
    const outT=clamp((lt-(duration-0.45))/0.45,0,1);
    return (
      <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, opacity:inT*(1-outT)}}>
        <div style={{transform:`scale(${pop(lt,0,0.6)})`}}><QRTile size={96} radius={26}/></div>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:46, color:C.ink, letterSpacing:'-0.02em'}}>ScanSolve</div>
        <div style={{display:'flex', gap:14, alignItems:'center', fontFamily:FONT, fontWeight:700, fontSize:20, color:C.violet}}>
          <span>Report</span><span style={{color:C.inkFaint}}>·</span><span>Track</span><span style={{color:C.inkFaint}}>·</span><span>Resolve</span>
        </div>
      </div>
    );
  }}</Sprite>;
}

/* ---- persistent chrome: wordmark + stage stepper + caption ---- */
function Chrome(){
  const t = useTime();
  const stages=[
    {a:3.3,b:11.8, n:'01', label:'Scan', cap:'Scan the QR. Report the issue in seconds.'},
    {a:11.6,b:20.0, n:'02', label:'Track', cap:'Every report lands on one live dashboard.'},
    {a:19.8,b:27.6, n:'03', label:'Resolve', cap:'The issue gets fixed — and the lights are back on.'},
  ];
  const active = stages.findIndex(s=>t>=s.a && t<s.b);
  const show = t>3.0 && t<27.5;
  if(!show) return null;
  const cur = stages[active] || stages[0];
  return (
    <>
      {/* top-left wordmark */}
      <div style={{position:'absolute', left:34, top:28, display:'flex', alignItems:'center', gap:9, opacity:0.95}}>
        <QRTile size={30} radius={9}/>
        <div style={{fontFamily:FONT, fontWeight:800, fontSize:18, color:C.ink, letterSpacing:'-0.01em'}}>ScanSolve</div>
      </div>
      {/* stage stepper top-right */}
      <div style={{position:'absolute', right:34, top:30, display:'flex', alignItems:'center', gap:10}}>
        {stages.map((s,i)=>{
          const on=i===active;
          return (
            <div key={i} style={{display:'flex', alignItems:'center', gap:8,
              padding:'6px 12px', borderRadius:20, background:on?C.violet:'rgba(255,255,255,0.7)',
              border:`1px solid ${on?C.violet:C.line}`, transition:'none'}}>
              <span style={{fontFamily:FONT, fontWeight:800, fontSize:12, color:on?'#fff':C.inkFaint}}>{s.n}</span>
              <span style={{fontFamily:FONT, fontWeight:700, fontSize:12.5, color:on?'#fff':C.inkSoft}}>{s.label}</span>
            </div>
          );
        })}
      </div>
      {/* caption bottom */}
      <div style={{position:'absolute', left:'50%', bottom:34, transform:'translateX(-50%)', textAlign:'center'}}>
        <div style={{fontFamily:FONT, fontWeight:700, fontSize:20, color:C.ink, background:'rgba(255,255,255,0.72)',
          padding:'10px 22px', borderRadius:30, backdropFilter:'blur(4px)', boxShadow:'0 8px 22px -10px rgba(40,30,90,0.25)'}}>
          {cur.cap}
        </div>
      </div>
    </>
  );
}

function App(){
  return (
    <EmbedStage width={1280} height={720} duration={29}
      background={`linear-gradient(165deg, ${C.bg1}, ${C.bg2})`}
      loop>
      <Intro/>
      <ScanScene/>
      <TrackScene/>
      <ResolveScene/>
      <Outro/>
      <Chrome/>
    </EmbedStage>
  );
}

export { App as ScanSolveLandscape };
