'use strict';
const $=s=>document.querySelector(s), H=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const assetSrc=s=>typeof s==='string'&&s.startsWith('assets/cms/')?'https://raw.githubusercontent.com/jupiter999999/vereadora/cms/rascunho/'+s:s;
const sections={
 identity:{title:'Identidade do site',hint:'Nome, descrição e endereço dos links institucionais.',fields:[['name','Nome exibido no site'],['tagline','Subtítulo / marca'],['description','Descrição do portal','textarea'],['instagram','Instagram oficial','url'],['ctaLabel','Texto do botão de inscrição']]},
 hero:{title:'Capa e fundo principal',hint:'Edite os três trechos do título, botões e a fotografia principal.',fields:[['eyebrow','Texto acima do título'],['line1','Título — linha 1'],['line2','Título — linha 2'],['line3','Título — trecho em verde'],['description','Texto da capa','textarea'],['image','Imagem de fundo','image','hero'],['photoCredit','Legenda da fotografia'],['handwriting','Frase decorativa','textarea'],['button1','Texto do botão principal'],['button1Url','Destino do botão principal','url'],['button2','Texto do segundo botão'],['button2Url','Destino do segundo botão','url']]},
 nav:{title:'Cabeçalho e menu',hint:'Crie, organize e ajuste todos os links da navegação.',collection:true,spec:[['title','Nome exibido'],['url','Destino (ex.: #projetos ou https://...)','url']]},
 focus:{title:'Faixa de destaques',hint:'Textos da faixa verde abaixo da capa.',collection:true,spec:[['title','Título'],['description','Texto de apoio']]},
 shortcuts:{title:'Acessos rápidos e botões',hint:'Cards de acesso rápido que aparecem logo abaixo da capa.',collection:true,spec:[['title','Título'],['description','Descrição','textarea'],['label','Texto do botão'],['url','Destino do botão','url']]},
 projects:{title:'Projetos sociais',hint:'Adicione projetos, troque fotos e associe cada projeto a uma notícia.',collection:true,spec:[['title','Nome do projeto'],['category','Categoria'],['description','Descrição do projeto','textarea'],['image','Imagem de capa','image','project'],['articleId','Notícia relacionada','article'],['button','Texto do botão']]},
 articles:{title:'Notícias e publicações',hint:'Cadastre novas notícias, galerias com várias fotos e escolha as notícias que aparecem na capa.',collection:true,spec:[['title','Título da notícia'],['category','Assunto / categoria'],['date','Data da publicação','date'],['status','Situação ou contexto'],['text','Texto completo da notícia','textarea'],['url','Link da publicação original','url'],['images','Galeria de fotos','gallery','news']],filter:true},
 mandate:{title:'Atuação pública',hint:'Destaques sobre propostas e indicações. Diferencie sempre proposta de lei aprovada.',collection:true,spec:[['title','Título'],['category','Área temática'],['description','Descrição','textarea'],['status','Situação atual'],['articleId','Notícia relacionada','article']]},
 about:{title:'Quem somos',hint:'Foto institucional, apresentação e link oficial.',fields:[['headline','Título da seção'],['p1','Primeiro parágrafo','textarea'],['p2','Segundo parágrafo','textarea'],['image','Fotografia institucional','image','portrait'],['caption','Legenda da foto'],['subcaption','Subtítulo da legenda'],['button','Texto do botão'],['url','Destino do botão','url']]},
 enrollment:{title:'Área de pré-inscrição',hint:'Edite os textos e os projetos disponíveis na demonstração. O cadastro real permanece desativado.',fields:[['headline','Título da inscrição'],['description','Descrição da inscrição','textarea'],['button','Botão de chamada'],['warning','Aviso de segurança']],nested:['projects',[['title','Projeto'],['status','Condição / disponibilidade']]]},
 footer:{title:'Rodapé e contato',hint:'Altere nomes, créditos, endereço, contato e os links do rodapé.',fields:[['heading','Nome no rodapé'],['tagline','Subtítulo'],['description','Mensagem institucional','textarea'],['copyright','Texto de direitos autorais'],['notice','Nota pública'],['address','Endereço / município'],['contact','Contato / telefone / e-mail'],['menu1Title','Título da coluna 1'],['menu2Title','Título da coluna 2']],nestedMany:[['links1','Links da coluna 1'],['links2','Links da coluna 2']]},
 headlines:{title:'Títulos das seções',hint:'Personalize os títulos grandes usados no portal.',fields:[['projects','Título de projetos'],['news','Título de notícias'],['archive','Título do arquivo'],['archiveDesc','Descrição acima do arquivo','textarea'],['mandate','Título da atuação pública'],['faq','Título das dúvidas frequentes']]},
 trust:{title:'Transparência',hint:'Atualize os cartões de transparência e proteção de dados.',collection:true,spec:[['title','Título'],['description','Descrição','textarea']]},
 faq:{title:'Perguntas frequentes',hint:'Altere perguntas e respostas e inclua novas dúvidas.',collection:true,spec:[['question','Pergunta'],['answer','Resposta','textarea']]},
 misc:{title:'Textos adicionais',hint:'Personalize legendas, notas e rótulos de todas as seções.',fields:[['verifyNote','Nota abaixo dos projetos','textarea'],['trustTitle','Título de transparência'],['mandateHint','Texto pequeno da atuação'],['projectsSectionLabel','Etiqueta dos projetos'],['newsSectionLabel','Etiqueta das notícias'],['archiveSectionLabel','Etiqueta do arquivo'],['aboutSectionLabel','Etiqueta de quem somos'],['trustSectionLabel','Etiqueta da transparência'],['faqSectionLabel','Etiqueta das dúvidas'],['joinHint','Etiqueta das pré-inscrições']]},
 history:{title:'Histórico de versões',hint:'Consulte as versões que já foram publicadas e restaure uma delas como rascunho.'}
};
const sizes={hero:{w:1600,h:900,label:'1600 × 900 px · Capa principal'},project:{w:1200,h:800,label:'1200 × 800 px · Projeto social'},news:{w:1200,h:800,label:'1200 × 800 px · Galeria de notícias'},portrait:{w:900,h:1100,label:'900 × 1100 px · Retrato'}};
let content=null,current='identity',authenticated=false,configured=false,csrf='',savedSha='',dirty=false,busy=false,search='',historyCache=[];
const msg=(text,error=false)=>{const el=$('#message');el.textContent=text||'';el.classList.toggle('error',!!error);};
const setStatus=(s,type='')=>{const el=$('#status');el.innerHTML='<span class="status-dot"></span>'+s;el.className='status '+type;};
async function request(action,opt={}){const r=await fetch('/api/cms?action='+encodeURIComponent(action)+(opt.query||''),{method:opt.method||'GET',headers:{'Content-Type':'application/json','X-CMS-CSRF':csrf},body:opt.body===undefined?undefined:JSON.stringify(opt.body),cache:'no-store',credentials:'same-origin'});let body;try{body=await r.json();}catch{body={error:'Resposta inválida do servidor.'};}if(!r.ok)throw new Error(body.error||'Erro HTTP '+r.status);return body;}
function markDirty(){dirty=true;$('#dirtyChip').textContent='Alterações não salvas';$('#dirtyChip').className='hint-chip dirty';$('#saveState').textContent='Alterações locais ainda não foram salvas.';updateActions();pushPreview();}
function markSaved(text){dirty=false;$('#dirtyChip').textContent='Rascunho salvo';$('#dirtyChip').className='hint-chip';$('#saveState').textContent=text||'Rascunho armazenado no GitHub. Ainda não publicado.';updateActions();}
function updateActions(){const canWrite=authenticated&&configured&&!busy;$('#saveButton').disabled=!canWrite||!dirty;$('#publishButton').disabled=!canWrite||dirty;$('#discardButton').disabled=busy||!content;$('#loginButton').hidden=!configured||authenticated;$('#logoutButton').hidden=!authenticated;}
function useTab(id){if(!sections[id])return;current=id;document.querySelectorAll('.side-link').forEach(e=>e.classList.toggle('active',e.dataset.tab===id));$('#panelTitle').textContent=sections[id].title;$('#panelHint').textContent=sections[id].hint;$('#crumbCurrent').textContent=sections[id].title;draw();}
function note(s){const e=H('p','section-note',s);return e;}
function field(host,obj,k,label,type='text',mode=''){const row=H('div','field');const cap=H('label','field-label',label);row.append(cap);
 if(type==='image'){asset(row,obj,k,mode);host.append(row);return;}
 if(type==='gallery'){gallery(row,obj,k,mode);host.append(row);return;}
 let inp;
 if(type==='textarea'){inp=H('textarea');inp.rows=String(k)==='text'?11:4;inp.maxLength=30000;inp.value=obj[k]??'';}
 else if(type==='article'){inp=H('select');inp.append(new Option('Nenhuma notícia associada','0'));for(const p of content.articles||[])inp.append(new Option((p.title||'Sem título').slice(0,80),String(p.id)));inp.value=String(obj[k]??0);}
 else {inp=H('input');inp.type=type==='url'?'text':type==='date'?'date':'text';inp.maxLength=2000;inp.value=obj[k]??'';}
 inp.id='fld-'+k+'-'+Math.random().toString(36).slice(2,8);cap.htmlFor=inp.id;
 const onChange=()=>{obj[k]=type==='article'?Number(inp.value):inp.value;markDirty();};
 inp.addEventListener('input',onChange);inp.addEventListener('change',onChange);row.append(inp);
 if(type==='url')row.append(H('small','', 'Use links https://, #nome-da-seção, mailto: ou tel:.'));
 host.append(row);
}
function asset(row,obj,k,mode){const dim=sizes[mode]||sizes.project;const zone=H('div','asset-field');const image=H('img','asset-preview');image.alt='Prévia da imagem atual';image.src=assetSrc(obj[k])||'/assets/hero-group.webp';image.onerror=()=>{image.style.opacity=.15};zone.append(image);
 const info=H('div','asset-info');info.append(H('strong','',dim.label),H('p','','Formatos aceitos: JPG, PNG ou WebP. Envie EXATAMENTE '+dim.w+' × '+dim.h+' pixels. O editor converte em WebP (máx. 1 MB).'));
 const upload=H('label','asset-upload','↑ Trocar fotografia');const inp=H('input');inp.type='file';inp.accept='image/png,image/jpeg,image/webp';upload.append(inp);info.append(upload);const err=H('small','asset-error');info.append(err);zone.append(info);row.append(zone);
 inp.addEventListener('change',async()=>{const file=inp.files?.[0];if(!file)return;err.textContent='';try{if(file.size>10000000)throw Error('Arquivo original acima de 10 MB.');const bitmap=await createImageBitmap(file);if(bitmap.width!==dim.w||bitmap.height!==dim.h){const w=bitmap.width,h=bitmap.height;bitmap.close();throw Error('Dimensão recebida: '+w+' × '+h+' px. Este espaço aceita apenas '+dim.w+' × '+dim.h+' px.');}const canvas=document.createElement('canvas');canvas.width=dim.w;canvas.height=dim.h;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();let uri=canvas.toDataURL('image/webp',.85);if(uri.length>1350000)uri=canvas.toDataURL('image/webp',.65);if(uri.length>1350000)throw Error('A imagem excede 1 MB mesmo após a compressão.');obj[k]=uri;image.src=uri;markDirty();msg('Imagem aceita: '+dim.label+'. Ficará online somente após publicar.');}catch(e){err.textContent=e.message;inp.value='';}});
}
function gallery(row,obj,k,mode){if(!Array.isArray(obj[k]))obj[k]=obj.image?[obj.image]:[];const grid=H('div','gallery-grid');const repaint=()=>{grid.replaceChildren();obj[k].forEach((src,i)=>{const tile=H('div','gallery-piece');const img=H('img');img.src=assetSrc(src);img.alt='Foto '+(i+1);const del=H('button','small-btn danger','Remover foto '+(i+1));del.type='button';del.addEventListener('click',()=>{obj[k].splice(i,1);obj.image=obj[k][0]||'';markDirty();repaint()});tile.append(img,del);grid.append(tile);});};repaint();row.append(grid);
 const control={image:''};const uploadArea=H('div');asset(uploadArea,control,'image',mode);const fileInput=uploadArea.querySelector('input[type=file]');const observer=new MutationObserver(()=>{if(control.image&&!obj[k].includes(control.image)){if(obj[k].length>=8){msg('No máximo 8 fotos por notícia.',true);control.image='';return;}obj[k].push(control.image);obj.image=obj[k][0];control.image='';markDirty();repaint();}});observer.observe(uploadArea,{attributes:true,subtree:true,attributeFilter:['src']}); // event custom after acceptance below
 const original=fileInput.onchange;
 fileInput.addEventListener('change',()=>setTimeout(()=>{if(control.image){if(obj[k].length<8){obj[k].push(control.image);obj.image=obj[k][0];repaint();markDirty();}else msg('No máximo 8 fotos por notícia.',true);control.image='';}},500));
 row.append(uploadArea);
}
function simpleFields(host,obj,fields){for(const [key,label,type,mode] of fields)field(host,obj,key,label,type,mode);}
function repeated(host,key,spec,options={}){if(!Array.isArray(content[key]))content[key]=[];const values=content[key];const head=H('div','filter-row');head.append(H('span','field-count',values.length+' itens cadastrados'));if(options.filter){const searchInput=H('input');searchInput.type='search';searchInput.placeholder='Buscar notícias pelo título...';searchInput.value=search;searchInput.addEventListener('input',()=>{search=searchInput.value.toLowerCase();list.replaceChildren();renderList()});head.append(searchInput);}host.append(head);
 const list=H('div');host.append(list);
 function renderList(){const existing=values.map((v,i)=>({v,i})).filter(x=>!options.filter||String(x.v.title||'').toLowerCase().includes(search));if(!existing.length)list.append(H('p','empty-note','Nenhum item nesta busca.'));existing.forEach(({v,i})=>{
  const box=H('section','repeat-card');const top=H('div','repeat-bar');top.append(H('strong','',String(i+1).padStart(2,'0')+' · '+(v.title||v.name||'Novo item')));
  const actions=H('div','repeat-actions');
  for(const [label,fn,extra] of [['↑',()=>move(i,-1)],['↓',()=>move(i,1)],['Excluir',()=>{if(confirm('Excluir este item do rascunho?')){values.splice(i,1);markDirty();draw();}},'danger']]){const b=H('button','small-btn '+(extra||''),label);b.type='button';b.title=label==='↑'?'Mover para cima':label==='↓'?'Mover para baixo':label;b.addEventListener('click',fn);actions.append(b);}top.append(actions);box.append(top);const body=H('div','repeat-body');simpleFields(body,v,spec);box.append(body);list.append(box);
 });}
 function move(index,d){const to=index+d;if(to<0||to>=values.length)return;[values[index],values[to]]=[values[to],values[index]];markDirty();draw();}
 renderList();const add=H('button','add-btn','+ Adicionar novo item');add.type='button';add.addEventListener('click',()=>{const item={};for(const [k,,t] of spec){item[k]=t==='gallery'?[]:t==='article'?0:'';}if(key==='articles'){item.id=Math.max(0,...values.map(x=>Number(x.id)||0))+1;item.date=new Date().toISOString().slice(0,10);item.category='Comunidade';item.status='Informação em atualização';item.image='';}if(key==='projects'||key==='mandate')item.id='novo-'+Date.now();values.unshift(item);search='';markDirty();draw();});host.append(add);
}
function nestedCollection(host,obj,key,title,spec){const name=H('h3','group-heading',title);host.append(name);const data=obj[key]||[];obj[key]=data;
 for(let i=0;i<data.length;i++){const item=data[i];const wrapper=H('section','repeat-card');const bar=H('div','repeat-bar');bar.append(H('strong','',item.title||'Item '+(i+1)));const del=H('button','small-btn danger','Excluir');del.onclick=()=>{if(confirm('Excluir?')){data.splice(i,1);markDirty();draw();}};bar.append(del);wrapper.append(bar);const body=H('div','repeat-body');simpleFields(body,item,spec);wrapper.append(body);host.append(wrapper);}
 const add=H('button','add-btn','+ Adicionar '+title.toLowerCase());add.addEventListener('click',()=>{const o={};for(const [k] of spec)o[k]='';data.push(o);markDirty();draw();});host.append(add);
}
function featured(host){host.append(H('h3','group-heading','NOTÍCIAS DE DESTAQUE NA PÁGINA INICIAL'));host.append(note('Selecione a notícia principal e as seguintes na coluna lateral. Dentro das notícias é possível incluir até 8 fotos navegáveis.'));const list=content.featuredNewsIds||[];content.featuredNewsIds=list;for(let i=0;i<4;i++){const row=H('div','field');row.append(H('label','field-label',i?'Destaque lateral '+i:'Notícia principal'));const select=H('select');select.append(new Option('Nenhum','0'));for(const item of content.articles||[])select.append(new Option((item.title||'Sem título').slice(0,90),item.id));select.value=String(list[i]||0);select.addEventListener('change',()=>{list[i]=Number(select.value);markDirty()});row.append(select);host.append(row);}}
async function draw(){if(!content)return;const def=sections[current],root=$('#editorForm');root.replaceChildren();if(current==='history'){await loadHistory(root);return;}if(current==='enrollment')root.append(note('Esta seção continua DEMONSTRATIVA. Não armazena matrícula nem dados pessoais. A inscrição real terá banco e autenticação separados.'));
 if(def.collection){if(current==='articles')featured(root);repeated(root,current,def.spec,{filter:def.filter});return;}
 const o=content[current]||{};content[current]=o;
 simpleFields(root,o,def.fields||[]);
 if(def.nested){nestedCollection(root,o,def.nested[0],'Atividades de exemplo',def.nested[1]);}
 if(def.nestedMany){for(const [key,title] of def.nestedMany)nestedCollection(root,o,key,title,[['title','Nome do link'],['url','Endereço','url']]);}
}
async function loadHistory(root){root.append(note('Apenas conteúdos já PUBLICADOS aparecem aqui. Restaurar carrega a versão escolhida no editor, sem publicá-la automaticamente.'));if(!authenticated){root.append(H('p','empty-note','Entre com o GitHub para consultar o histórico.'));return;}try{const data=await request('history');historyCache=data.commits||[];if(!historyCache.length)root.append(H('p','empty-note','Sem histórico editorial.'));for(const rev of historyCache){const row=H('div','history-card');const text=H('div');text.append(H('strong','',rev.message),H('small','',new Date(rev.date).toLocaleString('pt-BR')+' · '+rev.sha.slice(0,8)));const b=H('button','btn secondary','Restaurar como rascunho');b.onclick=async()=>{if(!confirm('Carregar esta versão no editor? Suas edições locais não salvas serão perdidas.'))return;try{const data=await request('revision',{query:'&sha='+rev.sha});content=data.content;markDirty();useTab('identity');msg('Versão anterior carregada. Clique em Salvar rascunho e Publicar quando estiver satisfeito.');}catch(e){msg(e.message,true);}};row.append(text,b);root.append(row);}}catch(e){root.append(H('p','empty-note',e.message));}}
function pushPreview(){const frame=$('#previewFrame');if(!content||$('#previewLayer').hidden||!frame?.contentWindow)return;frame.contentWindow.postMessage({type:'PORTAL_CMS_PREVIEW',content:structuredClone(content)},location.origin);}
async function boot(){
 try{const status=await request('status');configured=status.configured;authenticated=status.authenticated;csrf=status.csrf||'';
  if(!configured){$('#setupPanel').hidden=false;setStatus('Modo de preparação','warn');}
  else if(!authenticated){setStatus('Aguardando login','warn');msg('Entre com o GitHub para gravar rascunhos e publicar. Enquanto isso, você pode testar a edição e a prévia.');}
  else setStatus('Administrador conectado');
  let data;if(authenticated){data=await request('draft');savedSha=data.sha;content=data.content;if(data.branch==='main')$('#saveState').textContent='Você está vendo a versão publicada. Faça uma alteração para criar o rascunho.';}else{const r=await fetch('/dados/site.json',{cache:'no-store'});if(!r.ok)throw Error('dados/site.json indisponível');content=await r.json();}
  useTab('identity');updateActions();
 }catch(e){setStatus('Não foi possível carregar','error');msg('Erro ao abrir editor: '+e.message,true);}
}
$('#loginButton').onclick=()=>{location.href='/api/cms?action=login';};
$('#logoutButton').onclick=async()=>{try{await request('logout',{method:'POST',body:{}});location.reload();}catch(e){msg(e.message,true);}};
document.querySelectorAll('.side-link').forEach(b=>b.addEventListener('click',()=>useTab(b.dataset.tab)));
$('#previewButton').onclick=()=>{if(!content)return;$('#previewLayer').hidden=false;const frame=$('#previewFrame');frame.addEventListener('load',pushPreview,{once:true});pushPreview();};
$('#closePreview').onclick=()=>{$('#previewLayer').hidden=true;};
document.querySelectorAll('[data-device]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-device]').forEach(x=>x.classList.toggle('selected',x===b));$('.preview-canvas').classList.toggle('mobile',b.dataset.device==='mobile');}));
$('#previewFrame').addEventListener('load',pushPreview);
$('#saveButton').onclick=async()=>{if(!authenticated||!dirty||busy)return;busy=true;updateActions();msg('Salvando rascunho no GitHub…');
 try{
  let json=JSON.stringify(content);
  const pictures=[...new Set(json.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)||[])];
  for(let i=0;i<pictures.length;i++){
   msg('Enviando fotografia '+(i+1)+' de '+pictures.length+' para o rascunho…');
   const uploaded=await request('asset',{method:'POST',body:{image:pictures[i]}});
   json=json.split(pictures[i]).join(uploaded.path);
  }
  const prepared=JSON.parse(json);
  const r=await request('save',{method:'POST',body:{content:prepared,sha:savedSha}});
  content=r.content;savedSha=r.sha;markSaved('Rascunho salvo no GitHub. Confira a prévia antes de publicar.');draw();pushPreview();
  msg('Rascunho salvo com sucesso. '+pictures.length+' nova(s) foto(s) incluída(s). Nada entrou no ar ainda.');
 }catch(e){msg('Não foi possível salvar: '+e.message,true);}finally{busy=false;updateActions();}
};
$('#publishButton').onclick=async()=>{if(!authenticated||busy||dirty)return;if(!confirm('Publicar este rascunho no site oficial? Depois do deploy, todos os visitantes verão as alterações.'))return;busy=true;updateActions();msg('Publicando no GitHub…');try{const r=await request('publish',{method:'POST',body:{}});msg(r.alreadyPublished?'Este conteúdo já está publicado.':'Publicado no GitHub! A Vercel fará o deploy automaticamente.');$('#saveState').textContent='Versão enviada para publicação. Aguarde o status READY na Vercel.';}catch(e){msg(e.message,true);}finally{busy=false;updateActions();}};
$('#discardButton').onclick=async()=>{if(!confirm('Descartar alterações e voltar à versão publicada?'))return;try{if(authenticated){await request('discard',{method:'POST',body:{}});const d=await request('draft');content=d.content;savedSha=d.sha;}else{content=await(await fetch('/dados/site.json',{cache:'no-store'})).json();}markSaved('Conteúdo restaurado para a última versão publicada.');draw();msg('Rascunho descartado.');}catch(e){msg(e.message,true);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#previewLayer').hidden)$('#previewLayer').hidden=true;});
boot();