/* Editor visual: seleção de blocos pelo próprio site e alteração no rascunho existente. */
(function(){
'use strict';
const editor=window.PortalAdmin;
const $=s=>document.querySelector(s);
const frame=$('#visualFrame'),stage=$('#visualWorkspace');
if(!editor||!frame||!stage)return;
const head=$('#visualInspectorTitle'),hint=$('#visualInspectorHint'),body=$('#visualInspectorBody');
let selected=null,hovered=null,pencil=null,moveHandle=null,dragging=null,frameDoc=null,ready=false,queued=false,previewPending=false;
const active=()=>!stage.hidden&&editor.isAuthenticated()&&!!editor.getContent();
const articleIndex=id=>(editor.getContent()?.articles||[]).findIndex(x=>Number(x.id)===Number(id));
function bind(el,section,opts={}){
 if(!el)return;
 el.classList.add('ve-target');el.dataset.visualTarget='yes';el.__cmsSelection={section,...opts};
}
function annotate(){
 if(!active()||!frame.contentDocument)return;
 const d=frame.contentDocument;
 d.querySelectorAll('[data-visual-target]').forEach(e=>{e.classList.remove('ve-target');e.removeAttribute('data-visual-target');delete e.__cmsSelection;});
 const mark=(sel,section,opts={})=>d.querySelectorAll(sel).forEach(e=>bind(e,section,opts));
 const rows=(sel,section,options)=>[...d.querySelectorAll(sel)].slice(0,120).forEach((e,i)=>{const o=options?options(e,i):{index:i};if(o!==null)bind(e,section,o||{});});
 mark('.brand','identity',{fields:['name','tagline'],title:'Nome e identidade do portal'});
 mark('#mainNav','nav',{title:'Menu do site'});
 rows('#mainNav>a','nav',(_,i)=>({index:i,title:'Item '+(i+1)+' do menu'}));
 mark('.nav-join','identity',{fields:['ctaLabel'],title:'Botão do cabeçalho'});
 mark('.hero-eyebrow','hero',{fields:['eyebrow'],title:'Chamada da capa'});
 mark('#hero-title','hero',{fields:['line1','line2','line3'],title:'Título principal'});
 mark('.hero-text','hero',{fields:['description'],title:'Texto da capa'});
 mark('.hero-image','hero',{fields:['image','photoCredit'],title:'Foto de fundo'});
 mark('.hero-buttons','hero',{fields:['button1','button1Url','button2','button2Url'],title:'Botões principais'});
 mark('.hero-buttons>a:first-child','hero',{fields:['button1','button1Url'],title:'Botão principal'});
 mark('.hero-buttons>a:nth-child(2)','hero',{fields:['button2','button2Url'],title:'Botão secundário'});
 mark('.hero-handwriting','hero',{fields:['handwriting'],title:'Frase sobre a foto'});
 rows('.impact-item','focus',(_,i)=>({index:i,title:'Destaque '+(i+1)}));
 rows('.quick-card','shortcuts',(_,i)=>({index:i,title:'Acesso rápido '+(i+1)}));
 mark('#projects-title','headlines',{fields:['projects'],title:'Título de projetos'});
 mark('#projetos .section-label','misc',{fields:['projectsSectionLabel'],title:'Etiqueta dos projetos'});
 rows('.project-grid .project-card','projects',(_,i)=>({index:i,title:'Projeto social '+(i+1)}));
 mark('#news-title','headlines',{fields:['news'],title:'Título de notícias'});
 rows('.news-rail .news-mini','articles',e=>({index:articleIndex(e.dataset.article),title:'Notícia em destaque'}));
 rows('.headline-card','articles',e=>({index:articleIndex(e.querySelector('[data-article]')?.dataset.article),title:'Notícia principal'}));
 mark('.archive-heading h2','headlines',{fields:['archive','archiveDesc'],title:'Arquivo de notícias'});
 rows('#articleGrid [data-article]','articles',e=>({index:articleIndex(e.dataset.article),title:'Notícia publicada'}));
 mark('.archive-tools','articles',{title:'Organizar notícias'});
 mark('.about-copy h2','about',{fields:['headline','p1','p2'],title:'Quem somos'});
 mark('.about-visual','about',{fields:['image','caption','subcaption'],title:'Foto institucional'});
 mark('.about-copy a.btn','about',{fields:['button','url'],title:'Botão da apresentação'});
 mark('#atuacao .section-header h2','headlines',{fields:['mandate'],title:'Título da atuação pública'});
 rows('.mandate-card','mandate',(_,i)=>({index:i,title:'Atuação pública '+(i+1)}));
 mark('#inscricoes .enroll-grid','enrollment',{title:'Pré-inscrição'});
 mark('#transparencia .section-header','misc',{fields:['trustTitle','trustSectionLabel'],title:'Transparência'});
 rows('.trust-grid>div','trust',(_,i)=>({index:i,title:'Compromisso '+(i+1)}));
 mark('.questions>div:first-child','headlines',{fields:['faq'],title:'Título das perguntas'});
 rows('.question-list details','faq',(_,i)=>({index:i,title:'Pergunta '+(i+1)}));
 mark('.footer','footer',{title:'Rodapé, contatos e links'});
 rows('.footer-menu>div:first-child a','footer',(_,i)=>({index:i,linkGroup:'links1',title:'Link do rodapé — coluna 1'}));
 rows('.footer-menu>div:nth-child(2) a','footer',(_,i)=>({index:i,linkGroup:'links2',title:'Link do rodapé — coluna 2'}));
}
function positionPencil(){
 if(!pencil||!hovered?.isConnected||!active()){if(pencil)pencil.style.display='none';if(moveHandle)moveHandle.style.display='none';return;}
 const rect=hovered.getBoundingClientRect(),width=frame.contentWindow.innerWidth,height=frame.contentWindow.innerHeight;
 if(rect.bottom<0||rect.top>height||rect.right<0||rect.left>width){pencil.style.display='none';if(moveHandle)moveHandle.style.display='none';return;}
 pencil.style.display='flex';
 pencil.style.left=Math.max(6,Math.min(width-165,rect.right-155))+'px';
 pencil.style.top=Math.max(6,Math.min(height-44,rect.top+6))+'px';
 if(moveHandle){
  const show=hovered.__cmsSelection?.section==='enrollment';
  moveHandle.style.display=show?'flex':'none';
  if(show){moveHandle.style.left=pencil.style.left;moveHandle.style.top=Math.max(6,Math.min(height-44,rect.top+49))+'px';}
 }
}
function showInspector(sel){
 if(!active()||!sel)return;
 const site=editor.getContent(),section=sel.section,def=editor.getSection(section);
 if(!def)return;
 const index=Number.isInteger(sel.index)?sel.index:null;
 const obj=sel.linkGroup?site.footer?.[sel.linkGroup]?.[index]:(index===null?site[section]:site[section]?.[index]);
 if(!obj|| (def.collection&&index===null)){editor.openAdvanced(section);return;}
 selected=sel;head.textContent=sel.title||def.title;hint.textContent=def.hint||'Altere os campos e veja o resultado ao lado.';
 body.replaceChildren();
 let spec=sel.linkGroup?[['title','Nome do link'],['url','Destino do link','url']]:(def.collection?def.spec:def.fields||[]);
 if(sel.fields?.length)spec=spec.filter(x=>sel.fields.includes(x[0]));
 if(spec.length)editor.renderFields(body,obj,spec);
 if(section==='enrollment'&&Array.isArray(def.appearanceFields)){
  const heading=document.createElement('h3');heading.className='group-heading';heading.textContent='✥ Posição, cores, fontes e tamanhos';
  body.append(heading);
  const tip=document.createElement('p');tip.className='section-note';tip.textContent='Arraste usando o botão ✥ Mover na prévia, ajuste os controles ou altere a ordem da seção na página. O tamanho original é mantido até você modificar.';body.append(tip);
  editor.renderFields(body,obj,def.appearanceFields);
 }
 else {const txt=document.createElement('p');txt.className='visual-field-note';txt.textContent='Use a edição completa para cadastrar e organizar os itens desta área.';body.append(txt);}
 if(index!==null){const txt=document.createElement('p');txt.className='visual-field-note';txt.textContent='Editando o item '+(index+1)+'. As alterações aparecem imediatamente na página.';body.prepend(txt);}
 if(def.collection||section==='enrollment'||section==='footer'){
  const add=document.createElement('button');add.type='button';add.className='add-btn';add.textContent='＋ Adicionar, excluir ou reorganizar itens';add.onclick=()=>editor.openAdvanced(section);body.append(add);
 }
 $('#visualAdvanced').textContent='✎ Abrir edição completa: '+def.title;
 frame.contentDocument?.querySelector('.ve-current')?.classList.remove('ve-current');
 if(hovered?.isConnected)hovered.classList.add('ve-current');
 $('#visualInspector').scrollTop=0;
}
function installFrame(){
 if(!active()||!frame.contentDocument)return;
 frameDoc=frame.contentDocument;ready=true;
 const d=frameDoc;
 d.getElementById('cmsVisualPencil')?.remove();
 d.getElementById('cmsVisualMove')?.remove();
 d.getElementById('cmsVisualStyle')?.remove();
 const css=d.createElement('style');css.id='cmsVisualStyle';
 css.textContent='.ve-target{cursor:pointer!important;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s,filter .15s}.ve-target:hover,.ve-target.ve-current{outline:2px dashed #12a979!important;outline-offset:3px}#cmsVisualPencil{position:fixed;z-index:2147483600;max-width:185px;border:1px solid #aeefd2;background:linear-gradient(135deg,#0a7655,#10a673);color:#fff;padding:8px 12px;border-radius:9px;box-shadow:0 8px 24px #02452e45;font:700 12px/1.2 "Segoe UI",Arial,sans-serif;cursor:pointer;display:none;align-items:center;gap:7px;white-space:nowrap;outline:2px solid #fff}#cmsVisualPencil:hover,#cmsVisualPencil:focus-visible{background:#064d3a}#cmsVisualMove{position:fixed;z-index:2147483601;background:linear-gradient(135deg,#d5f6ad,#8fd6a5);color:#13412e;border:2px solid #fff;border-radius:9px;padding:8px 10px;font:800 12px/1.2 "Segoe UI",Arial,sans-serif;box-shadow:0 9px 22px #124a3050;cursor:grab;touch-action:none;user-select:none;display:none;align-items:center;gap:5px}#cmsVisualMove:active{cursor:grabbing}html{scroll-behavior:auto!important}';
 d.head.append(css);
 pencil=d.createElement('button');pencil.type='button';pencil.id='cmsVisualPencil';pencil.textContent='✎ Editar este bloco';d.body.append(pencil);
 pencil.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(hovered?.__cmsSelection)showInspector(hovered.__cmsSelection);});
 moveHandle=d.createElement('button');moveHandle.type='button';moveHandle.id='cmsVisualMove';moveHandle.textContent='✥ Mover bloco';moveHandle.title='Arraste para mudar a posição do bloco de pré-inscrição';d.body.append(moveHandle);
 moveHandle.addEventListener('pointerdown',e=>{
  if(!active()||hovered?.__cmsSelection?.section!=='enrollment')return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const obj=editor.getContent().enrollment||{},x=Number(obj.offsetX)||0,y=Number(obj.offsetY)||0;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,offsetX:x,offsetY:y};
  moveHandle.setPointerCapture(e.pointerId);
  showInspector({section:'enrollment',title:'Pré-inscrição · Mover e personalizar'});
 });
 moveHandle.addEventListener('pointermove',e=>{
  if(!dragging||e.pointerId!==dragging.id||!active())return;
  e.preventDefault();e.stopPropagation();
  const obj=editor.getContent().enrollment,clamp=(n)=>Math.max(-100,Math.min(100,Math.round(n)));
  obj.offsetX=clamp(dragging.offsetX+e.clientX-dragging.x);
  obj.offsetY=clamp(dragging.offsetY+e.clientY-dragging.y);
  for(const [key,value] of [['offsetX',obj.offsetX],['offsetY',obj.offsetY]]){
   const inp=body.querySelector('input[id^="fld-'+key+'"]');
   if(inp){inp.value=String(value);const display=inp.parentElement?.querySelector('.cms-range-value');if(display)display.textContent=value+' px';}
  }
  editor.notifyChange();
 });
 const stopMove=e=>{if(dragging&&e.pointerId===dragging.id){dragging=null;positionPencil();}};
 moveHandle.addEventListener('pointerup',stopMove);
 moveHandle.addEventListener('pointercancel',stopMove);

 d.addEventListener('mouseover',e=>{if(!active()||!e.target?.closest)return;if(e.target.closest('#cmsVisualPencil,#cmsVisualMove'))return;const el=e.target.closest('[data-visual-target]');if(el){hovered=el;positionPencil()}else{hovered=null;pencil.style.display='none';if(moveHandle)moveHandle.style.display='none';}},true);
 d.addEventListener('click',e=>{if(!active()||e.target?.closest?.('#cmsVisualPencil,#cmsVisualMove'))return;const el=e.target?.closest?.('[data-visual-target]');if(el){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hovered=el;showInspector(el.__cmsSelection);}else if(e.target.closest('a,button,form,[role=button]')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}},true);
 d.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
 d.addEventListener('scroll',positionPencil,{passive:true,capture:true});
 frame.contentWindow.addEventListener('resize',positionPencil);
 sync();
}
function sync(){
 if(!active()||!frame.contentWindow)return;
 if(queued){previewPending=true;return;}
 queued=true;
 frame.contentWindow.postMessage({type:'PORTAL_CMS_PREVIEW',content:structuredClone(editor.getContent())},location.origin);
 setTimeout(()=>{
  queued=false;annotate();positionPencil();
  if(previewPending){previewPending=false;sync();}
 },55);
}
function activate(){
 if(!active())return;
 const d=frame.contentDocument;
 if(d?.readyState==='complete'||d?.readyState==='interactive'){
  if(!ready||frameDoc!==d)installFrame();else sync();
 }
}
frame.addEventListener('load',installFrame);
document.addEventListener('portal:admin-ready',activate);
document.addEventListener('portal:visual-open',activate);
document.addEventListener('portal:admin-change',sync);
$('#visualRefresh').addEventListener('click',()=>{ready=false;frame.src='/?preview=1&visual=1&t='+Date.now();});
$('#visualDesktop').addEventListener('click',()=>{$('#visualFrameWrap').classList.remove('as-mobile');$('#visualDesktop').classList.add('active');$('#visualMobile').classList.remove('active');});
$('#visualMobile').addEventListener('click',()=>{$('#visualFrameWrap').classList.add('as-mobile');$('#visualMobile').classList.add('active');$('#visualDesktop').classList.remove('active');});
$('#visualAdvanced').addEventListener('click',()=>editor.openAdvanced(selected?.section||'identity'));
if(editor.isAuthenticated())activate();
})();