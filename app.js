const DAYS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const start=new Date(); start.setHours(12,0,0,0);
const ICON_CHECK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

// Datos de ejemplo: historial de los 6 días anteriores (true = hecho)
let state={day:1,streak:3,xp:240,habits:[
  {id:1,name:'Beber 2 L de agua',done:true,missed:false,hist:[true,true,false,true,true,true]},
  {id:2,name:'Leer 20 minutos',done:false,missed:false,hist:[true,false,true,true,true,true]},
  {id:3,name:'Caminar 8.000 pasos',done:false,missed:false,hist:[false,true,true,true,true,true]},
  {id:4,name:'Meditar 5 minutos',done:false,missed:false,hist:[true,true,true,false,true,true]}
]};
let nextId=5;
const $=id=>document.getElementById(id);

function dateFor(d){const x=new Date(start);x.setDate(x.getDate()+d-1);return x}
function render(){
  const d=dateFor(state.day);
  $('dayLabel').textContent='Día '+state.day;
  $('dateLabel').textContent=DAYS[d.getDay()].replace(/^./,c=>c.toUpperCase())+' '+d.getDate()+' '+MONTHS[d.getMonth()];
  $('streak').textContent=state.streak;
  $('streakChip').classList.toggle('zero',state.streak===0);
  $('xp').textContent=state.xp;

  const list=$('list'); list.innerHTML='';
  if(!state.habits.length){list.innerHTML='<li class="empty">Aún no hay hábitos. Añade el primero abajo.</li>'}
  state.habits.forEach(h=>{
    const li=document.createElement('li');
    li.className='habit'+(h.done?' done':'')+(h.missed&&!h.done?' missed':'');
    li.dataset.id=h.id;
    const dots=h.hist.slice(-6).map(v=>'<b class="'+(v?'ok':'ko')+'"></b>').join('')+'<b class="today '+(h.done?'ok':'')+'"></b>';
    li.innerHTML=
      '<button class="check" type="button" aria-pressed="'+h.done+'" aria-label="Marcar '+esc(h.name)+'">'+ICON_CHECK+'</button>'+
      '<div class="info"><span class="name">'+esc(h.name)+'</span>'+
      (h.missed&&!h.done?'<span class="tag">No completado ayer</span>':'')+
      '<span class="week" aria-label="Últimos 7 días">'+dots+'</span></div>'+
      '<button class="del" type="button" aria-label="Eliminar '+esc(h.name)+'">'+ICON_X+'</button>';
    list.appendChild(li);
  });

  const total=state.habits.length, done=state.habits.filter(h=>h.done).length;
  $('pct').textContent=done+'/'+total;
  $('barFill').style.width=total?(done/total*100)+'%':'0%';
  const m=$('msg'); m.classList.toggle('win',total>0&&done===total);
  m.textContent=!total?'Añade un hábito para empezar el día.'
    :done===total?'¡Día perfecto! Tu racha está a salvo.'
    :done===0?'Marca tu primer hábito y arranca con fuerza.'
    :total-done===1?'¡Solo te queda uno!'
    :'Llevas '+done+'. Te faltan '+(total-done)+' para cerrar el día.';
}
function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

$('list').addEventListener('click',e=>{
  const li=e.target.closest('.habit'); if(!li)return;
  const h=state.habits.find(x=>x.id==li.dataset.id);
  if(e.target.closest('.del')){state.habits=state.habits.filter(x=>x!==h);render();return}
  if(e.target.closest('.check')){
    const was=state.habits.every(x=>x.done);
    h.done=!h.done;
    if(h.done){
      state.xp+=10; floatXP(e.target.closest('.check')); bump('xpChip');
      const r=e.target.closest('.check').getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,18);
    } else state.xp=Math.max(0,state.xp-10);
    render();
    if(!was&&state.habits.every(x=>x.done)){
      state.xp+=20; render(); bump('xpChip');
      confettiRain(); toast('good','¡Día completado! +20 XP de bonus.');
    }
  }
});

$('addForm').addEventListener('submit',e=>{
  e.preventDefault();
  const inp=$('newHabit'), v=inp.value.trim();
  if(!v){inp.classList.add('err');$('hint').hidden=false;inp.focus();return}
  inp.classList.remove('err');$('hint').hidden=true;
  state.habits.push({id:nextId++,name:v,done:false,missed:false,hist:[]});
  inp.value=''; render();
});
$('newHabit').addEventListener('input',()=>{$('newHabit').classList.remove('err');$('hint').hidden=true});

$('nextDay').addEventListener('click',()=>{
  if(!state.habits.length){toast('info','Añade algún hábito antes de pasar de día.');return}
  const missed=state.habits.filter(h=>!h.done).length;
  state.habits.forEach(h=>{h.hist.push(h.done);h.missed=!h.done;h.done=false});
  state.day++;
  if(missed===0){state.streak++;render();bump('streakChip');toast('good','Racha de '+state.streak+' días. ¡Sigue así!')}
  else{
    state.streak=0;render();
    document.querySelectorAll('.habit.missed').forEach(el=>el.classList.add('shake'));
    toast('bad',(missed===1?'1 hábito se quedó':missed+' hábitos se quedaron')+' sin hacer. Racha reiniciada.');
  }
  window.scrollTo({top:0,behavior:'smooth'});
});

function bump(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
function floatXP(btn){
  const r=btn.getBoundingClientRect(), s=document.createElement('span');
  s.className='xpfloat';s.textContent='+10 XP';s.style.left=(r.right+6)+'px';s.style.top=(r.top)+'px';
  document.body.appendChild(s);setTimeout(()=>s.remove(),950);
}
let tt;
function toast(kind,text){
  const t=$('toast');
  const ic=kind==='bad'
    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>'
    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  t.className='toast '+kind;t.innerHTML=ic+'<span>'+text+'</span>';
  requestAnimationFrame(()=>t.classList.add('show'));
  clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3000);
}

// Confeti en canvas
const cv=$('fx'),cx=cv.getContext('2d');let parts=[],raf=null;
const COLORS=['#22E08A','#14C8B4','#1A7CF5','#8EC5FF','#FFFFFF'];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function size(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
size();addEventListener('resize',size);
function burst(x,y,n){if(reduce)return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*4;
  parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,r:3+Math.random()*3,c:COLORS[i%COLORS.length],life:40+Math.random()*20,rot:Math.random()*6})}loop()}
function confettiRain(){if(reduce)return;for(let i=0;i<120;i++)parts.push({x:Math.random()*innerWidth,y:-20-Math.random()*200,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,
  r:4+Math.random()*4,c:COLORS[i%COLORS.length],life:160,rot:Math.random()*6});loop()}
function loop(){if(raf)return;const step=()=>{cx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life-->0&&p.y<innerHeight+30);
  parts.forEach(p=>{p.vy+=.12;p.x+=p.vx;p.y+=p.vy;p.rot+=.1;cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);
    cx.globalAlpha=Math.min(1,p.life/20);cx.fillStyle=p.c;cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore()});
  raf=parts.length?requestAnimationFrame(step):(cx.clearRect(0,0,innerWidth,innerHeight),null)};raf=requestAnimationFrame(step)}

render();
