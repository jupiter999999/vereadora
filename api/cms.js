// CMS administrativo: login privado e conteudo editorial versionado pelo GitHub.
'use strict';
const crypto=require('node:crypto');
const REPO='jupiter999999/vereadora';
const MAIN='main', DRAFT='cms/rascunho';
const CONTENT='dados/site.json';
const OWNER=(process.env.CMS_ADMIN_USER||'admin').toLowerCase();
const MAX_BODY=4200000;
const enabled=()=>Boolean(process.env.CMS_ADMIN_USER&&process.env.CMS_ADMIN_PASSWORD_HASH&&process.env.CMS_SESSION_SECRET);
function answer(res,code,data){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
function fail(res,code,message){answer(res,code,{error:message});}
function cookie(req,name){const source=String(req.headers.cookie||'');return source.split(/;\s*/).map(v=>v.split('=')).filter(p=>p[0]===name).map(p=>decodeURIComponent(p.slice(1).join('=')))[0]||'';}
function setCookie(res,name,value,age=0,extra=''){res.setHeader('Set-Cookie',[...(res.getHeader('Set-Cookie')||[]),name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age='+age+extra]);}
function seal(payload){const key=crypto.createHash('sha256').update(process.env.CMS_SESSION_SECRET).digest();const nonce=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);const encrypted=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);return Buffer.concat([nonce,cipher.getAuthTag(),encrypted]).toString('base64url');}
function unseal(ciphertext){try{const d=Buffer.from(ciphertext,'base64url');const key=crypto.createHash('sha256').update(process.env.CMS_SESSION_SECRET).digest();const c=crypto.createDecipheriv('aes-256-gcm',key,d.subarray(0,12));c.setAuthTag(d.subarray(12,28));return JSON.parse(Buffer.concat([c.update(d.subarray(28)),c.final()]).toString('utf8'));}catch{return null;}}
function session(req){if(!enabled())return null;const obj=unseal(cookie(req,'portal_cms'));return obj&&obj.exp>Date.now()&&obj.login===OWNER&&obj.csrf?obj:null;}
function siteOrigin(req){return 'https://'+String(req.headers['x-forwarded-host']||req.headers.host||'').replace(/[^a-zA-Z0-9.:-]/g,'');}
async function github(token,path,opt={}){const r=await fetch('https://api.github.com/repos/'+REPO+'/'+path,{...opt,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,'User-Agent':'portal-editorial-cms',...(opt.headers||{})}});let data;try{data=await r.json();}catch{data={};}if(!r.ok){const e=new Error(data.message||'GitHub HTTP '+r.status);e.status=r.status;throw e;}return data;}
async function getContent(token,ref){return github(token,'contents/'+CONTENT+'?ref='+encodeURIComponent(ref));}
async function getBranch(token,branch){try{return await github(token,'git/ref/heads/'+branch);}catch(e){if(e.status===404)return null;throw e;}}
async function draftBranch(token){let ref=await getBranch(token,DRAFT);if(ref)return ref;const main=await getBranch(token,MAIN);if(!main)throw new Error('Não foi possível localizar o branch principal.');try{return await github(token,'git/refs',{method:'POST',body:JSON.stringify({ref:'refs/heads/'+DRAFT,sha:main.object.sha})});}catch(e){if(e.status===422)return getBranch(token,DRAFT);throw e;}}
async function putFile(token,path,raw,branch,sha){const body={message:'cms: atualizar '+path,content:Buffer.from(raw).toString('base64'),branch};if(sha)body.sha=sha;return github(token,'contents/'+path,{method:'PUT',body:JSON.stringify(body)});}
function validateContent(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Conteúdo inválido.');
 for(const field of ['hero','identity','footer','headlines'])if(!body[field]||typeof body[field]!=='object'||Array.isArray(body[field]))throw new Error('Seção ausente: '+field);
 for(const [field,max] of Object.entries({articles:800,projects:100,mandate:100,nav:20,shortcuts:20,focus:20}))if(!Array.isArray(body[field])||body[field].length>max)throw new Error('Quantidade inválida na seção '+field);
 const json=JSON.stringify(body);if(json.length>1200000)throw new Error('O conteúdo ultrapassou o limite de edição.');
 return json;
}
function webpCheck(bytes){
 if(bytes.length>1100000||bytes.length<30||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Use somente imagens WebP com no máximo 1 MB.');
 const typ=bytes.toString('ascii',12,16);let w=0,h=0;
 if(typ==='VP8X'&&bytes.length>30){w=1+bytes.readUIntLE(24,3);h=1+bytes.readUIntLE(27,3);}
 else if(typ==='VP8 '&&bytes.length>30){w=bytes.readUInt16LE(26)&16383;h=bytes.readUInt16LE(28)&16383;}
 else if(typ==='VP8L'&&bytes.length>25){const bits=bytes.readUInt32LE(21);w=(bits&16383)+1;h=((bits>>>14)&16383)+1;}
 if(!w||!h||w>3000||h>3000||w*h>7500000)throw new Error('Imagem com dimensões inválidas ou excessivas.');
 return {width:w,height:h};
}
function requirePost(req,res,s){if(req.method!=='POST'){fail(res,405,'Método não permitido.');return false;}const raw=String(req.headers.origin||'');if(raw!==siteOrigin(req)){fail(res,403,'Origem da solicitação não autorizada.');return false;}if(req.headers['x-cms-csrf']!==s.csrf){fail(res,403,'Sessão inválida. Recarregue o painel.');return false;}return true;}
module.exports=async function handler(req,res){
 const action=String(req.query?.action||'status');
 try{
  if(action==='status'){const s=session(req);return answer(res,200,{configured:enabled(),authenticated:!!s,canPublish:!!(s&&process.env.CMS_GITHUB_TOKEN),login:s?.login||null,csrf:s?.csrf||null,repo:REPO});}
  if(!enabled())return fail(res,503,'Acesso administrativo ainda não configurado na Vercel.');
  if(action==='login'){
   if(req.method!=='POST')return fail(res,405,'Método não permitido.');
   const origin=String(req.headers.origin||'');
   if(origin!==siteOrigin(req))return fail(res,403,'Origem não autorizada.');
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
   const username=String(body.username||'').trim().toLowerCase();
   const password=String(body.password||'');
   if(password.length>256||username.length>100)return fail(res,401,'Usuário ou senha incorretos.');
   const parts=String(process.env.CMS_ADMIN_PASSWORD_HASH||'').split(':');
   if(parts.length!==2||!/^[a-f0-9]{32,64}$/i.test(parts[0])||!/^[a-f0-9]{128}$/i.test(parts[1]))return fail(res,503,'Hash administrativo inválido.');
   const actual=crypto.scryptSync(password,Buffer.from(parts[0],'hex'),64);
   const expected=Buffer.from(parts[1],'hex');
   if(username!==OWNER||!crypto.timingSafeEqual(actual,expected))return fail(res,401,'Usuário ou senha incorretos.');
   const csrf=crypto.randomBytes(24).toString('hex');
   setCookie(res,'portal_cms',seal({login:OWNER,csrf,exp:Date.now()+4*3600000}),4*3600);
   return answer(res,200,{ok:true});
  }
  const s=session(req);if(!s)return fail(res,401,'Entre como administrador para acessar o portal.');
  if(action==='logout'){if(!requirePost(req,res,s))return;setCookie(res,'portal_cms','',0);return answer(res,200,{ok:true});}
  const token=process.env.CMS_GITHUB_TOKEN;
  if(!token)return fail(res,503,'Área de edição liberada. Para salvar e publicar, configure o token de acesso exclusivo ao repositório na Vercel.');
  if(action==='draft'&&req.method==='GET'){
   const ref=await getBranch(token,DRAFT);const file=await getContent(token,ref?DRAFT:MAIN);
   return answer(res,200,{content:JSON.parse(Buffer.from(file.content,'base64').toString('utf8')),sha:file.sha,branch:ref?DRAFT:MAIN});
  }
  if(action==='history'&&req.method==='GET'){
   const commits=await github(token,'commits?sha=main&path='+encodeURIComponent(CONTENT)+'&per_page=15');
   return answer(res,200,{commits:commits.map(c=>({sha:c.sha,date:c.commit?.author?.date,message:c.commit?.message?.split('\n')[0]}))});
  }
  if(action==='revision'&&req.method==='GET'){
   const sha=String(req.query.sha||'');if(!/^[0-9a-f]{40}$/.test(sha))return fail(res,400,'Versão inválida.');
   const file=await getContent(token,sha);return answer(res,200,{content:JSON.parse(Buffer.from(file.content,'base64').toString('utf8'))});
  }
  if(!requirePost(req,res,s))return;
  if(action==='asset'){
   const payload=typeof req.body==='string'?JSON.parse(req.body):req.body;
   const input=String(payload?.image||'');
   if(!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(input))return fail(res,400,'Imagem inválida. Use WebP gerado pelo editor.');
   const bytes=Buffer.from(input.slice(input.indexOf(',')+1),'base64');
   const dims=webpCheck(bytes);
   if(![[1600,900],[1200,800],[900,1100]].some(([w,h])=>dims.width===w&&dims.height===h))return fail(res,400,'Dimensão não permitida. Confira o tamanho indicado no editor.');
   await draftBranch(token);
   const path='assets/cms/'+crypto.randomUUID()+'.webp';
   await putFile(token,path,bytes,DRAFT);
   return answer(res,200,{ok:true,path,width:dims.width,height:dims.height});
  }
  if(action==='save'){
   const payload=typeof req.body==='string'?JSON.parse(req.body):req.body;
   const json=validateContent(payload?.content);
   const maxPhotos=(json.match(/data:image\/webp;base64,/g)||[]).length;
   if(maxPhotos>18||Buffer.byteLength(json)>MAX_BODY)return fail(res,413,'Salve menos imagens por vez (máximo 18).');
   await draftBranch(token);const current=await getContent(token,DRAFT);
   if(payload.sha&&payload.sha!==current.sha)return fail(res,409,'Outro rascunho foi salvo. Atualize o painel antes de sobrescrever.');
   let updated=json;const photos=[...new Set(json.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)||[])];
   for(const dataUrl of photos){
    const bytes=Buffer.from(dataUrl.split(',')[1],'base64');webpCheck(bytes);
    const file='assets/cms/'+crypto.randomUUID()+'.webp';
    await putFile(token,file,bytes,DRAFT);
    updated=updated.split(dataUrl).join(file);
   }
   const result=await putFile(token,CONTENT,updated,DRAFT,current.sha);
   return answer(res,200,{ok:true,sha:result.content.sha,content:JSON.parse(updated),savedPhotos:photos.length,branch:DRAFT});
  }
  if(action==='publish'){
   const draft=await getBranch(token,DRAFT);
   if(!draft)return fail(res,409,'Salve um rascunho antes de publicar.');
   const main=await getBranch(token,MAIN);
   if(main.object.sha===draft.object.sha)return answer(res,200,{ok:true,alreadyPublished:true,sha:main.object.sha});
   try{
    await github(token,'git/refs/heads/'+MAIN,{method:'PATCH',body:JSON.stringify({sha:draft.object.sha,force:false})});
   }catch(e){if(e.status===422)return fail(res,409,'Há alterações novas no GitHub. O rascunho precisa ser sincronizado antes de publicar.');throw e;}
   return answer(res,200,{ok:true,sha:draft.object.sha,message:'Publicado no GitHub. A Vercel atualizará o site após o deploy.'});
  }
  if(action==='discard'){
   const main=await getBranch(token,MAIN), draft=await getBranch(token,DRAFT);
   if(draft)await github(token,'git/refs/heads/'+DRAFT,{method:'PATCH',body:JSON.stringify({sha:main.object.sha,force:true})});
   return answer(res,200,{ok:true});
  }
  return fail(res,404,'Ação não encontrada.');
 }catch(e){console.error('cms action '+action+':',String(e.message||e));return fail(res,e.status===401?401:e.status===409?409:500,'Falha na operação editorial: '+String(e.message||'erro desconhecido').slice(0,240));}
};