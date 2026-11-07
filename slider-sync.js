/* CalcPointer: adds a slider next to every numeric input, kept in sync with the typed value.
   Typing stays exact; dragging gives a rough estimate. Runs after calc.js has built the form. */
(function(){
  function niceStep(max){ if(max>=1000) return Math.pow(10,Math.floor(Math.log10(max))-2); if(max>=100) return 1; if(max>=10) return 0.1; return 0.01; }
  function niceMax(v){
    if(v===0) return 100;
    var a=Math.abs(v), p=Math.pow(10,Math.floor(Math.log10(a)));
    return Math.ceil((a*3)/p)*p;
  }
  function enhance(input){
    if(input.dataset.slider) return;
    if(input.type!=='number') return;
    var wrap=input.closest('.f'); if(!wrap) return;
    input.dataset.slider='1';
    var v=parseFloat(input.value); if(isNaN(v)) v=0;
    var min=input.hasAttribute('min')?parseFloat(input.min):(v<0?v*3:0);
    var max=input.hasAttribute('max')?parseFloat(input.max):niceMax(v);
    if(max<=min) max=min+100;
    var row=document.createElement('div'); row.className='slider-row';
    var r=document.createElement('input'); r.type='range'; r.className='cp-range';
    r.min=min; r.max=max; r.step=niceStep(max-min); r.value=Math.min(Math.max(v,min),max);
    r.setAttribute('aria-label', (wrap.querySelector('label')||{}).textContent||'Slider');
    row.appendChild(r); wrap.appendChild(row);
    r.addEventListener('input',function(){
      input.value=r.value;
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    input.addEventListener('input',function(){
      var nv=parseFloat(input.value);
      if(isNaN(nv)) return;
      if(nv>parseFloat(r.max)){ r.max=Math.ceil(nv*1.5); }
      if(nv<parseFloat(r.min)){ r.min=Math.floor(nv*1.5); }
      r.value=nv;
    });
  }
  function scan(){ document.querySelectorAll('.f input[type="number"]').forEach(enhance); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scan); else scan();
  setTimeout(scan,0); window.addEventListener('load',scan);
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();
