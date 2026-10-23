/* Editor visual: seleção de blocos pelo próprio site e alteração no rascunho existente. */
(function(){
'use strict';
const editor=window.PortalAdmin;
const $=s=>document.querySelector(s);
const frame=$('#visualFrame'),stage=$('#visualWorkspace');
if(!editor||!frame||!stage)return;
const head=$('#visualInspectorTitle'),hint=$('#visualInspectorHint'),body=$('#visualInspectorBody');
let selected=null,hovered=null,pencil=null,frameDoc=null,ready=false,queued=false;
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
 mark('.nav-join','identity',{fields:['ctaLabel'],title:'Botão do cabeçalho'});
 mark('.hero-eyebrow','hero',{fields:['eyebrow'],title:'Chamada da capa'});
 mark('#hero-title','hero',{fields:['line1','line2','line3'],title:'Título principal'});
 mark('.hero-text','hero',{fields:['description'],title:'Texto da capa'});
 mark('.hero-image','hero',{fields:['image','photoCredit'],title:'Foto de fundo'});
 mark('.hero-buttons','hero',{fields:['button1','button1Url','button2','button2Url'],title:'Botões principais'});
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
}
function positionPencil(){
 if(!pencil||!hovered?.isConnected||!active()){if(pencil)pencil.style.display='none';return;}
 const rect=hovered.getBoundingClientRect(),width=frame.contentWindow.innerWidth,height=frame.contentWindow.innerHeight;
 if(rect.bottom<0||rect.top>height||rect.right<0||rect.left>width){pencil.style.display='none';return;}
 pencil.style.display='flex';
 pencil.style.left=Math.max(6,Math.min(width-165,rect.right-155))+'px';
 pencil.style.top=Math.max(6,Math.min(height-44,rect.top+6))+'px';
}
function showInspector(sel){
 if(!active()||!sel)return;
 const site=editor.getContent(),section=sel.section,def=editor.getSection(section);
 if(!def)return;
 const index=Number.isInteger(sel.index)?sel.index:null;
 const obj=index===null?site[section]:site[section]?.[index];
 if(!obj){editor.openAdvanced(section);return;}
 selected=sel;head.textContent=sel.title||def.title;hint.textContent=def.hint||'Altere os campos e veja o resultado ao lado.';
 body.replaceChildren();
 let spec=def.collection?def.spec:def.fields||[];
 if(sel.fields?.length)spec=spec.filter(x=>sel.fields.includes(x[0]));
 if(spec.length)editor.renderFields(body,obj,spec);
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
 d.getElementById('cmsVisualStyle')?.remove();
 const css=d.createElement('style');css.id='cmsVisualStyle';
 css.textContent='.ve-target{cursor:pointer!important;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s,filter .15s;position:relative}.ve-target:hover,.ve-target.ve-current{outline:2px dashed #12a979!important;outline-offset:3px}#cmsVisualPencil{position:fixed;z-index:2147483600;max-width:185px;border:1px solid #aeefd2;background:linear-gradient(135deg,#0a7655,#10a673);color:#fff;padding:8px 12px;border-radius:9px;box-shadow:0 8px 24px #02452e45;font:700 12px/1.2 "Segoe UI",Arial,sans-serif;cursor:pointer;display:none;align-items:center;gap:7px;white-space:nowrap;outline:2px solid #fff}#cmsVisualPencil:hover,#cmsVisualPencil:focus-visible{background:#064d3a}html{scroll-behavior:auto!important}';
 d.head.append(css);
 pencil=d.createElement('button');pencil.type='button';pencil.id='cmsVisualPencil';pencil.textContent='✎ Editar este bloco';d.body.append(pencil);
 pencil.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(hovered?.__cmsSelection)showInspector(hovered.__cmsSelection);});
 d.addEventListener('mouseover',e=>{if(!active()||!e.target?.closest)return;if(e.target.closest('#cmsVisualPencil'))return;const el=e.target.closest('[data-visual-target]');if(el){hovered=el;positionPencil()}else{hovered=null;pencil.style.display='none';}},true);
 d.addEventListener('click',e=>{if(!active()||e.target?.closest?.('#cmsVisualPencil'))return;const el=e.target?.closest?.('[data-visual-target]');if(el){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();hovered=el;showInspector(el.__cmsSelection);}else if(e.target.closest('a,button,form,[role=button]')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}},true);
 d.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
 d.addEventListener('scroll',positionPencil,{passive:true,capture:true});
 frame.contentWindow.addEventListener('resize',positionPencil);
 sync();
}
function sync(){
 if(!active()||!frame.contentWindow)return;
 frame.contentWindow.postMessage({type:'PORTAL_CMS_PREVIEW',content:structuredClone(editor.getContent())},location.origin);
 if(queued)return;queued=true;
 setTimeout(()=>{queued=false;annotate();positionPencil();},100);
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