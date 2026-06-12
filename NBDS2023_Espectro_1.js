/* ══ NORMATIVE DATA ═══════════════════════════════════════════════════════ */
const FA = {
  S0:[0.8,0.8,0.8,0.8,0.8,0.8],
  S1:[0.9,0.9,0.9,0.9,0.9,0.9],
  S2:[1.3,1.3,1.2,1.1,1.1,1.1],
  S3:[1.6,1.4,1.2,1.1,1.1,1.1],
  S4:[2.4,1.7,1.3,1.2,1.2,1.2],
};
const FA_S0=[0.067,0.133,0.200,0.267,0.333,0.400];
const FV={
  S0:[0.64,0.7,0.8,0.8,0.8,0.8],
  S1:[0.64,0.7,0.8,0.8,0.8,0.8],
  S2:[1.2,1.3,1.5,1.5,1.5,1.4],
  S3:[2.0,2.0,2.0,1.9,1.8,1.7],
  S4:[3.5,3.0,2.8,2.4,2.4,2.4],
};
const FV_S0=[0.053,0.107,0.160,0.213,0.267,0.320];
const IE={IV:1.5,III:1.3,II:1.0,I:1.0};
const IRRS=[
  {id:'ia1',lbl:'Piso Blando',       v:0.15,t:'Ia'},
  {id:'ia2',lbl:'Piso Débil',        v:0.15,t:'Ia'},
  {id:'ia3',lbl:'Rigidez Extrema',   v:0.20,t:'Ia'},
  {id:'ia4',lbl:'Resistencia Ext.',  v:0.20,t:'Ia'},
  {id:'ia5',lbl:'Masa / Peso',       v:0.05,t:'Ia'},
  {id:'ia6',lbl:'Geom. Vertical',    v:0.05,t:'Ia'},
  {id:'ia7',lbl:'Discontinuidad',    v:0.20,t:'Ia'},
  {id:'ia8',lbl:'Discontin. Ext.',   v:0.30,t:'Ia'},
  {id:'ip1',lbl:'Torsional',         v:0.15,t:'Ip'},
  {id:'ip2',lbl:'Torsión Extrema',   v:0.20,t:'Ip'},
  {id:'ip3',lbl:'Esq. Entrantes',    v:0.05,t:'Ip'},
  {id:'ip4',lbl:'Discont. Diafrag.', v:0.05,t:'Ip'},
  {id:'ip5',lbl:'No Paralelos',      v:0.05,t:'Ip'},
];

/* ══ HELPERS ══════════════════════════════════════════════════════════════ */
function interp(x,xs,ys){
  if(x<=xs[0])return ys[0];
  if(x>=xs[xs.length-1])return ys[ys.length-1];
  for(let i=0;i<xs.length-1;i++){
    if(x>=xs[i]&&x<=xs[i+1]){
      const t=(x-xs[i])/(xs[i+1]-xs[i]);
      return ys[i]+t*(ys[i+1]-ys[i]);
    }
  }
  return ys[ys.length-1];
}
const getFa=(soil,s0)=>interp(s0,FA_S0,FA[soil]);
const getFv=(soil,s0)=>interp(s0,FV_S0,FV[soil]);

function getCDS(FaS0,FvS0,type,s0){
  if(s0>=0.33)return type==='IV'?'F':'E';
  const byFa=FaS0<0.067?'A':FaS0<0.133?(type==='IV'?'C':'B'):FaS0<0.200?(type==='IV'?'D':'C'):'D';
  const byFv=FvS0<0.054?'A':FvS0<0.106?(type==='IV'?'C':'B'):FvS0<0.160?(type==='IV'?'D':'C'):'D';
  const ord=['A','B','C','D','E','F'];
  return ord[Math.max(ord.indexOf(byFa),ord.indexOf(byFv))];
}

function sae(T,Fa,Fv,s0,T0,Ts,TL){
  if(T===0)return Fa*s0;
  if(T<T0) return Fa*s0*(1+1.5*T/T0);
  if(T<=Ts)return 2.5*Fa*s0;
  if(T<=TL)return 1.25*Fv*s0/T;
  return 1.25*Fv*s0*TL/(T*T);
}

function buildTvals(T0,Ts,TL){
  const v=[];
  const push=(t)=>{
    const value=+t.toFixed(4);
    if(v.length===0||value!==v[v.length-1]) v.push(value);
  };
  const addRange=(start,end,step)=>{
    for(let t=start;t<=end+1e-9;t=+(t+step).toFixed(6)) push(t);
  };

  // Use finer sampling around the spectrum corners and coarser in smooth regions
  addRange(0, T0, Math.min(0.01, Math.max(0.01, T0 / 10)));
  addRange(T0, Ts, Math.min(0.1, Math.max(0.1, (Ts - T0) / 10)));
  addRange(Ts, TL, Math.min(0.1, Math.max(0.1, (TL - Ts) / 15)));
  addRange(TL, 12.0, Math.min(0.2, Math.max(0.2, (12.0 - TL) / 10)));

  return v;
}

/* ══ S0 SYNC ══════════════════════════════════════════════════════════════ */
const iS0=document.getElementById('iS0');
function syncS0(v){
  v=Math.max(0.02,Math.min(0.55,parseFloat(v)||0.20));
  iS0.value=v.toFixed(3);
}
iS0.addEventListener('blur',()=>syncS0(iS0.value));

/* ══ TAU ══════════════════════════════════════════════════════════════════ */
let tau=1.00;
document.querySelectorAll('.tau-opt').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.tau-opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const tauCW=document.getElementById('tauCW');
    if(b.dataset.tau==='calc'){tauCW.style.display='flex';tau=calcTau();}
    else{tauCW.style.display='none';tau=parseFloat(b.dataset.tau);}
  });
});
document.getElementById('iTauD').addEventListener('input',()=>{tau=calcTau();});
function calcTau(){
  const d=parseFloat(document.getElementById('iTauD').value)||0.60;
  if(d<0.40)return 1.00;
  if(d>0.90)return 1.40;
  return Math.round((1+0.80*(d-0.40))*10000)/10000;
}

/* ══ FIT COLLAPSIBLE ═══════════════════════════════════════════════════════ */
const fitHeader = document.getElementById('fitHeader');
const fitBody = document.getElementById('fitBody');
fitHeader.addEventListener('click', () => {
  fitHeader.classList.toggle('collapsed');
  fitBody.style.display = fitBody.style.display === 'none' ? 'flex' : 'none';
});

/* ══ FIT CHECKBOXES ═══════════════════════════════════════════════════════ */
const fitGrid=document.getElementById('fitGrid');
IRRS.forEach(irr=>{
  const d=document.createElement('div');
  d.className='fit-item';
  d.dataset.v=irr.v;
  d.innerHTML=`<span>${irr.lbl}</span><span class="fit-iv">${irr.t} −${irr.v}</span>`;
  d.addEventListener('click',()=>{
    d.classList.toggle('on');
    updateFIT();
  });
  fitGrid.appendChild(d);
});
function updateFIT(){
  let s=0;
  document.querySelectorAll('.fit-item.on').forEach(el=>s+=parseFloat(el.dataset.v));
  const fit=Math.max(0.50,1-s);
  document.getElementById('fitDisplay').textContent=`FIT = ${fit.toFixed(3)}`;
  return fit;
}

/* ══ CHART ════════════════════════════════════════════════════════════════ */
const ctx=document.getElementById('specChart').getContext('2d');
let chart=null;

const periodPlugin={
  id:'periods',
  afterDraw(ch,_,opts){
    const {T0,Ts,TL}=opts;
    const {ctx:c,chartArea:ca,scales}=ch;
    [[T0,'T₀','#F5A623'],[Ts,'Ts','#3DD68C'],[TL,'TL','#9F7AEA']].forEach(([T,lbl,col])=>{
      const x=scales.x.getPixelForValue(T);
      if(x<ca.left||x>ca.right)return;
      c.save();c.strokeStyle=col;c.lineWidth=1;c.setLineDash([3,3]);
      c.beginPath();c.moveTo(x,ca.top);c.lineTo(x,ca.bottom);c.stroke();
      c.setLineDash([]);c.fillStyle=col;c.font='bold 10px JetBrains Mono';
      c.textAlign='center';c.fillText(lbl,x,ca.top+11);c.restore();
    });
  }
};
Chart.register(periodPlugin);

function buildChart(Tv,Sae_v,Sa_v,T0,Ts,TL){
  if(chart)chart.destroy();
  chart=new Chart(ctx,{
    type:'line',
    data:{
      datasets:[
        {label:'Sae(T) – Espectro Elástico',data:Tv.map((t,i)=>({x:t,y:Sae_v[i]})),
         borderColor:'#00D4FF',backgroundColor:'rgba(0,212,255,0.06)',
         borderWidth:2,pointRadius:0,tension:0.3,fill:true},
        {label:'Sa(T) – Espectro Diseño',data:Tv.map((t,i)=>({x:t,y:Sa_v[i]})),
         borderColor:'#FF4D4D',backgroundColor:'rgba(255,77,77,0.03)',
         borderWidth:1.8,borderDash:[5,3],pointRadius:0,tension:0.3,fill:false},
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:450,easing:'easeOutCubic'},
      interaction:{mode:'nearest',intersect:false},
      plugins:{
        periods:{T0,Ts,TL,Tvals:Tv},
        legend:{position:'top',labels:{color:'#7A90B0',font:{family:'Inter',size:10},usePointStyle:true,boxWidth:12}},
        tooltip:{
          backgroundColor:'#111827',borderColor:'#243048',borderWidth:1,
          titleColor:'#E2E8F0',bodyColor:'#7A90B0',
          callbacks:{
            title:i=>`T = ${i[0].parsed.x.toFixed(3)} s`,
            label:i=>` ${i.dataset.label.split('–')[0].trim()}: ${i.parsed.y.toFixed(4)} g`
          }
        }
      },
      scales:{
        x:{type:'linear',title:{display:true,text:'Período T [s]',color:'#3A5070',font:{size:10}},
           ticks:{color:'#3A5070',maxTicksLimit:12,font:{family:'JetBrains Mono',size:9},callback:v=>v.toFixed(2)},
           grid:{color:'rgba(255,255,255,0.03)'}},
        y:{title:{display:true,text:'Aceleración [g]',color:'#3A5070',font:{size:10}},
           ticks:{color:'#3A5070',font:{family:'JetBrains Mono',size:9},callback:v=>v.toFixed(3)},
           grid:{color:'rgba(255,255,255,0.04)'},beginAtZero:true}
      }
    }
  });
}

/* ══ CALCULATE ════════════════════════════════════════════════════════════ */
let _Tv=[],_Sae=[],_Sa=[],_P=null;

function calculate(){
  // Read inputs
  const s0=Math.max(0.02,Math.min(0.55,parseFloat(iS0.value)||0.20));
  syncS0(s0); // normalise display

  const soil=document.getElementById('iSoil').value;
  const type=document.getElementById('iType').value;
  const sysStr=document.getElementById('iSys').value.split(',').map(Number);
  const R=sysStr[0],Cd=sysStr[1],delta=sysStr[2];
  const Ie=IE[type];

  // Active tau
  const activeBtn=document.querySelector('.tau-opt.on');
  const tauFinal=activeBtn.dataset.tau==='calc'?calcTau():parseFloat(activeBtn.dataset.tau);

  // FIT
  let sumIrr=0;
  document.querySelectorAll('.fit-item.on').forEach(el=>sumIrr+=parseFloat(el.dataset.v));
  const FIT=Math.max(0.50,1-sumIrr);

  // Fa, Fv
  const Fa=getFa(soil,s0);
  const Fv=getFv(soil,s0);

  // Periods
  const T0=0.15*Fv/Fa;
  const Ts=0.50*Fv/Fa;
  const TL=4.00*Fv/Fa;

  // Derived
  const SDS=2.5*Fa*s0;
  const SD1=1.25*Fv*s0;
  const FaS0=Fa*s0,FvS0=Fv*s0;
  const CDS=getCDS(FaS0,FvS0,type,s0);

  // Build spectrum
  const Tv=buildTvals(T0,Ts,TL);
  const Sae_v=Tv.map(T=>sae(T,Fa,Fv,s0,T0,Ts,TL));
  const Sa_v=Sae_v.map(v=>v*Ie*tauFinal/R);

  _Tv=Tv;_Sae=Sae_v;_Sa=Sa_v;
  _P={s0,soil,Fa,Fv,T0,Ts,TL,SDS,SD1,Ie,R,Cd,delta,tau:tauFinal,FIT,CDS,type,FaS0,FvS0};

  buildChart(Tv,Sae_v,Sa_v,T0,Ts,TL);
  renderResults(_P);
  document.getElementById('btnCsv').disabled=false;
}

/* ══ RENDER RESULTS ═══════════════════════════════════════════════════════ */
function rRow(lbl,val,cls,unit,hi){
  return `<div class="rr${hi?' '+hi:''}">
    <span class="rl">${lbl}</span>
    <span class="rv ${cls}">${val}<span class="ru">${unit}</span></span>
  </div>`;
}
function renderResults(p){
  const f4=n=>n.toFixed(4),f3=n=>n.toFixed(3),f2=n=>n.toFixed(2);
  const cC={'A':'cA','B':'cB','C':'cC','D':'cD','E':'cE','F':'cF'};
  const vC={'A':'gn','B':'am','C':'am','D':'rd','E':'rd','F':'pu'};
  document.getElementById('resBody').innerHTML=`
    <div class="rg-lbl">Coeficientes de sitio</div>
    ${rRow('Fa',f4(p.Fa),'','adim.','hi')}
    ${rRow('Fv',f4(p.Fv),'','adim.','hi')}
    ${rRow('Fa · S₀',f4(p.FaS0),'muted','g','')}
    ${rRow('Fv · S₀',f4(p.FvS0),'muted','g','')}
    <div class="rr">
      <span class="rl">CDS</span>
      <span class="rv ${vC[p.CDS]||'rd'}">
        <span class="cds-badge ${cC[p.CDS]||'cD'}">${p.CDS}</span>
      </span>
    </div>

    <div class="rg-lbl" style="margin-top:4px">Sistema estructural</div>
    ${rRow('Ie',f3(p.Ie),'am','adim.','')}
    ${rRow('R',f2(p.R),'am','adim.','')}
    ${rRow('Cd',f2(p.Cd),'am','adim.','')}
    ${rRow('Δ permisible',p.delta,'am','h/h','')}
    ${rRow('τ',f3(p.tau),'','adim.','')}
    ${rRow('FIT',f3(p.FIT),p.FIT<0.80?'rd':'gn','adim.','')}
    ${rRow('Δ · FIT efectivo',(p.delta*p.FIT).toFixed(4),p.FIT<0.80?'rd':'am','h/h','')}

    <div class="rg-lbl" style="margin-top:4px">Espectro Elástico  Sae(T)</div>
    ${rRow('T₀',f4(p.T0),'am','s','')}
    ${rRow('Ts',f4(p.Ts),'gn','s','')}
    ${rRow('TL',f4(p.TL),'pu','s','')}
    ${rRow('SDS = 2.5·Fa·S₀',f4(p.SDS),'','g','hi')}
    ${rRow('SD1 = 1.25·Fv·S₀',f4(p.SD1),'','g','hi')}
    ${rRow('Meseta Sae',f4(p.SDS),'','g','hi')}

    <div class="rg-lbl" style="margin-top:4px">Espectro de Diseño  Sa(T)</div>
    ${rRow('Ie · τ / R',f4(p.Ie*p.tau/p.R),'rd','factor','')}
    ${rRow('FIT',f3(p.FIT),'rd','adim.','')}
    ${rRow('Meseta Sa',f4(p.SDS*p.Ie*p.tau/p.R),'rd','g','hr')}
  `.replace(/class="rv muted"/g,'class="rl"');
}

/* ══ CSV ══════════════════════════════════════════════════════════════════ */
function downloadCsv(){
  if(!_P)return;
  const p=_P;
  let c='sep=;\nT [s];Sae(T) [g];Sa(T) [g]\n';
  _Tv.forEach((t,i)=>c+=`${t.toFixed(4)};${_Sae[i].toFixed(6)};${_Sa[i].toFixed(6)}\n`);
  const a=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([c],{type:'text/csv;charset=utf-8;'})),
    download:`Espectro_NBDS2023_${p.soil}_S0=${p.s0}.csv`
  });
  a.click();URL.revokeObjectURL(a.href);
}


