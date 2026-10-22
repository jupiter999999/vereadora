/* Portal V3 — executa localmente, sem bibliotecas, servidores ou conexões para cadastro. */
'use strict';
let publicacoes = Array.isArray(window.PORTAL_PUBLICACOES) ? window.PORTAL_PUBLICACOES : [];
let byId = new Map(publicacoes.map(p=>[Number(p.id),p]));
let galleryPhotos=[];let galleryIndex=0;
const articleDialog = document.getElementById('articleDialog');
const articleContent = document.getElementById('articleContent');
const formDialog = document.getElementById('formDialog');
const newsSearch = document.getElementById('newsSearch');
const newsCategory = document.getElementById('newsCategory');
const articleGrid = document.getElementById('articleGrid');
const showMore = document.getElementById('showMore');
const resultsInfo = document.getElementById('resultsInfo');
let visibleCount = 8;

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function dateBR(iso){const parts=String(iso).split('-').map(Number);if(parts.length!==3||!parts[0])return iso;return new Date(Date.UTC(parts[0],parts[1]-1,parts[2])).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});}
function safeImg(s){if(typeof s!=='string')return '';if(/^assets\/cms\/[a-z0-9-]+\.webp$/i.test(s)&&new URLSearchParams(location.search).has('preview'))return 'https://raw.githubusercontent.com/jupiter999999/vereadora/cms/rascunho/'+s;return (/^assets\/[a-z0-9/_-]+\.(webp|png|jpg|jpeg)$/i.test(s)||/^data:image\/webp;base64,[a-z0-9+/=]+$/i.test(s))?s:'';}
function canonical(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function filtered(){const cat=newsCategory.value;const term=canonical(newsSearch.value.trim());return publicacoes.filter(p=>(cat==='Todos'||p.category===cat)&&(!term||canonical([p.title,p.category,p.text,p.status].join(' ')).includes(term))).sort((a,b)=>b.date.localeCompare(a.date));}
function renderArchive(){
 const all=filtered(),shown=all.slice(0,visibleCount);
 if(!all.length){articleGrid.innerHTML='<p>Nenhuma publicação encontrada. Tente outra busca.</p>';}
 else {articleGrid.innerHTML=shown.map(p=>`<button type="button" class="archive-item" data-article="${Number(p.id)}" aria-label="Ler: ${escapeHtml(p.title)}">${safeImg(p.image)?`<img loading="lazy" src="${safeImg(p.image)}" alt="Foto original vinculada à notícia">`:'<span class="placeholder-img"><svg><use href="#i-news"/></svg></span>'}<span class="archive-body"><small>${escapeHtml(p.category).toUpperCase()}</small><strong>${escapeHtml(p.title)}</strong><time datetime="${escapeHtml(p.date)}">${escapeHtml(dateBR(p.date))}</time></span></button>`).join('');}
 showMore.hidden=all.length<=visibleCount;resultsInfo.textContent=`${shown.length} de ${all.length} publicações`;
}
newsSearch.addEventListener('input',()=>{visibleCount=8;renderArchive();});
newsCategory.addEventListener('change',()=>{visibleCount=8;renderArchive();});
showMore.addEventListener('click',()=>{visibleCount+=8;renderArchive();});
document.getElementById('openSearch').addEventListener('click',()=>{document.getElementById('arquivo').scrollIntoView({behavior:'smooth'});setTimeout(()=>newsSearch.focus({preventScroll:true}),350);});
function openArticle(id){
 const p=byId.get(Number(id));if(!p)return;
 const uri=/^https:\/\/[a-z0-9.-]+\/[a-z0-9\-_/?#=&%.]*$/i.test(p.url)?p.url:'';
 galleryPhotos=(Array.isArray(p.images)&&p.images.length?p.images:[p.image]).map(safeImg).filter(Boolean);galleryIndex=0;
 articleContent.innerHTML=`${galleryPhotos.length?`<div class="cms-gallery"><img class="article-modal-image" src="${galleryPhotos[0]}" alt="Imagem da publicação"><div class="cms-gallery-controls" ${galleryPhotos.length===1?'hidden':''}><button type="button" class="cms-gallery-prev" aria-label="Foto anterior">‹</button><span class="cms-gallery-counter">1 / ${galleryPhotos.length}</span><button type="button" class="cms-gallery-next" aria-label="Próxima foto">›</button></div></div>`:''}<div class="article-modal-body"><small>${escapeHtml(p.category).toUpperCase()}</small><h2>${escapeHtml(p.title)}</h2><div class="article-date">Publicado em ${escapeHtml(dateBR(p.date))}</div><div class="article-note"><strong>Situação e contexto:</strong> ${escapeHtml(p.status)}. Informações extraídas do material recebido; verifique sempre a fonte original.</div><div class="article-text">${escapeHtml(p.text)}</div>${uri?`<a class="btn btn-primary article-original" target="_blank" rel="noopener noreferrer" href="${uri}">Ver publicação original <svg><use href="#i-arrow"/></svg></a>`:''}</div>`;
 articleDialog.showModal();
}
const form = document.getElementById('demoForm');
const one = document.querySelector('.step-one');
const two = document.querySelector('.step-two');
const done = document.querySelector('.step-done');
const error = document.getElementById('formError');
function resetForm(){form.reset();one.hidden=false;two.hidden=true;done.hidden=true;error.textContent='';}
function openEnrollment(){resetForm();formDialog.showModal();}
function closeDialog(dialog){if(dialog.open)dialog.close();}
document.addEventListener('click',event=>{
 const arrow=event.target.closest('.cms-gallery-prev,.cms-gallery-next');if(arrow&&galleryPhotos.length){galleryIndex=(galleryIndex+(arrow.classList.contains('cms-gallery-next')?1:-1)+galleryPhotos.length)%galleryPhotos.length;const img=articleContent.querySelector('.cms-gallery img');if(img)img.src=galleryPhotos[galleryIndex];const counter=articleContent.querySelector('.cms-gallery-counter');if(counter)counter.textContent=(galleryIndex+1)+' / '+galleryPhotos.length;return;}
 const news=event.target.closest('[data-article]');if(news){openArticle(news.dataset.article);return;}
 if(event.target.closest('[data-open-enrollment]')){openEnrollment();return;}
 if(event.target.closest('[data-close]')){const d=event.target.closest('dialog');if(d)closeDialog(d);}
});
for(const dialog of [articleDialog,formDialog]){
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog(dialog);});
}
formDialog.addEventListener('close',resetForm);
document.getElementById('formNext').addEventListener('click',()=>{
 const project=document.getElementById('demoProject');if(!project.value){project.reportValidity();return;}
 one.hidden=true;two.hidden=false;error.textContent='';document.getElementById('demoName').focus();
});
document.getElementById('formBack').addEventListener('click',()=>{two.hidden=true;one.hidden=false;error.textContent='';});
form.addEventListener('submit',event=>{
 event.preventDefault();
 const name=document.getElementById('demoName'),bairro=document.getElementById('demoBairro'),agree=document.getElementById('demoAgree');
 if(!name.value.trim()||!bairro.value.trim()||!agree.checked){error.textContent='Complete os campos de exemplo e confirme que isto não é uma inscrição.';return;}
 // Nunca envia nem armazena os dados: somente confirma visualmente a demonstração.
 name.value='';bairro.value='';agree.checked=false;
 two.hidden=true;done.hidden=false;error.textContent='';
});
const mainNav=document.getElementById('mainNav');
const menuButton=document.getElementById('menuButton');
menuButton.addEventListener('click',()=>{const show=!mainNav.classList.contains('open');mainNav.classList.toggle('open',show);menuButton.setAttribute('aria-expanded',String(show));menuButton.setAttribute('aria-label',show?'Fechar menu':'Abrir menu');});
mainNav.addEventListener('click',e=>{if(e.target.closest('a')||e.target.closest('button')){mainNav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}});
// Atualiza link ativo ao navegar pelas seções principais.
mainNav.addEventListener('click',e=>{const link=e.target.closest('a');if(link){mainNav.querySelectorAll('a').forEach(a=>a.classList.remove('nav-active'));link.classList.add('nav-active');}});
document.addEventListener('portal:articles',e=>{if(!Array.isArray(e.detail))return;publicacoes=e.detail;byId=new Map(publicacoes.map(p=>[Number(p.id),p]));const selected=newsCategory.value;newsCategory.innerHTML='<option value="Todos">Todos os assuntos</option>'+[...new Set(publicacoes.map(p=>p.category).filter(Boolean))].sort().map(c=>'<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>').join('');if([...newsCategory.options].some(o=>o.value===selected))newsCategory.value=selected;visibleCount=8;renderArchive();});
renderArchive();
