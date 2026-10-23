/* Studio V3: dashboard, menu guiado, help, histórico de ações e revisão de publicação. */
(function(){
'use strict';
const api=window.PortalAdmin,qs=s=>document.querySelector(s);
if(!api)return;
const tour=[
 {id:'dashboard',selector:'[data-tab="dashboard"]',icon:'▦',title:'Conheça seu painel',text:'Aqui você encontra os números de conteúdos cadastrados, os atalhos e a situação do site.'},
 {id:'visual',selector:'[data-tab="visual"]',icon:'✎',title:'Editar o site diretamente',text:'Clique em Editar site visualmente e use os lápis sobre cada foto, texto, botão ou seção.'},
 {id:'articles',selector:'[data-tab="articles"]',icon:'▤',title:'Cadastrar notícias',text:'Adicione uma notícia, inclua fotos e links da fonte e organize qual publicação aparecerá em destaque.'},
 {id:'projects',selector:'[data-tab="projects"]',icon:'♧',title:'Organizar projetos sociais',text:'Inclua, altere, exclua e reordene projetos. O editor informa as proporções corretas das imagens.'},
 {id:'media',selector:'[data-tab="media"]',icon:'▧',title:'Biblioteca de fotos',text:'Consulte rapidamente as imagens já usadas no site e abra a área certa para substituí-las.'},
 {id:'preview',selector:'#previewButton',icon:'◉',title:'Conferir a prévia',text:'Antes de publicar, veja a página no computador ou celular e revise os textos e fotos.'},
 {id:'save',selector:'#saveButton',icon:'↓',title:'Salvar sem publicar',text:'Salvar rascunho guarda seu trabalho. Os visitantes continuam vendo a versão já publicada.'},
 {id:'publish',selector:'#publishButton',icon:'↑',title:'Publicar no site',text:'Após a conferência, publicar envia o conteúdo ao GitHub e a Vercel atualiza o portal. Exige a permissão de escrita ativa.'},
 {id:'help',selector:'#topHelp',icon:'?',title:'A ajuda estará sempre aqui',text:'Clique no ícone ? ao lado de cada função ou volte à Central de ajuda para rever esta orientação.'}
];
const cardDefs=[
 {tab:'visual',icon:'✎',name:'Editar o site',description:'Altere a página clicando no lápis sobre o texto ou imagem.',meta:'Modo visual'},
 {tab:'articles',icon:'▤',name:'Notícias',description:'Crie notícias, coloque fotos e selecione os destaques.',meta:'Conteúdo'},
 {tab:'projects',icon:'♧',name:'Projetos sociais',description:'Cadastre novos projetos e organize suas imagens.',meta:'Conteúdo'},
 {tab:'media',icon:'▧',name:'Biblioteca de fotos',description:'Veja as fotos usadas no portal e onde trocá-las.',meta:'Fotos'},
 {tab:'mandate',icon:'▥',name:'Atuação pública',description:'Mantenha propostas e informações públicas atualizadas.',meta:'Conteúdo'},
 {tab:'footer',icon:'▱',name:'Rodapé e links',description:'Atualize contatos, endereço e links do site.',meta:'Personalização'}
];
let tourAt=0,activeGlow=null,historyLast='',undoStack=[],redoStack=[],lastCapture=0,suppress=false,approvePublish=false;
const asHTML=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=()=>api.getContent();
const status=()=>api.getSaveState();
const newEl=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
function openTab(tab){api.openAdvanced(tab);}
function fillDashboard(){
 const c=data(),k=qs('#studioMetrics'),cards=qs('#studioCards');
 if(!c||!k||!cards)return;
 k.replaceChildren();
 const stats=[['▤','Notícias',(c.articles||[]).length],['♧','Projetos sociais',(c.projects||[]).length],['▥','Atuações',(c.mandate||[]).length],['◇','Perguntas',(c.faq||[]).length]];
 stats.forEach(([icon,label,num])=>{const box=newEl('div','studio-metric');box.innerHTML='<span class="studio-stat-icon">'+icon+'</span><div><strong>'+num+'</strong><small>'+asHTML(label)+'</small></div>';k.append(box)});
 cards.replaceChildren();
 cardDefs.forEach(o=>{
  const btn=newEl('button','studio-card');btn.type='button';btn.innerHTML='<span class="studio-card-top"><span class="studio-card-icon">'+o.icon+'</span><span class="studio-card-meta">'+o.meta+'</span></span><strong>'+asHTML(o.name)+'</strong><p>'+asHTML(o.description)+'</p><span class="studio-card-open">Abrir ferramenta ↗</span>';
  btn.onclick=()=>openTab(o.tab);cards.append(btn);
 });
 const area=qs('#studioPublishStatus');if(area){
  const st=status();
  area.replaceChildren();
  const statusBox=newEl('div','studio-permission '+(st.canPublish?'ready':'pending'));
  statusBox.innerHTML='<span class="studio-permission-mark">'+(st.canPublish?'✓':'!')+'</span><div><strong>'+(st.canPublish?'Permissão de publicação ativa':'Publicação ainda não habilitada')+'</strong><p>'+(st.canPublish?'Você pode salvar rascunhos e publicar depois da revisão.':'O editor e a prévia funcionam; para salvar no GitHub é necessário liberar a credencial de gravação do repositório vereadora.')+'</p></div>';
  area.append(statusBox);
  const draft=newEl('p','studio-dirty',st.dirty?'● Há mudanças que ainda não foram salvas.':'✓ Sem alterações locais pendentes.');area.append(draft);
 }
}
function renderHelp(){
 const root=qs('#studioHelpSteps');if(!root)return;root.replaceChildren();
 tour.forEach((t,i)=>{const b=newEl('button','studio-help-step');b.type='button';b.innerHTML='<span class="studio-help-index">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+asHTML(t.title)+'</strong><small>'+asHTML(t.text)+'</small></div><span class="studio-help-arrow">↗</span>';b.onclick=()=>{openTab(t.id==='preview'||t.id==='publish'||t.id==='save'?'visual':t.id);startTour(i)};root.append(b)});
}
function renderMedia(){
 let root=qs('#studioMedia');
 if(!root){root=newEl('section','studio-media');root.id='studioMedia';qs('#studioHelp').after(root);}
 const c=data();if(!c)return;root.replaceChildren();
 root.innerHTML='<div class="studio-media-head"><span class="kicker">FOTOS DO PORTAL</span><h2>Biblioteca de imagens</h2><p>Estas imagens já estão referenciadas no conteúdo. Clique em Trocar fotografia para abrir a ferramenta certa. Os arquivos só entram no site quando publicados.</p></div>';
 const photos=[];
 const add=(src,title,where,tab)=>{if(typeof src==='string'&&src.trim()&&!photos.some(p=>p.src===src&&p.where===where))photos.push({src,title,where,tab});};
 add(c.hero?.image,'Foto principal','Capa','hero');add(c.about?.image,'Fotografia institucional','Quem somos','about');
 (c.projects||[]).forEach(x=>add(x.image,x.title,'Projeto social','projects'));
 (c.articles||[]).forEach(x=>{const images=x.images?.length?x.images:[x.image];images.forEach((pic,i)=>add(pic,(x.title||'Notícia')+(images.length>1?' · '+(i+1):''),'Notícia','articles'))});
 const grid=newEl('div','studio-media-grid');let count=0;
 photos.forEach(pic=>{
  if(count++>110)return;
  const tile=newEl('article','studio-media-card');
  const img=newEl('img');img.alt=pic.title;img.loading='lazy';
  img.src=pic.src.startsWith('data:')?pic.src:pic.src.startsWith('assets/')?'/'+pic.src:pic.src;
  img.onerror=()=>{img.alt='Foto indisponível';img.classList.add('broken')};
  const info=newEl('div','studio-media-info');const title=newEl('strong','',pic.title);
  const note=newEl('small','',pic.where);const button=newEl('button','btn secondary','✎ Editar foto');button.type='button';button.onclick=()=>openTab(pic.tab);
  info.append(title,note,button);tile.append(img,info);grid.append(tile);
 });
 root.append(grid);
}
function setSections(id){
 const el=qs('#studioMedia');if(el)el.hidden=id!=='media';
 if(id==='dashboard')fillDashboard();
 if(id==='help')renderHelp();
 if(id==='media')renderMedia();
}
function bubble(anchor,title,message){
 let e=qs('#studioHelpBubble');
 if(!e){e=newEl('div','studio-help-bubble');e.id='studioHelpBubble';e.setAttribute('role','status');document.body.append(e);}
 e.replaceChildren();
 e.append(newEl('strong','',title),newEl('p','',message));
 const close=newEl('button','studio-bubble-close','Entendi ✓');close.type='button';close.onclick=()=>e.hidden=true;e.append(close);
 const r=anchor.getBoundingClientRect();e.hidden=false;
 const width=Math.min(315,innerWidth-24);
 e.style.width=width+'px';
 e.style.left=Math.min(innerWidth-width-12,Math.max(12,r.right-width))+'px';
 e.style.top=Math.min(innerHeight-e.offsetHeight-12,Math.max(12,r.bottom+9))+'px';
}
function decorateHelp(){
 // A ajuda é uma ferramenta separada para não colocar <button> dentro de <button>.
 document.querySelectorAll('.sidebar .side-link[data-help]').forEach(link=>{
  if(link.closest('.studio-nav-row'))return;
  const wrapper=newEl('div','studio-nav-row');
  const parent=link.parentNode;parent.insertBefore(wrapper,link);wrapper.append(link);
  const marker=newEl('button','studio-menu-help','?');marker.type='button';marker.title='O que faz esta função?';
  marker.setAttribute('aria-label','Ajuda: '+link.textContent.trim());marker.onclick=e=>{e.stopPropagation();bubble(marker,link.textContent.trim(),link.dataset.help)};
  wrapper.append(marker);
 });
 const form=qs('#editorForm');if(!form)return;
 const observer=new MutationObserver(()=>{
  if(!form.isConnected)return;
  form.querySelectorAll('.field').forEach(field=>{
   if(field.querySelector('.studio-field-help'))return;
   const label=field.querySelector('.field-label');if(!label)return;
   const help=newEl('button','studio-field-help','?');help.type='button';help.title='Ajuda para este campo';
   help.onclick=()=>bubble(help,label.textContent.trim(),'Atualize esta informação. A alteração aparece na prévia imediatamente; só será pública após salvar e publicar.');
   label.after(help);
  });
 });
 observer.observe(form,{childList:true,subtree:true});
}
const dia=qs('#studioTourDialog');
function removeGlow(){if(activeGlow){activeGlow.classList.remove('studio-highlight');activeGlow=null;}}
function tourUpdate(){
 if(!dia)return;
 removeGlow();
 const t=tour[tourAt],loc=qs(t.selector);
 if(loc){loc.classList.add('studio-highlight');activeGlow=loc;loc.scrollIntoView({block:'nearest',behavior:'smooth'});}
 qs('#tourCounter').textContent='Passo '+(tourAt+1)+' de '+tour.length;
 qs('#tourIcon').textContent=t.icon;
 qs('#tourTitle').textContent=t.title;
 qs('#tourText').textContent=t.text;
 const progress=qs('#tourProgress');progress.replaceChildren();
 tour.forEach((_,i)=>{const el=newEl('span',i<=tourAt?'done':'');progress.append(el)});
 qs('#tourPrevious').disabled=tourAt===0;
 qs('#tourNext').textContent=tourAt===tour.length-1?'Concluir ✓':'Próximo →';
}
function startTour(start=0){if(!api.isAuthenticated())return;tourAt=start;dia.show();tourUpdate();}
function stopTour(){removeGlow();dia.close();}
qs('#tourClose').onclick=stopTour;
qs('#tourPrevious').onclick=()=>{tourAt=Math.max(0,tourAt-1);tourUpdate();};
qs('#tourNext').onclick=()=>{if(tourAt===tour.length-1){stopTour();return;}tourAt++;tourUpdate()};
dia.addEventListener('close',removeGlow);
for(const id of ['sideStartTour','topHelp','dashboardTour','helpStartTour']){const btn=qs('#'+id);if(btn)btn.onclick=()=>startTour(0);}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-studio-go]');if(button)openTab(button.dataset.studioGo);
});
const checkDialog=qs('#studioChecklistDialog');
let beforeApproved=false;
function checks(){
 const c=data()||{},a=c.articles||[],p=c.projects||[];
 const active=a.filter(x=>x.title),missing=p.filter(x=>!x.title||!x.image);
 const invalidUrls=a.filter(x=>x.url && !/^https:\/\//i.test(x.url));
 return [
  {ok:!!(c.identity?.name&&c.hero?.line1&&c.hero?.image),required:true,title:'Identidade e capa',desc:'Nome, título e imagem da capa preenchidos.'},
  {ok:missing.length===0,required:true,title:'Projetos sociais',desc:missing.length?missing.length+' projeto(s) sem nome ou foto.':'Projetos com nome e fotografia.'},
  {ok:active.length>0,required:true,title:'Notícias cadastradas',desc:'Pelo menos uma notícia com título.'},
  {ok:invalidUrls.length===0,required:true,title:'Links das notícias',desc:invalidUrls.length?invalidUrls.length+' publicação(ões) com links inválidos.':'Links existentes usam HTTPS.'},
  {ok:!(status().dirty),required:true,title:'Rascunho salvo',desc:'Salve as mudanças antes de publicar.'},
  {ok:true,required:false,title:'Prévia revisada',desc:'Confira a aparência antes de liberar para o público.'}
 ];
}
function openChecklist(){
 const root=qs('#checkItems');root.replaceChildren();
 const entries=checks();
 entries.forEach(item=>{
  const row=newEl('div','studio-check-row '+(item.ok?'ok':'bad'));
  row.innerHTML='<span class="studio-check-symbol">'+(item.ok?'✓':'!')+'</span><div><strong>'+asHTML(item.title)+'</strong><small>'+asHTML(item.desc)+'</small></div>';
  root.append(row);
 });
 const blocked=entries.some(x=>x.required&&!x.ok);
 const button=qs('#checkConfirm');button.disabled=blocked||!api.canPublish();
 button.textContent=blocked?'Corrija as pendências para publicar':'✓ Confirmar publicação';
 checkDialog.showModal();
}
qs('#checkClose').onclick=()=>checkDialog.close();
qs('#checkCancel').onclick=()=>checkDialog.close();
qs('#checkConfirm').onclick=()=>{
 checkDialog.close();beforeApproved=true;qs('#publishButton').click();
};
qs('#publishButton').addEventListener('click',e=>{
 if(beforeApproved){beforeApproved=false;return;}
 if(!api.isAuthenticated()||!api.canPublish()||status().dirty)return;
 e.preventDefault();e.stopImmediatePropagation();openChecklist();
},true);
function initHistory(){
 if(!data())return;
 historyLast=JSON.stringify(data());undoStack=[];redoStack=[];
 updateHistoryButtons();
}
function updateHistoryButtons(){
 const undo=qs('#studioUndo'),redo=qs('#studioRedo');
 if(undo)undo.disabled=undoStack.length===0;
 if(redo)redo.disabled=redoStack.length===0;
}
function changeCaptured(){
 if(suppress||!data())return;
 const json=JSON.stringify(data());
 if(!historyLast){historyLast=json;return;}
 if(json===historyLast)return;
 const now=Date.now();
 if(now-lastCapture>850){undoStack.push(historyLast);if(undoStack.length>30)undoStack.shift();}
 lastCapture=now;redoStack=[];historyLast=json;updateHistoryButtons();
}
function restoreFromHistory(next){
 if(!next)return;
 suppress=true;
 try{api.replaceContent(JSON.parse(next));historyLast=next;}finally{suppress=false;updateHistoryButtons();}
}
function undo(){
 if(!undoStack.length||!data())return;
 redoStack.push(JSON.stringify(data()));
 restoreFromHistory(undoStack.pop());
}
function redo(){
 if(!redoStack.length||!data())return;
 undoStack.push(JSON.stringify(data()));
 restoreFromHistory(redoStack.pop());
}
function addUndo(){
 const box=newEl('div','studio-undo-row');
 box.innerHTML='<button type="button" id="studioUndo" title="Desfazer (Ctrl+Z)" disabled>↶ Desfazer</button><button type="button" id="studioRedo" title="Refazer (Ctrl+Y)" disabled>↷ Refazer</button>';
 qs('.top-actions').insertBefore(box,qs('#topHelp'));
 qs('#studioUndo').onclick=undo;qs('#studioRedo').onclick=redo;
 document.addEventListener('keydown',e=>{
  if(!api.isAuthenticated()||(!e.ctrlKey&&!e.metaKey)||e.altKey)return;
  if(e.target?.matches('input,textarea,[contenteditable=true]'))return;
  if(e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
  if(e.key.toLowerCase()==='y'){e.preventDefault();redo();}
 });
}
function initialize(){
 if(!api.isAuthenticated())return;
 initHistory();fillDashboard();renderHelp();decorateHelp();
 const id=api.getCurrent();setSections(id);
}
addUndo();
document.addEventListener('portal:admin-ready',initialize);
document.addEventListener('portal:studio-route',e=>{setSections(e.detail.id)});
document.addEventListener('portal:admin-change',()=>{changeCaptured();if(api.getCurrent()==='dashboard')fillDashboard();});
document.addEventListener('portal:studio-replaced',()=>{if(api.getCurrent()==='dashboard')fillDashboard();});
})();