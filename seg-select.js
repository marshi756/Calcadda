/* CalcPointer: shows short dropdowns (2 to 4 choices) as a Yes/No-style switch inside the card.
   The original select is kept (hidden) so the calculation still reads the same value. */
(function(){
  function sigOf(sel){ return Array.prototype.map.call(sel.options,function(o){return o.value+'='+o.text;}).join('|'); }
  function build(){
    document.querySelectorAll('.calc select').forEach(function(sel){
      if(sel.id==='f_m') return;                       /* gold page uses its own switch */
      var n=sel.options.length; if(n<2||n>4) return;
      var labels=Array.prototype.map.call(sel.options,function(o){return o.text.trim();});
      if(labels.some(function(l){return l.length>16;})) return;   /* long lists stay as dropdowns */
      var row=sel.closest('.f'); if(!row) return;
      var sig=sigOf(sel);
      var box=row.querySelector('.seg-switch');
      if(box && box.dataset.sig===sig){ paint(); return; }
      if(box) box.remove();
      sel.style.display='none';
      box=document.createElement('div'); box.className='seg-switch metal-switch'; box.dataset.sig=sig; box.setAttribute('role','tablist');
      Array.prototype.forEach.call(sel.options,function(o){
        var b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.dataset.v=o.value; b.textContent=o.text.trim();
        b.addEventListener('click',function(){ sel.value=o.value; sel.dispatchEvent(new Event('change',{bubbles:true})); paint(); });
        box.appendChild(b);
      });
      var lab=row.querySelector('label'); if(lab) lab.insertAdjacentElement('afterend',box); else row.insertBefore(box,row.firstChild);
      function paint(){ box.querySelectorAll('button').forEach(function(b){ var on=b.dataset.v===sel.value; b.classList.toggle('on',on); b.setAttribute('aria-selected',on?'true':'false'); }); }
      sel.addEventListener('change',paint);
      paint();
    });
  }
  function run(){ build(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(run,0);}); else setTimeout(run,0);
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
})();
