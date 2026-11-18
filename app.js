const $=id=>document.getElementById(id),API='https://api.groq.com/openai/v1',CDN='https://cdn.jsdelivr.net/npm/',F='```';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let L={};try{L=JSON.parse(localStorage.jarvis)}catch(e){}
const S=Object.assign({key:'',model:'llama-3.3-70b-versatile',voice:'',tts:true,hf:false,mem:[],projects:[],board:[],hist:[]},L);
const save=()=>{S.hist=S.hist.slice(-40);localStorage.jarvis=JSON.stringify(S)};
const auth=()=>({Authorization:'Bearer '+S.key}),orb=s=>$('orb').className=s||'';
const clean=t=>t.replace(/<think>[\s\S]*?(<\/think>|$)/g,'').trim();
let busy=false,listening=false,rec;

/* ---------- affichage ---------- */
function md(t){return t.split(F).map((p,i)=>{
 if(i%2){const n=p.indexOf('\n'),l=(n<0?p:p.slice(0,n)).trim().toLowerCase(),c=n<0?'':p.slice(n+1);
  if(l=='memory')return`<div class="tag">🧠 Mémorisé : ${esc(c.trim())}</div>`;
  if(l=='project')return`<div class="tag">📋 Projet mis à jour</div>`;
  return`<div class="code" data-l="${esc(l)}"><b>${esc(l||'code')}${/^(three|chart|html|svg|js|javascript)$/.test(l)?' — afficher ▶':''}</b><pre>${esc(c)}</pre></div>`}
 return esc(p).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/^#{1,4} (.+)$/gm,'<h4>$1</h4>').replace(/^[-*] /gm,'• ').replace(/\n/g,'<br>')}).join('')}
function bubble(r,h){const d=document.createElement('div');d.className='m '+r;d.innerHTML=h;$('log').append(d);$('log').scrollTop=1e9;return d}
const flash=t=>bubble('assistant','⚠ '+esc(t));
function hello(){bubble('assistant',md('Bonjour, je suis Jarvis. Je retiens ce qui compte, découpe vos projets en phases, conçois des pièces 3D (export STL), trace des graphiques, exécute du code et je parle. Essayez : « conçois une bride de moteur » ou « fais un plan pour mon robot ».'))}

/* ---------- zone d'affichage : 3D, graphiques, pages, code ---------- */
function show(k,code){
 const x=c=>c.replace(/<\/script/gi,'<\\/script'),B='<body style="margin:0;background:#04141d;color:#8ff;font:13px monospace">',T=CDN+'three@0.128.0/';let h;
 if(k=='html'||k=='svg')h=code;
 else if(k=='chart'){let c;try{c=JSON.stringify(JSON.parse(code)).replace(/</g,'\\u003c')}catch(e){return flash('Configuration Chart.js invalide : '+e.message)}
  h=B+`<div style="position:relative;height:96vh"><canvas id="c"></canvas></div><script src="${CDN}chart.js@4.4.1/dist/chart.umd.min.js"><\/script><script>Chart.defaults.color='#8ff';Chart.defaults.borderColor='#37e6ff33';new Chart(document.getElementById('c'),${c})<\/script>`}
 else if(k=='js'||k=='javascript')h=B+`<pre id="o" style="white-space:pre-wrap;margin:8px"></pre><script>const o=document.getElementById('o'),p=(...a)=>o.append(a.map(v=>typeof v=='object'?JSON.stringify(v):v).join(' ')+'\\n');console.log=console.error=p;onerror=m=>p('⚠',m)<\/script><script>${x(code)}\n<\/script>`;
 else if(k=='three')h=B+`<script>onerror=m=>document.body.append('⚠ '+m)<\/script><script src="${T}build/three.min.js"><\/script><script src="${T}examples/js/controls/OrbitControls.js"><\/script><script src="${T}examples/js/exporters/STLExporter.js"><\/script><script>
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,5000),renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor(0x04141d);renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);camera.position.set(40,30,50);
scene.add(new THREE.AmbientLight(0xffffff,.6),new THREE.GridHelper(100,20,0x37e6ff,0x0a3a4d));
const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(30,60,40);scene.add(dl);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
<\/script><script>(function(){${x(code)}\n})()<\/script><script>
(function a(t){requestAnimationFrame(a);controls.update();window.tick&&window.tick(t/1e3);renderer.render(scene,camera)})(0);
onresize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};
const b=document.createElement('button');b.textContent='⬇ STL';b.style.cssText='position:fixed;right:8px;top:8px;padding:6px 10px';
b.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([new THREE.STLExporter().parse(scene)]));a.download='piece.stl';a.click()};document.body.append(b)
<\/script>`;
 else return;
 $('view').srcdoc=h}

/* ---------- mémoire, projets, inspiration ---------- */
function upsert(o){const n=String(o.name||'Projet'),i=S.projects.findIndex(p=>p.name.toLowerCase()==n.toLowerCase()),old=i<0?[]:S.projects[i].phases,dn=o.done||[];
 const phases=(o.phases||[]).map((x,j)=>{const t=String(x.t||x.title||x.name||x);return{t,d:dn.includes(j)||old.some(q=>q.t==t&&q.d)}});
 if(i<0)S.projects.push({name:n,phases});else S.projects[i]={name:n,phases}}
function post(t){let m,last;const re=/```(\w*)\n([\s\S]*?)```/g;
 while(m=re.exec(t)){const l=m[1].toLowerCase(),c=m[2].trim();
  if(l=='memory'){if(c&&!S.mem.includes(c))S.mem.push(c)}
  else if(l=='project'){try{upsert(JSON.parse(c))}catch(e){}}
  else if(/^(three|chart|html|svg)$/.test(l))last=[l,m[2]]}
 render();if(last)show(...last)}
function render(){
 $('projects').innerHTML=S.projects.map((p,i)=>`<div class="pj"><b>${esc(p.name)}</b><a data-x="p${i}">✕</a>${p.phases.map((f,j)=>`<label class="ph"><input type="checkbox" data-ph="${i}.${j}" ${f.d?'checked':''}>${esc(f.t)}</label>`).join('')}</div>`).join('')||'<small>Aucun projet. Demandez un plan à Jarvis.</small>';
 $('board').innerHTML=S.board.map((b,i)=>{const u=/^https?:\/\/\S+$/.test(b);return`<div class="it"><span>${u&&/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(b)?`<img src="${esc(b)}" alt="">`:u?`<a href="${esc(b)}" target="_blank" rel="noopener">${esc(b.slice(8,40))}</a>`:esc(b)}</span><a data-x="i${i}">✕</a></div>`}).join('')||'<small>Idées, liens, images de référence.</small>';
 $('mem').innerHTML=S.mem.map((m,i)=>`<div class="it"><span>${esc(m)}</span><a data-x="m${i}">✕</a></div>`).join('')||'<small>Jarvis note ici ce qui compte.</small>';
 save()}

/* ---------- IA (Groq) ---------- */
const sys=()=>`Tu es J.A.R.V.I.S., assistant personnel d'un ingénieur/maker : précis, proactif, avec un soupçon d'humour britannique. Réponds en français (sauf demande contraire), brièvement : tes réponses sont lues à voix haute. Date : ${new Date().toLocaleString('fr-FR')}.
L'interface interprète ces blocs de code spéciaux (écris-les tels quels) :
${F}memory
un fait durable à retenir sur l'utilisateur (une ligne)
${F}
${F}project
{"name":"Nom","phases":["Phase 1","Phase 2"],"done":[0]}
${F}
(crée ou met à jour un projet ; "done" = indices des phases terminées)
${F}three : code Three.js r128 s'exécutant dans une scène déjà prête (THREE, scene, camera, renderer disponibles ; unités = mm ou cm ; ajoute des Mesh avec MeshStandardMaterial ; pièces paramétriques, variables de dimensions en tête ; animation via window.tick=t=>{...}). Sert à concevoir des pièces et modèles 3D, exportables en STL.
${F}chart : objet JSON Chart.js pur (sans fonctions). ${F}html : page complète autonome. ${F}js : script exécuté (console.log affiché).
Mémorise de ta propre initiative les informations importantes. Pour un projet, propose des phases concrètes et ordonnées.
MÉMOIRE : ${S.mem.join(' | ')||'vide'}
PROJETS : ${JSON.stringify(S.projects)}
INSPIRATION : ${S.board.join(' | ')||'vide'}`;
async function ask(el){
 const body={model:S.model,stream:true,temperature:.6,max_tokens:2500,messages:[{role:'system',content:sys()},...S.hist.slice(-30)]};
 const r=await fetch(API+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',...auth()},body:JSON.stringify(body)});
 if(!r.ok)throw new Error(r.status+' — '+(await r.text()).slice(0,300));
 const rd=r.body.getReader(),dc=new TextDecoder();let buf='',out='';
 for(;;){const{done,value}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();
  for(const l of ls)if(l.startsWith('data: ')&&!l.includes('[DONE]'))try{out+=JSON.parse(l.slice(6)).choices[0].delta.content||'';el.innerHTML=md(clean(out));$('log').scrollTop=1e9}catch(e){}}
 return out}
async function send(t){
 t=(t||$('in').value).trim();if(!t||busy)return;
 if(!S.key){$('key').focus();return flash('Collez d’abord votre clé API Groq gratuite (console.groq.com/keys) dans les réglages.')}
 $('in').value='';$('in').style.height='';busy=true;orb('think');
 S.hist.push({role:'user',content:t});bubble('user',esc(t));const el=bubble('assistant','…');let out='';
 try{out=clean(await ask(el));el.innerHTML=md(out);S.hist.push({role:'assistant',content:out});post(out)}
 catch(e){S.hist.pop();el.remove();flash(e.message)}
 busy=false;orb();save();
 if(out&&S.tts)await speak(out);
 if(S.hf&&!busy&&!listening)mic()}

/* ---------- voix ---------- */
function speak(t){return new Promise(r=>{t=t.replace(/```[\s\S]*?```/g,' ').replace(/[*#`_•]/g,'').trim();const ps=t.match(/[^.!?\n]+[.!?]*/g)||[];if(!ps.length)return r();
 const v=speechSynthesis.getVoices().find(x=>x.name==S.voice);
 ps.forEach((s,i)=>{const u=new SpeechSynthesisUtterance(s);if(v){u.voice=v;u.lang=v.lang}else u.lang=navigator.language||'fr-FR';
  u.onstart=()=>orb('speak');if(i==ps.length-1)u.onend=u.onerror=()=>{orb();r()};speechSynthesis.speak(u)})})}
function voices(){const v=speechSynthesis.getVoices(),l=(navigator.language||'fr').slice(0,2);
 $('voice').innerHTML='<option value="">Voix par défaut</option>'+v.filter(x=>x.lang.startsWith(l)).map(x=>`<option ${x.name==S.voice?'selected':''}>${esc(x.name)}</option>`).join('')}
function mic(){
 speechSynthesis.cancel();
 if(listening){rec.stop();return}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR)return whisper();
 rec=new SR();rec.lang=navigator.language||'fr-FR';rec.interimResults=true;let fin=false;
 rec.onresult=e=>{const r=[...e.results];$('in').value=r.map(x=>x[0].transcript).join(' ');if(r[r.length-1].isFinal){fin=true;rec.stop()}};
 rec.onerror=e=>{rec.err=e.error;if(e.error!='no-speech'&&e.error!='aborted')flash('Micro : '+e.error)};
 rec.onend=()=>{listening=false;$('mic').classList.remove('on');orb();if(fin)send();else if(S.hf&&rec.err=='no-speech')mic()};
 rec.start();listening=true;$('mic').classList.add('on');orb('listen')}
async function whisper(){ /* repli (Firefox) : transcription Whisper via Groq */
 if(!S.key)return flash('Ajoutez votre clé Groq pour la dictée vocale.');
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),m=new MediaRecorder(st),ch=[];rec=m;listening=true;$('mic').classList.add('on');orb('listen');
  m.ondataavailable=e=>ch.push(e.data);
  m.onstop=async()=>{listening=false;$('mic').classList.remove('on');orb('think');st.getTracks().forEach(t=>t.stop());
   const fd=new FormData();fd.append('file',new Blob(ch,{type:m.mimeType}),m.mimeType.includes('mp4')?'a.mp4':'a.webm');fd.append('model','whisper-large-v3-turbo');
   try{const r=await fetch(API+'/audio/transcriptions',{method:'POST',headers:auth(),body:fd});$('in').value=(await r.json()).text||'';orb();send()}catch(e){orb();flash('Transcription : '+e.message)}};
  m.start();setTimeout(()=>m.state=='recording'&&m.stop(),10000)}catch(e){flash('Micro : '+e.message)}}

/* ---------- réglages et événements ---------- */
async function models(){let ids=['llama-3.3-70b-versatile','llama-3.1-8b-instant','openai/gpt-oss-120b','openai/gpt-oss-20b'];
 if(S.key)try{const j=await(await fetch(API+'/models',{headers:auth()})).json();ids=j.data.map(m=>m.id).filter(i=>!/whisper|guard|tts|orpheus|playai/i.test(i)).sort()}catch(e){}
 if(!ids.includes(S.model))ids.unshift(S.model);
 $('model').innerHTML=ids.map(i=>`<option ${i==S.model?'selected':''}>${esc(i)}</option>`).join('')}
$('key').value=S.key;$('key').onchange=()=>{S.key=$('key').value.trim();save();models()};
$('tts').checked=S.tts;$('tts').onchange=()=>{S.tts=$('tts').checked;if(!S.tts)speechSynthesis.cancel();save()};
$('hf').checked=S.hf;$('hf').onchange=()=>{S.hf=$('hf').checked;save()};
$('model').onchange=()=>{S.model=$('model').value;save()};
$('voice').onchange=()=>{S.voice=$('voice').value;save()};
$('mic').onclick=()=>mic();
$('f').onsubmit=e=>{e.preventDefault();send()};
$('in').onkeydown=e=>{if(e.key=='Enter'&&!e.shiftKey){e.preventDefault();send()}};
$('in').oninput=e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px'};
$('log').onclick=e=>{const b=e.target.closest('.code b');if(b){const c=b.parentNode;show(c.dataset.l,c.querySelector('pre').textContent)}};
$('addP').onclick=()=>{const t=prompt('Quel projet voulez-vous lancer ?');if(t)send('Crée un projet structuré en phases pour : '+t)};
$('addI').onclick=()=>{const t=prompt('Idée, lien ou URL d’image de référence :');if(t){S.board.push(t.trim());render()}};
$('newC').onclick=()=>{if(confirm('Nouvelle conversation ? La mémoire est conservée.')){S.hist=[];$('log').innerHTML='';hello();save()}};
const side=document.querySelector('aside');
side.onclick=e=>{const x=e.target.dataset.x;if(!x)return;({p:S.projects,i:S.board,m:S.mem})[x[0]].splice(+x.slice(1),1);render()};
side.onchange=e=>{const d=e.target.dataset.ph;if(d){const[i,j]=d.split('.');S.projects[i].phases[j].d=e.target.checked;render()}};
speechSynthesis.onvoiceschanged=voices;voices();models();render();
$('view').srcdoc='<body style="background:#04141d;color:#5f8a99;font:14px system-ui;display:grid;place-items:center;height:100vh;margin:0;text-align:center">Les modèles 3D, graphiques et pages<br>demandés à Jarvis s’afficheront ici.</body>';
S.hist.length?S.hist.forEach(m=>bubble(m.role,m.role=='user'?esc(m.content):md(m.content))):hello();
