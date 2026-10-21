(function(){
  'use strict';
  function slug(text){return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80);}
  function init(){
    document.querySelectorAll('article.about').forEach(function(article){
      if(article.querySelector('.guide-nav')) return;
      var headings=Array.prototype.slice.call(article.querySelectorAll('h2')).filter(function(h){
        var t=(h.textContent||'').trim().toLowerCase();
        return t && !/^about\b/.test(t);
      });
      if(!headings.length) return;
      var nav=document.createElement('nav');
      nav.className='guide-nav';
      nav.setAttribute('aria-label','Guide navigation');
      var title=document.createElement('strong');
      title.textContent='Guide';
      nav.appendChild(title);
      var list=document.createElement('ol');
      headings.forEach(function(h,i){
        var id=h.id || ('guide-'+slug(h.textContent)||('section-'+(i+1)));
        if(!h.id) h.id=id;
        var li=document.createElement('li');
        var a=document.createElement('a');
        a.href='#'+id;
        a.textContent=h.textContent.trim();
        li.appendChild(a); list.appendChild(li);
      });
      nav.appendChild(list);
      var first=article.querySelector('h2');
      if(first) article.insertBefore(nav,first);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
