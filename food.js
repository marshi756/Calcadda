/* CalcPointer food and calorie counter. Everything is stored only in this browser (localStorage). */
(function () {
'use strict';
/* [name, serving, kcal, protein g, carbs g, fat g] — approximate averages; packaged foods vary, check labels */
var FOODS = [
 ['Roti / chapati','1 medium (40 g)',104,3,18,2.2],['Plain paratha','1 piece',200,4,28,8],['White rice, cooked','1 katori (150 g)',195,4,43,0.4],
 ['Dal, cooked','1 katori (150 g)',140,8,20,3],['Rajma curry','1 katori',170,8,24,5],['Chole (chickpea curry)','1 katori',200,9,27,7],
 ['Paneer','100 g',265,18,1.2,20],['Idli','1 piece',60,2,12,0.3],['Plain dosa','1 piece',130,3,22,3],['Masala dosa','1 piece',250,5,35,10],
 ['Sambar','1 katori',90,4,13,2.5],['Poha','1 plate (150 g)',250,5,45,5],['Upma','1 plate',230,5,34,8],['Chicken biryani','1 plate',490,24,60,16],
 ['Chicken curry','1 katori (150 g)',240,20,6,15],['Mutton / lamb curry','1 katori',280,20,5,20],['Fish curry','1 katori',180,18,5,10],
 ['Egg, boiled','1 egg',78,6.3,0.6,5.3],['Omelette','2 eggs',190,13,1,15],['Milk, full-fat','1 glass (250 ml)',150,8,12,8],
 ['Curd / yogurt','1 katori (100 g)',60,3.5,4.7,3.3],['Chai with milk and sugar','1 cup',70,2,10,2.5],['Samosa','1 piece',260,4,28,15],
 ['Banana','1 medium',105,1.3,27,0.4],['Apple','1 medium',95,0.5,25,0.3],['Mango','1 medium (200 g)',120,1,30,0.6],['Orange','1 medium',62,1.2,15,0.2],
 ['Almonds','10 pieces',70,2.5,2.6,6],['Peanuts','30 g handful',170,7.7,4.8,14.7],['Oats','40 g dry',150,5.3,27,2.7],['Bread, white','1 slice',75,2.5,14,1],
 ['Peanut butter','1 tbsp',95,4,3,8],['Butter','1 tsp',36,0,0,4],['Ghee','1 tsp',45,0,0,5],['Cooking oil','1 tsp',40,0,0,4.5],['Sugar','1 tsp',16,0,4,0],
 ['Gulab jamun','1 piece',150,2,22,6],['Jalebi','1 piece',150,1,28,4],['Hummus','2 tbsp (30 g)',50,2.5,4,3],['Falafel','1 piece',57,2.3,5.4,3],
 ['Chicken shawarma wrap','1 wrap',530,30,45,25],['Kabsa with chicken','1 plate',650,35,80,20],['Arabic bread (khubz)','1 piece (60 g)',165,5.5,33,0.7],
 ['Dates (medjool)','3 pieces',200,1.5,54,0.2],['Laban / ayran','1 cup (240 ml)',90,5,7,4],['Grilled chicken breast','100 g',165,31,0,3.6],
 ['Cola','1 can (330 ml)',140,0,35,0],['Pizza','1 slice',285,12,36,10],['Burger','1 regular',350,17,33,15],['French fries','medium (115 g)',365,4,48,17],
 ['Pasta, cooked','1 cup (140 g)',220,8,43,1.3],['Whey protein shake','1 scoop (30 g)',120,24,3,1.5]
];
var MEALS = ['Breakfast','Lunch','Dinner','Snacks'];
function $(id){ return document.getElementById(id); }
function sg(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function ss(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function key(){ var d=new Date(); return 'cp_food_'+d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function r1(n){ return Math.round(n*10)/10; }

var entries=[], goal=2000;
function load(){ try { entries=JSON.parse(sg(key())||'[]')||[]; } catch(e){ entries=[]; } var g=parseFloat(sg('cp_goal')); if(g>0) goal=g; }
function save(){ ss(key(),JSON.stringify(entries)); ss('cp_goal',String(goal)); }

function render(){
  var tot={k:0,p:0,c:0,f:0};
  entries.forEach(function(e){ tot.k+=e.k*e.q; tot.p+=e.p*e.q; tot.c+=e.c*e.q; tot.f+=e.f*e.q; });
  var left=goal-tot.k, pct=Math.max(0,Math.min(100,tot.k/goal*100));
  $('f-eaten').textContent=Math.round(tot.k)+' kcal';
  $('f-left').textContent=(left>=0?Math.round(left)+' kcal left':Math.round(-left)+' kcal over');
  $('f-bar').style.width=pct+'%';
  $('f-p').textContent=Math.round(tot.p)+' g'; $('f-c').textContent=Math.round(tot.c)+' g'; $('f-f').textContent=Math.round(tot.f)+' g';
  $('f-warn').hidden=!(goal>0&&goal<1200);
  var h='';
  MEALS.forEach(function(m){
    var list=entries.filter(function(e){ return e.m===m; }); if(!list.length) return;
    var sub=0; list.forEach(function(e){ sub+=e.k*e.q; });
    h+='<h3 style="margin:16px 0 0;font-size:15px">'+m+' <small style="color:var(--on-navy-muted)">'+Math.round(sub)+' kcal</small></h3><ul class="fl" style="color:var(--on-navy)">';
    list.forEach(function(e){ h+='<li style="border-color:var(--navy-line)"><span>'+esc(e.n)+' <small style="color:var(--on-navy-muted)">× '+e.q+'</small></span><b>'+Math.round(e.k*e.q)+'</b>'+
      '<button style="background:rgba(255,255,255,.1);color:#fff" data-a="m" data-i="'+e.i+'" aria-label="Less">−</button><button style="background:rgba(255,255,255,.1);color:#fff" data-a="p" data-i="'+e.i+'" aria-label="More">+</button></li>'; });
    h+='</ul>';
  });
  $('f-list').innerHTML=h||'<p style="color:var(--on-navy-muted);margin:14px 0 0">Nothing logged yet today. Search a food and tap it to add.</p>';
}
function add(n,k,p,c,f,q){
  entries.push({i:Date.now()+Math.random(),n:n,k:k,p:p,c:c,f:f,q:q,m:$('f-meal').value}); save(); render();
}
function suggest(){
  var s=$('f-q').value.trim().toLowerCase(), box=$('f-sug'), h='', n=0;
  FOODS.forEach(function(x,i){ if(s&&x[0].toLowerCase().indexOf(s)<0) return; if(!s&&n>=8) return; n++;
    h+='<button type="button" data-f="'+i+'"><span>'+esc(x[0])+' <small>'+esc(x[1])+'</small></span><b>'+x[2]+' kcal</b></button>'; });
  box.innerHTML=h||'<button type="button" disabled>No match. Use "Add your own food" below.</button>';
}

function init(){
  var app=$('food-app'); if(!app) return; load();
  app.innerHTML=
  '<div class="fd-grid"><div class="panel">'+
   '<div class="f"><label for="f-goal">Daily calorie goal (kcal)</label><input id="f-goal" type="number" inputmode="numeric" min="800" step="50"></div>'+
   '<div class="f"><label for="f-meal">Add to</label><select id="f-meal">'+MEALS.map(function(m){ return '<option>'+m+'</option>'; }).join('')+'</select></div>'+
   '<div class="f"><label for="f-qty">Servings</label><input id="f-qty" type="number" inputmode="decimal" min="0.25" step="0.25" value="1"></div>'+
   '<div class="f"><label for="f-q">Search a food</label><input id="f-q" type="search" placeholder="roti, dal, banana, shawarma..." style="width:100%;height:52px;border:1.5px solid var(--line);border-radius:12px;background:var(--field);color:var(--ink);font:inherit;font-size:17px;font-weight:600;padding:0 14px"><div class="sug" id="f-sug"></div></div>'+
   '<details style="border-top:1px solid var(--line);padding-top:14px"><summary style="cursor:pointer;font-weight:800">Add your own food</summary><div class="mini" style="margin-top:12px">'+
    '<div class="f" style="grid-column:1/-1"><label for="c-n">Food name</label><input id="c-n" type="text" style="width:100%;height:52px;border:1.5px solid var(--line);border-radius:12px;background:var(--field);color:var(--ink);font:inherit;font-size:16px;padding:0 14px"></div>'+
    '<div class="f"><label for="c-k">Calories (kcal)</label><input id="c-k" type="number" inputmode="decimal" min="0" step="any"></div>'+
    '<div class="f"><label for="c-p">Protein (g)</label><input id="c-p" type="number" inputmode="decimal" min="0" step="any"></div>'+
    '<div class="f"><label for="c-c">Carbs (g)</label><input id="c-c" type="number" inputmode="decimal" min="0" step="any"></div>'+
    '<div class="f"><label for="c-f">Fat (g)</label><input id="c-f" type="number" inputmode="decimal" min="0" step="any"></div>'+
    '<button type="button" class="btn2" id="c-add" style="grid-column:1/-1">Add this food</button></div></details>'+
  '</div>'+
  '<aside class="result" aria-live="polite"><div id="bigl">Eaten today</div><div id="f-eaten" style="font-size:clamp(34px,9vw,48px);font-weight:800;letter-spacing:-.03em;line-height:1.1">0 kcal</div>'+
   '<div class="bar"><i id="f-bar" style="width:0%"></i></div><div id="f-left" style="font-weight:800"></div>'+
   '<div class="mac"><div>Protein<b id="f-p">0 g</b></div><div>Carbs<b id="f-c">0 g</b></div><div>Fat<b id="f-f">0 g</b></div></div>'+
   '<p class="err" id="f-warn" hidden style="margin-top:12px;font-size:13.5px">A goal under 1,200 kcal is below commonly advised minimums. Please talk to a doctor or dietitian before eating this little.</p>'+
   '<div id="f-list"></div><div class="btns" style="margin-top:16px"><button type="button" class="btn2" id="f-reset" style="border-color:var(--navy-line);color:#fff">Clear today</button></div>'+
   '<p class="small-note">Values are approximate averages. Packaged food and home recipes vary, so check labels. Your log stays in this browser only.</p></aside></div>';
  $('f-goal').value=goal; suggest(); render();
  $('f-goal').addEventListener('input',function(){ var g=parseFloat(this.value); if(g>0){ goal=g; save(); render(); } });
  $('f-q').addEventListener('input',suggest);
  $('f-sug').addEventListener('click',function(ev){ var b=ev.target.closest('button[data-f]'); if(!b) return; var x=FOODS[+b.getAttribute('data-f')], q=parseFloat($('f-qty').value)||1; add(x[0],x[2],x[3],x[4],x[5],q); });
  $('c-add').addEventListener('click',function(){ var n=$('c-n').value.trim(), k=parseFloat($('c-k').value); if(!n||!(k>=0)) return;
    add(n,k,parseFloat($('c-p').value)||0,parseFloat($('c-c').value)||0,parseFloat($('c-f').value)||0,parseFloat($('f-qty').value)||1);
    ['c-n','c-k','c-p','c-c','c-f'].forEach(function(i){ $(i).value=''; }); });
  $('f-list').addEventListener('click',function(ev){ var b=ev.target.closest('button[data-i]'); if(!b) return; var id=parseFloat(b.getAttribute('data-i'));
    entries.forEach(function(e){ if(e.i===id) e.q=r1(e.q+(b.getAttribute('data-a')==='p'?0.5:-0.5)); });
    entries=entries.filter(function(e){ return e.q>0; }); save(); render(); });
  $('f-reset').addEventListener('click',function(){ entries=[]; save(); render(); });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
