/* CalcPointer: Gold / Silver switch placed inside the calculator card, in place of the Metal dropdown. */
(function(){
  function build(){
    var sel=document.getElementById('f_m'); if(!sel || document.getElementById('cp-metal')) return;
    var row=sel.closest('.f'); if(!row) return;
    row.style.display='none';
    var box=document.createElement('div'); box.id='cp-metal'; box.className='metal-switch'; box.setAttribute('role','tablist');
    box.innerHTML='<button type="button" role="tab" data-v="gold"><span class="dot gold"></span>Gold</button>'+
                  '<button type="button" role="tab" data-v="silver"><span class="dot silver"></span>Silver</button>';
    row.parentNode.insertBefore(box,row);
    function paint(){
      box.querySelectorAll('button').forEach(function(b){
        var on=b.dataset.v===sel.value; b.classList.toggle('on',on); b.setAttribute('aria-selected',on?'true':'false');
      });
    }
    box.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        if(sel.value===b.dataset.v) return;
        sel.value=b.dataset.v; sel.dispatchEvent(new Event('change',{bubbles:true})); paint();
      });
    });
    sel.addEventListener('change',paint);
    paint();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(build,0);}); else setTimeout(build,0);
  new MutationObserver(build).observe(document.body,{childList:true,subtree:true});
})();
