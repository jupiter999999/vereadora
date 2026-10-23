/* Editor de imagens do Studio: recorte visual, zoom, esticamento independente e reposicionamento.
   A foto só é salva no portal depois de Salvar rascunho e Publicar. */
(function () {
 'use strict';
 const CROP_MAX_BYTES=1100000;
 const minmax=(v,a,b)=>Math.min(b,Math.max(a,v));
 let active=false;
 function open(source,dimension){
  if(active)return Promise.reject(new Error('Feche o editor de imagens anterior.'));
  if(!dimension||!Number.isInteger(dimension.w)||!Number.isInteger(dimension.h))return Promise.reject(new Error('Dimensão de imagem inválida.'));
  active=true;
  return new Promise((resolve,reject)=>{
   let objectUrl='',modal=null,finished=false,keyHandler=null;
   const finish=(value,error)=>{
    if(finished)return;finished=true;active=false;
    if(keyHandler)document.removeEventListener('keydown',keyHandler);
    if(modal)modal.remove();
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    if(error)reject(error);else resolve(value);
   };
   let src='';
   try{
    if(source instanceof Blob){objectUrl=URL.createObjectURL(source);src=objectUrl;}
    else if(typeof source==='string'&&/^(https?:\/\/|\/|data:image\/)/.test(source)){src=source;}
    else throw Error('Imagem de origem inválida.');
   }catch(err){finish(null,err);return;}
   const img=new Image();
   img.crossOrigin='anonymous';
   img.onload=()=>{
    try{
     if(img.naturalWidth<2||img.naturalHeight<2)throw Error('Fotografia com tamanho insuficiente.');
     const w=dimension.w,h=dimension.h,ratio=w/h;
     let viewW=Math.min(620,Math.round(Math.max(270,435*ratio)));
     let viewH=Math.round(viewW/ratio);
     if(viewH>400){viewH=400;viewW=Math.round(viewH*ratio);}
     modal=document.createElement('div');
     modal.className='crop-overlay';
     modal.setAttribute('role','dialog');
     modal.setAttribute('aria-modal','true');
     modal.setAttribute('aria-label','Enquadrar e esticar fotografia');
     modal.innerHTML='<div class="crop-modal crop-modal-pro"><div class="crop-heading"><div><span class="kicker">STUDIO · EDITOR DE FOTOS</span><h2>Enquadrar fotografia</h2><p>Aumente, diminua, arraste ou estique para preencher o espaço. Veja o resultado antes de aplicar.</p></div><button type="button" class="crop-close" aria-label="Fechar editor">✕</button></div>'+
      '<div class="crop-mode-head"><strong>Como mostrar a imagem?</strong><div class="crop-modes" role="group" aria-label="Modo de enquadramento"><button class="selected" type="button" data-crop-mode="cover">Preencher</button><button type="button" data-crop-mode="contain">Encaixar inteira</button><button type="button" data-crop-mode="stretch">Esticar</button></div></div>'+
      '<div class="crop-stage crop-stage-pro"><canvas id="cropCanvas" aria-label="Prévia interativa. Arraste para posicionar a imagem."></canvas><div class="crop-stage-tip">✥ Segure e arraste a foto para ajustar a posição</div></div>'+
      '<div class="crop-adjustments"><div class="crop-sliders">'+
      '<div class="crop-adjust"><div><label for="cropZoom">Zoom geral</label><output id="cropZoomValue" for="cropZoom">100%</output></div><input type="range" id="cropZoom" min="60" max="350" step="1" value="100"></div>'+
      '<div class="crop-adjust"><div><label for="cropWidth">Esticar na largura ↔</label><output id="cropWidthValue" for="cropWidth">100%</output></div><input type="range" id="cropWidth" min="65" max="250" step="1" value="100"></div>'+
      '<div class="crop-adjust"><div><label for="cropHeight">Esticar na altura ↕</label><output id="cropHeightValue" for="cropHeight">100%</output></div><input type="range" id="cropHeight" min="65" max="250" step="1" value="100"></div>'+
      '</div><div class="crop-side-controls"><span>Posição da fotografia</span><div class="crop-arrows"><button type="button" data-move="up" aria-label="Mover para cima">↑</button><button type="button" data-move="left" aria-label="Mover para a esquerda">←</button><button type="button" data-move="center" aria-label="Centralizar">◎</button><button type="button" data-move="right" aria-label="Mover para a direita">→</button><button type="button" data-move="down" aria-label="Mover para baixo">↓</button></div><button type="button" id="cropReset" class="crop-reset">↻ Restaurar enquadramento</button><small>A foto será exportada no tamanho exato do site.</small></div></div>'+
      '<div class="crop-meta"><span>Original: <strong id="cropOriginal"></strong></span><span>Foto final: <strong id="cropTarget"></strong></span></div>'+
      '<div class="crop-error" role="alert"></div><div class="crop-actions"><button type="button" class="btn ghost" id="cropCancel">Cancelar</button><button type="button" class="btn primary" id="cropApply">✓ Aplicar enquadramento</button></div></div>';
     document.body.append(modal);
     const canvas=modal.querySelector('canvas'),ctx=canvas.getContext('2d');
     canvas.width=viewW;canvas.height=viewH;
     modal.querySelector('#cropOriginal').textContent=img.naturalWidth+' × '+img.naturalHeight+' px';
     modal.querySelector('#cropTarget').textContent=w+' × '+h+' px · WebP';
     const controls={zoom:modal.querySelector('#cropZoom'),width:modal.querySelector('#cropWidth'),height:modal.querySelector('#cropHeight')};
     const labels={zoom:modal.querySelector('#cropZoomValue'),width:modal.querySelector('#cropWidthValue'),height:modal.querySelector('#cropHeightValue')};
     let mode='cover',zoom=1,scaleX=1,scaleY=1,panX=0,panY=0,down=false,lastX=0,lastY=0,dragId=null;
     function geometry(){
      const base=mode==='contain'?Math.min(w/img.naturalWidth,h/img.naturalHeight):mode==='stretch'?1:Math.max(w/img.naturalWidth,h/img.naturalHeight);
      const imageW=(mode==='stretch'?w:img.naturalWidth*base)*zoom*scaleX;
      const imageH=(mode==='stretch'?h:img.naturalHeight*base)*zoom*scaleY;
      const maxX=Math.abs(imageW-w)/2,maxY=Math.abs(imageH-h)/2;
      panX=minmax(panX,-maxX,maxX);panY=minmax(panY,-maxY,maxY);
      return {imageW,imageH};
     }
     function draw(context,destW,destH){
      const {imageW,imageH}=geometry(),factor=destW/w;
      context.clearRect(0,0,destW,destH);
      // Quando a imagem é menor do que o quadro, usamos um fundo suave derivado dela.
      context.save();
      context.filter='blur('+Math.round(26*factor)+'px)';
      context.globalAlpha=.65;
      const bg=Math.max(w/img.naturalWidth,h/img.naturalHeight)*1.08;
      const bgw=img.naturalWidth*bg*factor,bgh=img.naturalHeight*bg*factor;
      context.drawImage(img,(destW-bgw)/2,(destH-bgh)/2,bgw,bgh);
      context.restore();
      context.drawImage(img,((w-imageW)/2+panX)*factor,((h-imageH)/2+panY)*factor,imageW*factor,imageH*factor);
     }
     function preview(){draw(ctx,viewW,viewH);}
     function recenter(){panX=0;panY=0;preview();}
     function adjust(key){
      const value=Number(controls[key].value);
      labels[key].textContent=value+'%';
      if(key==='zoom')zoom=value/100;
      else if(key==='width')scaleX=value/100;
      else scaleY=value/100;
      preview();
     }
     for(const key of ['zoom','width','height'])controls[key].addEventListener('input',()=>adjust(key));
     modal.querySelectorAll('[data-crop-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      mode=btn.dataset.cropMode;modal.querySelectorAll('[data-crop-mode]').forEach(b=>b.classList.toggle('selected',b===btn));recenter();
     }));
     modal.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{
      const direction=btn.dataset.move,step= Math.max(8,Math.round(Math.min(w,h)*.035));
      if(direction==='up')panY-=step;
      if(direction==='down')panY+=step;
      if(direction==='left')panX-=step;
      if(direction==='right')panX+=step;
      if(direction==='center'){panX=0;panY=0;}
      preview();
     }));
     modal.querySelector('#cropReset').addEventListener('click',()=>{
      mode='cover';zoom=1;scaleX=1;scaleY=1;panX=0;panY=0;
      for(const key of Object.keys(controls)){controls[key].value='100';labels[key].textContent='100%';}
      modal.querySelectorAll('[data-crop-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.cropMode==='cover'));preview();
     });
     canvas.addEventListener('pointerdown',e=>{
      down=true;dragId=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);
     });
     canvas.addEventListener('pointermove',e=>{
      if(!down||dragId!==e.pointerId)return;
      const rect=canvas.getBoundingClientRect();
      panX+=(e.clientX-lastX)*w/rect.width;panY+=(e.clientY-lastY)*h/rect.height;
      lastX=e.clientX;lastY=e.clientY;preview();
     });
     const stopDrag=e=>{if(dragId!==e.pointerId)return;down=false;dragId=null;};
     canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);
     const dismiss=()=>finish(null,null);
     modal.querySelector('.crop-close').addEventListener('click',dismiss);
     modal.querySelector('#cropCancel').addEventListener('click',dismiss);
     modal.addEventListener('click',e=>{if(e.target===modal)dismiss();});
     keyHandler=e=>{
      if(e.key==='Escape'){e.preventDefault();dismiss();}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!modal)return;
      if(e.target?.tagName==='INPUT')return;
      const offset=Math.round(Math.min(w,h)*.025);
      if(e.key==='ArrowLeft')panX-=offset;
      if(e.key==='ArrowRight')panX+=offset;
      if(e.key==='ArrowUp')panY-=offset;
      if(e.key==='ArrowDown')panY+=offset;
      e.preventDefault();preview();
     };
     document.addEventListener('keydown',keyHandler);
     modal.querySelector('#cropApply').addEventListener('click',()=>{
      const apply=modal.querySelector('#cropApply'),err=modal.querySelector('.crop-error');
      err.textContent='';apply.disabled=true;
      try{
       const out=document.createElement('canvas');out.width=w;out.height=h;
       draw(out.getContext('2d'),w,h);
       let uri='';
       for(const quality of [.90,.79,.67,.55,.43,.30]){
        uri=out.toDataURL('image/webp',quality);
        if(uri.length<Math.floor(CROP_MAX_BYTES*4/3))break;
       }
       if(!uri.startsWith('data:image/webp;base64,'))throw Error('O navegador não conseguiu exportar a foto em WebP.');
       if(uri.length>=Math.floor(CROP_MAX_BYTES*4/3))throw Error('A foto ficou grande demais. Reduza a qualidade do original ou escolha outra.');
       finish(uri,null);
      }catch(error){err.textContent=error.message||'Falha ao aplicar a imagem.';apply.disabled=false;}
     });
     preview();controls.zoom.focus();
    }catch(error){finish(null,error);}
   };
   img.onerror=()=>finish(null,new Error('Não foi possível abrir a fotografia. Tente outro arquivo.'));
   img.src=src;
  });
 }
 window.PortalImageCrop={open};
})();
