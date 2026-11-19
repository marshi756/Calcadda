/* CalcPointer: donut chart of principal vs interest, drawn from the result rows of any calculator that reports both. */
(function(){
  function num(s){ var m=String(s).replace(/,/g,'').match(/-?\d+(\.\d+)?/); return m?parseFloat(m[0]):NaN; }
  function rowsOf(res){
    var out={}; res.querySelectorAll('.r').forEach(function(r){
      var k=(r.querySelector('span')||{}).textContent||'', v=(r.querySelector('b')||{}).textContent||'';
      out[k]=v;
    }); return out;
  }
  function pick(rows,re,skip){
    for(var k in rows){ if(re.test(k) && !(skip&&skip.test(k))) return num(rows[k]); }
    return NaN;
  }
  function draw(){
    var res=document.getElementById('res'), panel=res&&res.parentNode; if(!res||!panel) return;
    var old=document.getElementById('cp-donut'); if(old) old.remove();
    var rows=rowsOf(res);
    var interest=pick(rows,/interest|returns|gain|profit/i,/share|rate|%/i);
    var principal=pick(rows,/invested|principal|put in|deposit|paid in|you pay in|total paid/i,/share|%/i);
    if(!(interest>=0) || !(principal>0)) return;
    var total=principal+interest, p=principal/total, C=2*Math.PI*54;
    var pct=Math.round(interest/total*100);
    var wrap=document.createElement('div'); wrap.id='cp-donut'; wrap.className='donut-wrap';
    wrap.innerHTML=
      '<svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Principal '+Math.round(p*100)+'%, interest '+pct+'%">'+
        '<circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="16"/>'+
        '<circle cx="70" cy="70" r="54" fill="none" stroke="#4FD1C5" stroke-width="16" stroke-linecap="butt" stroke-dasharray="'+(C*p).toFixed(2)+' '+C.toFixed(2)+'" transform="rotate(-90 70 70)"/>'+
        '<circle cx="70" cy="70" r="54" fill="none" stroke="#FFB84D" stroke-width="16" stroke-linecap="butt" stroke-dasharray="'+(C*(1-p)).toFixed(2)+' '+C.toFixed(2)+'" stroke-dashoffset="'+(-C*p).toFixed(2)+'" transform="rotate(-90 70 70)"/>'+
        '<text x="70" y="66" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">'+pct+'%</text>'+
        '<text x="70" y="84" text-anchor="middle" font-size="10" fill="#BCD0E8">interest</text>'+
      '</svg>'+
      '<div class="donut-legend">'+
        '<div><i style="background:#4FD1C5"></i>Principal <b>'+Math.round(p*100)+'%</b></div>'+
        '<div><i style="background:#FFB84D"></i>Interest <b>'+pct+'%</b></div>'+
      '</div>';
    panel.insertBefore(wrap,res);
  }
  function start(){
    var res=document.getElementById('res'); if(!res) return;
    new MutationObserver(function(){ draw(); }).observe(res,{childList:true,subtree:true});
    draw();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(start,0); }); else setTimeout(start,0);
})();
