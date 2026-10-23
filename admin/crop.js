/* Recortador local de imagens. Nenhuma foto é enviada antes de salvar o rascunho. */
(function(){
'use strict';
window.PortalImageCrop={
 open(file,dim){
  return new Promise((resolve,reject)=>{
   const source=URL.createObjectURL(file),img=new Image();let disposed=false;
   img.onload=()=>{
    const ratio=dim.w/dim.h;
    const viewW=Math.round(Math.min(660,Math.max(270,490*ratio)));
    const viewH=Math.round(viewW/ratio);
    const layer=document.createElement('div');layer.className='crop-overlay';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','Recortar fotografia');
    layer.innerHTML='<div class="crop-modal"><div class="crop-heading"><div><span class="kicker">EDITOR DE IMAGENS</span><h2>Ajustar fotografia</h2><p>Arraste a foto para enquadrar. Use o zoom e veja como aparecerá no site.</p></div><button type="button" class="crop-close" aria-label="Cancelar">✕</button></div><div class="crop-stage"><canvas id="cropCanvas" aria-label="Prévia da fotografia"></canvas><div class="crop-stage-tip">↔ Arraste para posicionar a foto</div></div><div class="crop-controls"><label for="cropZoom">Zoom da foto</label><input type="range" id="cropZoom" min="1" max="3" step="0.01" value="1"><span id="cropZoomValue">100%</span></div><div class="crop-meta"><span>Original: <strong id="cropOriginal"></strong></span><span>Saída: <strong id="cropTarget"></strong></span></div><div class="crop-error" role="alert"></div><div class="crop-actions"><button type="button" class="btn ghost" id="cropCancel">Cancelar</button><button type="button" class="btn primary" id="cropApply">✓ Aplicar esta foto</button></div></div>';
    const canvas=layer.querySelector('canvas');canvas.width=viewW;canvas.height=viewH;
    layer.querySelector('#cropOriginal').textContent=img.naturalWidth+' × '+img.naturalHeight+' px';
    layer.querySelector('#cropTarget').textContent=dim.w+' × '+dim.h+' px · WebP';
    const zoomInput=layer.querySelector('#cropZoom');
    const error=layer.querySelector('.crop-error');
    const ctx=canvas.getContext('2d');let zoom=1,panX=0,panY=0,down=false,px=0,py=0;
    function bounds(){
     const base=Math.max(dim.w/img.naturalWidth,dim.h/img.naturalHeight)*zoom;
     const w=img.naturalWidth*base,h=img.naturalHeight*base;
     panX=Math.max(-(w-dim.w)/2,Math.min((w-dim.w)/2,panX));
     panY=Math.max(-(h-dim.h)/2,Math.min((h-dim.h)/2,panY));
     return {base,w,h};
    }
    function paint(target,width,height){
     const b=bounds(),factor=width/dim.w;
     target.clearRect(0,0,width,height);
     target.fillStyle='#102a22';target.fillRect(0,0,width,height);
     target.drawImage(img,(width-b.w*factor)/2+panX*factor,(height-b.h*factor)/2+panY*factor,b.w*factor,b.h*factor);
    }
    function redraw(){paint(ctx,viewW,viewH);}
    const cleanup=value=>{
      if(disposed)return;disposed=true;
      document.removeEventListener('keydown',keyHandler);
      layer.remove();URL.revokeObjectURL(source);resolve(value);
    };
    const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();cleanup(null);}};
    document.addEventListener('keydown',keyHandler);
    layer.querySelector('.crop-close').onclick=()=>cleanup(null);
    layer.querySelector('#cropCancel').onclick=()=>cleanup(null);
    layer.addEventListener('click',e=>{if(e.target===layer)cleanup(null)});
    zoomInput.addEventListener('input',()=>{zoom=Number(zoomInput.value);layer.querySelector('#cropZoomValue').textContent=Math.round(zoom*100)+'%';redraw()});
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',e=>{down=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!down)return;const r=canvas.getBoundingClientRect();panX+=(e.clientX-px)*(dim.w/r.width);panY+=(e.clientY-py)*(dim.h/r.height);px=e.clientX;py=e.clientY;redraw()});
    canvas.addEventListener('pointerup',()=>{down=false});canvas.addEventListener('pointercancel',()=>{down=false});
    layer.querySelector('#cropApply').onclick=()=>{
     const button=layer.querySelector('#cropApply');button.disabled=true;error.textContent='';
     try{
      const output=document.createElement('canvas');output.width=dim.w;output.height=dim.h;
      paint(output.getContext('2d'),dim.w,dim.h);
      let uri='';
      for(const q of [.88,.78,.67,.55,.44]){uri=output.toDataURL('image/webp',q);if(uri.length<1350000)break;}
      if(!uri.startsWith('data:image/webp;'))throw Error('Navegador não conseguiu converter a imagem em WebP.');
      if(uri.length>=1350000)throw Error('A imagem ainda está grande. Use um arquivo mais leve.');
      cleanup(uri);
     }catch(e){error.textContent=e.message||'Falha na conversão.';button.disabled=false;}
    };
    document.body.append(layer);redraw();
    zoomInput.focus();
   };
   img.onerror=()=>{URL.revokeObjectURL(source);reject(new Error('A imagem não pôde ser aberta.'));};
   img.src=source;
  });
 }
};
})();