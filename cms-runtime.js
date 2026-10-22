/* Camada pública do editor: mantém o HTML original como fallback SEO e atualiza só o conteúdo publicado. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=x=>{const s=String(x||'').trim();return /^(#[a-zA-Z0-9_-]+|https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:[+0-9 -]+)$/.test(s)?s:'#inicio';};
const photo=x=>{const s=String(x||'').trim();return /^assets\/[a-z0-9/_-]+\.(webp|png|jpg|jpeg)$/i.test(s)||/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(s)?s:'';};
const svgArrow='<svg><use href="#i-arrow"/></svg>';
const pick=(s,root=document)=>root.querySelector(s);
const all=(s,root=document)=>[...root.querySelectorAll(s)];
const setText=(s,text)=>{const e=pick(s);if(e&&text!==undefined)e.textContent=String(text);};
const setImg=(s,url)=>{const e=pick(s),p=photo(url);if(e&&p)e.src=p;};
const setAnchor=(el,x)=>{if(!el)return;el.href=link(x);if(/^https:\/\//.test(el.href)){el.target='_blank';el.rel='noopener noreferrer';}};
const safeId=n=>Number.isSafeInteger(Number(n))?Number(n):0;
function render(data){
 if(!data||typeof data!=='object')return;
 window.PORTAL_CMS_DATA=data;
 if(Array.isArray(data.articles)){window.PORTAL_PUBLICACOES=data.articles;document.dispatchEvent(new CustomEvent('portal:articles',{detail:data.articles}));}
 const id=data.identity||{},h=data.hero||{},head=data.headlines||{},about=data.about||{},enr=data.enrollment||{},foot=data.footer||{};
 setText('.brand strong',id.name);setText('.brand small',id.tagline);document.title=(id.name||'Cláudia Bezerra')+' | '+(id.tagline||'Itaitinga em Movimento');
 if(Array.isArray(data.nav)){
  const nav=pick('#mainNav');if(nav)nav.innerHTML=data.nav.map((x,i)=>'<a href="'+esc(link(x.url))+'" class="'+(!i?'nav-active':'')+'">'+esc(x.title)+'</a>')+'<button type="button" class="btn btn-primary mobile-join" data-open-enrollment>Pré-inscrição '+svgArrow+'</button>';
 }
 const eyebrow=pick('.hero-eyebrow');if(eyebrow)eyebrow.innerHTML='<span></span>'+esc(h.eyebrow||'');
 const heroTitle=pick('#hero-title');if(heroTitle)heroTitle.innerHTML=esc(h.line1||'')+'<br>'+esc(h.line2||'')+'<br><em>'+esc(h.line3||'')+'</em>';
 setText('.hero-text',h.description);setText('.hero-photo-credit',h.photoCredit);
 setImg('.hero-image img',h.image);setText('.hero-handwriting',h.handwriting);
 const b1=pick('.hero-buttons a:first-child'),b2=pick('.hero-buttons a:nth-child(2)');
 if(b1){b1.innerHTML=esc(h.button1||'Conheça os projetos')+' '+svgArrow;setAnchor(b1,h.button1Url);}
 if(b2){b2.textContent=h.button2||'Acompanhar notícias';setAnchor(b2,h.button2Url);}
 if(Array.isArray(data.focus))all('.impact-item').forEach((el,i)=>{const x=data.focus[i];if(!x){el.hidden=true;return;}el.hidden=false;const strong=pick('strong',el),span=pick('span',el);if(strong)strong.textContent=x.title||'';if(span)span.textContent=x.description||'';});
 const icons=['#i-people','#i-form','#i-news','#i-bars'],colors=['green','amber','blue','rose'];
 if(Array.isArray(data.shortcuts)){const el=pick('.quick-grid');if(el)el.innerHTML=data.shortcuts.map((x,i)=>'<a class="quick-card" href="'+esc(link(x.url))+'"><span class="quick-icon '+colors[i%4]+'"><svg><use href="'+icons[i%4]+'"/></svg></span><span class="quick-text"><strong>'+esc(x.title)+'</strong><small>'+esc(x.description)+'</small><span class="quick-link">'+esc(x.label||'Saiba mais')+' '+svgArrow+'</span></span></a>').join('');}
 setText('#projects-title',head.projects);setText('#news-title',head.news);
 const projects=pick('.project-grid');if(projects&&Array.isArray(data.projects))projects.innerHTML=data.projects.map(x=>'<article class="project-card"><button type="button" class="image-button" data-article="'+safeId(x.articleId)+'" aria-label="'+esc(x.title)+'"><img src="'+esc(photo(x.image))+'" alt="'+esc(x.title)+'" loading="lazy"></button><div class="project-body"><span class="category-pill">'+esc(x.category)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><button type="button" data-article="'+safeId(x.articleId)+'" class="article-action">'+esc(x.button||'Saiba mais')+' '+svgArrow+'</button></div></article>').join('');
 const archive=pick('.archive-heading h2');if(archive&&head.archive)archive.textContent=head.archive;
 setText('.archive-heading p:not(.section-label)',head.archiveDesc);
 if(data.articles?.length&&Array.isArray(data.featuredNewsIds)){
  const items=data.featuredNewsIds.map(n=>data.articles.find(x=>Number(x.id)===Number(n))).filter(Boolean);
  if(items.length){
   const top=items[0], p=pick('.headline-image');
   if(p){p.dataset.article=top.id;const image=(top.images||[])[0]||top.image;p.innerHTML='<img src="'+esc(photo(image))+'" loading="lazy" alt="'+esc(top.title)+'"><span class="headline-gradient"></span><span class="headline-overlay"><span class="headline-tag">'+esc(top.category)+'</span><strong>'+esc(top.title)+'</strong><span class="headline-meta">'+esc(top.date)+'</span></span><span class="headline-arrow">'+svgArrow+'</span>';}
   const rail=pick('.news-rail');if(rail)rail.innerHTML=items.slice(1,5).map(x=>'<button type="button" data-article="'+safeId(x.id)+'" class="news-mini"><img src="'+esc(photo((x.images||[])[0]||x.image))+'" loading="lazy" alt="'+esc(x.title)+'"><span><small>'+esc(x.category)+'</small><strong>'+esc(x.title)+'</strong><time datetime="'+esc(x.date)+'">'+esc(x.date)+'</time></span></button>').join('');
  }
 }
 setText('.about-copy h2',about.headline);
 const aboutP=all('.about-copy>p:not(.section-label)');if(aboutP[0]&&about.p1!==undefined)aboutP[0].textContent=about.p1;if(aboutP[1]&&about.p2!==undefined)aboutP[1].textContent=about.p2;
 setImg('.about-visual img',about.image);setText('.about-caption',about.caption);
 const cap=pick('.about-caption');if(cap)cap.innerHTML=esc(about.caption||'')+'<br><small>'+esc(about.subcaption||'')+'</small>';
 const aboutBtn=pick('.about-copy a.btn');if(aboutBtn){aboutBtn.innerHTML=esc(about.button||'Conhecer perfil')+' '+svgArrow;setAnchor(aboutBtn,about.url);}
 setText('#atuacao .section-header h2',head.mandate);
 const mandate=pick('.mandate-grid');if(mandate&&Array.isArray(data.mandate))mandate.innerHTML=data.mandate.map((x,i)=>'<button type="button" data-article="'+safeId(x.articleId)+'" class="mandate-card"><span class="mandate-index">'+String(i+1).padStart(2,'0')+' / '+esc(x.category)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><span class="mandate-end"><span>'+esc(x.status)+'</span>'+svgArrow+'</span></button>').join('');
 const en=pick('.enroll-grid h2');if(en)en.textContent=enr.headline||'';setText('.enroll-grid>div:first-child>p:not(.section-label)',enr.description);
 const enBtn=pick('.enroll-action button');if(enBtn)enBtn.innerHTML=esc(enr.button||'Conhecer a pré-inscrição')+' '+svgArrow;
 setText('.enroll-action>span',enr.warning);
 const projSel=pick('#demoProject');if(projSel&&Array.isArray(enr.projects))projSel.innerHTML='<option value="">Escolha uma atividade</option>'+enr.projects.map(x=>'<option value="'+esc(x.title)+'">'+esc(x.title)+' — '+esc(x.status||'disponibilidade a confirmar')+'</option>').join('');
 setText('.footer-brand',foot.heading);const fbrand=pick('.footer-brand');if(fbrand)fbrand.innerHTML=esc(foot.heading||'')+'<span>'+esc(foot.tagline||'')+'</span>';
 setText('.footer-top>div:first-child>p',foot.description);setText('.footer-bottom>span:first-child',foot.copyright);setText('.footer-bottom>span:nth-child(2)',foot.notice);
 const groups=all('.footer-menu>div');for(const [i,xs,title] of [[0,foot.links1,foot.menu1Title],[1,foot.links2,foot.menu2Title]])if(groups[i]&&Array.isArray(xs))groups[i].innerHTML='<strong>'+esc(title||'')+'</strong>'+xs.map(x=>'<a href="'+esc(link(x.url))+'" '+(String(x.url).startsWith('https://')?'target="_blank" rel="noopener noreferrer"':'')+'>'+esc(x.title)+'</a>').join('');
 setText('.questions h2',head.faq);
 // Os valores de contato e endereço podem aparecer como informação adicional no rodapé.
 let contact=pick('#cms-contact');if(!contact){contact=document.createElement('p');contact.id='cms-contact';contact.className='cms-footer-contact';const top=pick('.footer-top>div:first-child');top?.append(contact);}
 contact.textContent=[foot.address,foot.contact].filter(Boolean).join(' · ');
}
window.PortalCMS={render};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='PORTAL_CMS_PREVIEW')return;render(e.data.content);});
const q=new URLSearchParams(location.search);
if(q.has('preview')){document.documentElement.dataset.preview='true';}
fetch('/dados/site.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('CMS indisponível');return r.json()}).then(render).catch(()=>{});
})();