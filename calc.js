/* CalcPointer shared engine. One file powers every calculator page.
   After AdSense approval, set ADS_ON = true to show the reserved ad slots. */
(function (root) {
'use strict';
var ADS_ON = false;
function L(){ return (typeof global!=='undefined'&&global.CP_LANG)||root.CP_LANG||(typeof document!=='undefined'&&document.documentElement.lang)||'en'; }
function T(s,v){ var d=root.CP_I18N&&root.CP_I18N[s]; var t=d||s; if(v) t=t.replace(/\{(\w+)\}/g,function(m,k){ return v[k]!=null?v[k]:m; }); return t; }
function sloc(){ var l=L(); return l==='ar'?'ar-SA':l==='hi'?'hi-IN':'en'; }

/* ---------- constants ---------- */
var KM_MI = 1.609344, L_US = 3.785411784, L_UK = 4.54609, K_US = 235.214583, K_UK = 282.480936;

var CUR = {
  USD:['US Dollar','en-US'], INR:['Indian Rupee','en-IN'], SAR:['Saudi Riyal','en-US'], AED:['UAE Dirham','en-US'],
  GBP:['British Pound','en-GB'], EUR:['Euro','en-IE'], CAD:['Canadian Dollar','en-CA'], AUD:['Australian Dollar','en-AU'],
  QAR:['Qatari Riyal','en-US'], KWD:['Kuwaiti Dinar','en-US'], BHD:['Bahraini Dinar','en-US'], OMR:['Omani Rial','en-US'],
  SGD:['Singapore Dollar','en-SG'], NZD:['New Zealand Dollar','en-NZ'], CHF:['Swiss Franc','en-US'], JPY:['Japanese Yen','en-JP'],
  CNY:['Chinese Yuan','en-US'], HKD:['Hong Kong Dollar','en-US'], MYR:['Malaysian Ringgit','en-US'], THB:['Thai Baht','en-US'],
  PKR:['Pakistani Rupee','en-US'], BDT:['Bangladeshi Taka','en-US'], LKR:['Sri Lankan Rupee','en-US'], NPR:['Nepalese Rupee','en-US'],
  PHP:['Philippine Peso','en-US'], IDR:['Indonesian Rupiah','en-US'], KRW:['South Korean Won','en-US'], TRY:['Turkish Lira','en-US'],
  EGP:['Egyptian Pound','en-US'], ZAR:['South African Rand','en-US']
};
/* Built-in approximate rates (per 1 USD). Used only if the live rate service cannot be reached. */
var FB = { USD:1, INR:88, SAR:3.75, AED:3.6725, GBP:0.75, EUR:0.86, CAD:1.38, AUD:1.52, QAR:3.64, KWD:0.306, BHD:0.376, OMR:0.385,
  SGD:1.3, NZD:1.7, CHF:0.8, JPY:150, CNY:7.1, HKD:7.8, MYR:4.2, THB:32.5, PKR:281, BDT:122, LKR:300, NPR:141, PHP:58, IDR:16500, KRW:1400, TRY:41, EGP:48, ZAR:17.5 };
var RATES = FB, RMETA = { live:false, upd:'' };
var EU = ['DE','FR','ES','IT','NL','BE','AT','PT','IE','FI','GR','SK','SI','LT','LV','EE','LU','MT','CY','HR'];

/* ---------- RULES: every tax rate, cap and legal constant lives here ----------
   The live site loads /rules.json when a page opens and overrides these defaults,
   so a law change is fixed by editing one small file, not 60 pages. */
var RULES = { verified:'2026-10-11', banner:'',
  gst:[['5','India GST 5%'],['18','India GST 18%'],['40','India GST 40%'],['3','India GST 3% (gold)'],['15','Saudi Arabia VAT 15%'],['5','UAE VAT 5%'],['10','Bahrain VAT 10%'],['5','Oman VAT 5%'],['20','UK VAT 20%'],['19','Germany VAT 19%'],['5','Canada GST 5%'],['10','Australia GST 10%'],['9','Singapore GST 9%']],
  zakat:{gold_g:85,silver_g:595,rate:2.5},
  oman:{law_date:'2023-07-31'},
  ads:{on:false,client:'ca-pub-3737091947736959',slots:{below:'8237075406',side:''}},
  caps:{gratuity_in:2000000,uae_months:24,kuwait_months:18},
  metals:{auto:true}
};

/* ---------- small helpers ---------- */
function $(id){ return document.getElementById(id); }
function sg(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function ss(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
function pd(s){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||''); return m ? new Date(+m[1],+m[2]-1,+m[3]) : null; }
function iso(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function today(){ var t=new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()); }
function addDays(d,n){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n); }
function dd(a,b){ return Math.round((b-a)/864e5); }
function ymd(a,b){ var y=b.getFullYear()-a.getFullYear(), m=b.getMonth()-a.getMonth(), d=b.getDate()-a.getDate();
  if(d<0){ m--; d+=new Date(b.getFullYear(),b.getMonth(),0).getDate(); } if(m<0){ y--; m+=12; } return [y,m,d]; }
function ymTxt(n){ n=Math.max(0,Math.round(n)); var y=Math.floor(n/12), m=n%12; return (y?y+' yr ':'')+m+' mo'; }
function clean(n){ return String(Number(Number(n).toPrecision(5))); }
function nice(n){ if(!(n>0)) return 0; var m=Math.pow(10,Math.floor(Math.log(n)/Math.LN10)-1); return Math.round(n/m)*m; }
function sc(cur,usd){ return nice(usd*(FB[cur]||1)); }
function symOf(c){ try { var p=new Intl.NumberFormat('en',{style:'currency',currency:c,currencyDisplay:'narrowSymbol'}).formatToParts(0); for(var i=0;i<p.length;i++) if(p[i].type==='currency') return p[i].value; } catch(e){} return c; }

function guessCur(){
  var tz='', lang=(typeof navigator!=='undefined'&&navigator.language)||'en-US';
  try { tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''; } catch(e){}
  if(tz==='Asia/Kolkata'||tz==='Asia/Calcutta') return 'INR';
  if(tz==='Asia/Riyadh') return 'SAR';
  if(tz==='Asia/Dubai') return 'AED';
  var r=(lang.split('-')[1]||'').toUpperCase();
  var m={IN:'INR',SA:'SAR',AE:'AED',GB:'GBP',CA:'CAD',AU:'AUD',QA:'QAR',KW:'KWD',BH:'BHD',OM:'OMR',SG:'SGD',NZ:'NZD',PK:'PKR',BD:'BDT'};
  if(m[r]) return m[r]; if(EU.indexOf(r)>-1) return 'EUR'; return 'USD';
}

/* ---------- unit maths ---------- */
function econToL100(u,v){ return u==='l100'?v : u==='kml'?100/v : u==='mpgus'?K_US/v : K_UK/v; }
function l100ToEcon(u,l){ return u==='l100'?l : u==='kml'?100/l : u==='mpgus'?K_US/l : K_UK/l; }
function priceToPerL(u,p){ return u==='l'?p : u==='usgal'?p/L_US : p/L_UK; }
function perLToPrice(u,p){ return u==='l'?p : u==='usgal'?p*L_US : p*L_UK; }

var UT = {
 'Length':[['mm','Millimeters (mm)',0.001],['cm','Centimeters (cm)',0.01],['m','Meters (m)',1],['km','Kilometers (km)',1000],['in','Inches (in)',0.0254],['ft','Feet (ft)',0.3048],['yd','Yards (yd)',0.9144],['mi','Miles (mi)',1609.344]],
 'Weight':[['mg','Milligrams (mg)',1e-6],['g','Grams (g)',0.001],['kg','Kilograms (kg)',1],['q','Quintal (100 kg)',100],['t','Metric tons (t)',1000],['tola','Tola (11.66 g)',0.0116638],['oz','Ounces (oz)',0.028349523125],['lb','Pounds (lb)',0.45359237],['st','Stone (st)',6.35029318]],
 'Volume':[['ml','Milliliters (mL)',0.001],['l','Liters (L)',1],['m3','Cubic meters (m³)',1000],['tsp','Teaspoons (US)',0.00492892159375],['tbsp','Tablespoons (US)',0.01478676478125],['floz','Fluid ounces (US)',0.0295735295625],['cup','Cups (US)',0.2365882365],['pt','Pints (US)',0.473176473],['qt','Quarts (US)',0.946352946],['gal','Gallons (US)',3.785411784],['galuk','Gallons (UK)',4.54609]],
 'Area':[['mm2','Square millimeters (mm²)',1e-6],['cm2','Square centimeters (cm²)',1e-4],['m2','Square meters (m²)',1],['km2','Square kilometers (km²)',1e6],['in2','Square inches (in²)',0.00064516],['ft2','Square feet (ft²)',0.09290304],['yd2','Square yards / gaj (yd²)',0.83612736],['ac','Acres',4046.8564224],['ha','Hectares',10000],['mi2','Square miles (mi²)',2589988.110336]],
 'Speed':[['mps','Meters per second (m/s)',1],['kmh','Kilometers per hour (km/h)',0.2777777777777778],['mph','Miles per hour (mph)',0.44704],['kn','Knots',0.5144444444444445],['fps','Feet per second (ft/s)',0.3048]],
 'Time':[['s','Seconds',1],['min','Minutes',60],['h','Hours',3600],['d','Days',86400],['wk','Weeks',604800],['mo','Months (30.44 days)',2629746],['yr','Years (365 days)',31536000]],
 'Temperature':[['c','Celsius (°C)',null],['f','Fahrenheit (°F)',null],['k','Kelvin (K)',null]],
 'Fuel economy':[['l100','L/100 km',null],['kml','km per litre',null],['mpgus','MPG (US)',null],['mpguk','MPG (UK)',null]]
};
var UDEF = { 'Length':['m','ft'],'Weight':['kg','lb'],'Volume':['l','gal'],'Area':['m2','ft2'],'Speed':['kmh','mph'],'Time':['h','min'],'Temperature':['c','f'],'Fuel economy':['l100','mpgus'] };
function G(x,X){ var a=Math.abs(x); return a===0?'0':(a>=1e-4&&a<1e12)?X.N(x,6):x.toExponential(4); }

/* ---------- formatter factory ---------- */
function makeX(cur){
  var c=CUR[cur]||CUR.USD, loc=c[1], X={ cur:cur, loc:loc, sym:symOf(cur), T:T };
  X.M=function(n,d,code){ code=code||cur; try { var o={style:'currency',currency:code};
      if(d!=null){ o.minimumFractionDigits=d; o.maximumFractionDigits=d; }
      return new Intl.NumberFormat((CUR[code]||c)[1],o).format(n); } catch(e){ return code+' '+Number(n).toFixed(d==null?2:d); } };
  X.N=function(n,d){ d=d==null?2:d; return new Intl.NumberFormat(loc,{maximumFractionDigits:d}).format(n); };
  X.P=function(n,d){ return X.N(n,d==null?2:d)+'%'; };
  X.D=function(dt){ var l=L(); return dt.toLocaleDateString(l==='ar'?'ar-SA-u-ca-gregory-nu-latn':l==='hi'?'hi-IN-u-nu-latn':(loc==='en-US'?'en-US':'en-GB'),{day:'numeric',month:'long',year:'numeric'}); };
  return X;
}

/* ---------- calculators ---------- */
var CALCS = {};
function def(id,o){ o.id=id; CALCS[id]=o; }
var NEED = { err:'Fill in all the fields to see the result.' };

function fuelDef(R){
  var cu=R.cur, du=(cu==='USD'||cu==='GBP')?'mi':'km',
      eu=cu==='USD'?'mpgus':cu==='GBP'?'mpguk':cu==='INR'?'kml':'l100',
      pu=cu==='USD'?'usgal':'l',
      l100=cu==='INR'?100/15:cu==='EUR'?7:8.4,
      perL={USD:0.925,GBP:1.45,EUR:1.75,INR:100,SAR:2.18,AED:2.7,CAD:1.6,AUD:1.9}[cu]||0.95*(FB[cu]||1);
  return { du:du, eu:eu, pu:pu, dist:300, econ:Number(l100ToEcon(eu,l100).toFixed(2)), price:Number(perLToPrice(pu,perL).toFixed(2)) };
}

def('loan',{ f:[
  {k:'a',l:'Loan amount ({c})',d:function(R){return R.cur==='INR'?2500000:sc(R.cur,300000);}},
  {k:'r',l:'Interest rate (% per year)',d:function(R){return R.cur==='INR'?9:6.5;}},
  {k:'n',l:'Loan term',d:function(R){return R.cur==='INR'?20:30;}},
  {k:'u',t:'s',l:'Term in',o:[['y','Years'],['m','Months']],d:'y'},
  {k:'x',l:'Extra monthly payment ({c}), optional',d:0,opt:1}
], fn:function(v,X){
  var n=Math.round(v.n*(v.u==='y'?12:1)); if(!(n>0)||!(v.a>0)||v.r<0) return NEED;
  var i=v.r/1200, m=i?v.a*i/(1-Math.pow(1+i,-n)):v.a/n, tot=m*n;
  var rows=[['Monthly payment',X.M(m),1],['Total of all payments',X.M(tot)],['Total interest',X.M(tot-v.a)],['Interest share of total',X.P((tot-v.a)/tot*100,1)]];
  if(v.x>0){ var b=v.a,k=0,ti=0,pay=m+v.x; while(b>0.005&&k<1200){ var it=b*i; ti+=it; b=b+it-pay; k++; }
    rows.push(['With extra payment, paid off in',ymTxt(k)],['Interest saved',X.M(tot-v.a-ti)],['Time saved',ymTxt(n-k)]); }
  return rows; }});

def('compound',{ f:[
  {k:'p',l:'Starting amount ({c})',d:function(R){return sc(R.cur,5000);}},
  {k:'m',l:'Monthly deposit ({c})',d:function(R){return sc(R.cur,200);},opt:1},
  {k:'r',l:'Annual interest rate (%)',d:7},
  {k:'y',l:'Years',d:20},
  {k:'f',t:'s',l:'Compounding',o:[['12','Monthly'],['4','Quarterly'],['1','Yearly'],['365','Daily']],d:'12'}
], fn:function(v,X){
  if(!(v.y>0)||v.r<0||(v.p<=0&&v.m<=0)) return NEED;
  var nf=+v.f, im=Math.pow(1+v.r/100/nf,nf/12)-1, k=Math.round(v.y*12), b=v.p;
  for(var j=0;j<k;j++) b=b*(1+im)+v.m;
  var put=v.p+v.m*k;
  return [['Final balance',X.M(b),1],['Total you put in',X.M(put)],['Interest earned',X.M(b-put)],
          ['Effective annual rate',X.P((Math.pow(1+v.r/100/nf,nf)-1)*100,2)],['Growth multiple',X.N(b/put,2)+'x']]; }});

def('tip',{ f:[
  {k:'b',l:'Bill amount ({c})',d:function(R){return sc(R.cur,85);}},
  {k:'t',l:'Tip (%)',d:function(R){return R.cur==='USD'?18:10;}},
  {k:'p',l:'People sharing',d:2},
  {k:'ru',t:'c',l:'Round each share up to a whole number',d:false}
], fn:function(v,X){
  if(!(v.b>0)||v.t<0) return NEED;
  var tip=v.b*v.t/100, tot=v.b+tip, p=Math.max(1,Math.round(v.p)), each=tot/p;
  if(v.ru) each=Math.ceil(each);
  var rows=[['Each person pays',X.M(each),1],['Tip',X.M(tip)],['Total with tip',X.M(tot)],['Tip per person',X.M(tip/p)]];
  if(v.ru) rows.push(['Extra from rounding up',X.M(each*p-tot)]);
  return rows; }});

def('percent',{ f:[
  {k:'md',t:'s',l:'What do you want to find?',o:[['of','What is X% of Y?'],['is','X is what % of Y?'],['inc','Increase Y by X%'],['dec','Decrease Y by X%'],['whole','X is Y% of what number?']],d:'of'},
  {k:'x',l:function(v){return v.md==='is'?'Number X':v.md==='whole'?'Number X':'Percentage X (%)';},d:15},
  {k:'y',l:function(v){return v.md==='whole'?'Percentage Y (%)':'Number Y';},d:function(){return 240;}}
], fn:function(v,X){
  var x=v.x,y=v.y; if(isNaN(x)||isNaN(y)) return NEED;
  if(v.md==='of') return [['Result',X.N(x*y/100,4),1],['Working',X.N(x,4)+'% × '+X.N(y,4)+' ÷ 100']];
  if(v.md==='is'){ if(!y) return {err:'Number Y cannot be zero.'}; return [['Result',X.N(x/y*100,4)+'%',1],['Working',X.N(x,4)+' ÷ '+X.N(y,4)+' × 100']]; }
  if(v.md==='inc') return [['Result',X.N(y*(1+x/100),4),1],['Increase amount',X.N(y*x/100,4)],['Working',X.N(y,4)+' × (1 + '+X.N(x,4)+'/100)']];
  if(v.md==='dec') return [['Result',X.N(y*(1-x/100),4),1],['Decrease amount',X.N(y*x/100,4)],['Working',X.N(y,4)+' × (1 − '+X.N(x,4)+'/100)']];
  if(!y) return {err:'Percentage Y cannot be zero.'};
  return [['Result',X.N(x/(y/100),4),1],['Working',X.N(x,4)+' ÷ ('+X.N(y,4)+' ÷ 100)']]; }});

def('bmi',{ f:[
  {k:'sys',t:'s',l:'Units',o:[['m','Metric (kg, cm)'],['us','US (lb, ft, in)']],d:function(R){return R.cur==='USD'?'us':'m';}},
  {k:'kg',l:'Weight (kg)',d:70,sh:function(v){return v.sys==='m';}},
  {k:'cm',l:'Height (cm)',d:170,sh:function(v){return v.sys==='m';}},
  {k:'lb',l:'Weight (lb)',d:154,sh:function(v){return v.sys==='us';}},
  {k:'ft',l:'Height (ft)',d:5,sh:function(v){return v.sys==='us';}},
  {k:'inch',l:'Height (in)',d:7,opt:1,sh:function(v){return v.sys==='us';}},
  {k:'asia',t:'c',l:'Use Asian BMI cut-offs (23 and 25)',d:function(R){return R.cur==='INR'||R.cur==='PKR'||R.cur==='BDT'||R.cur==='LKR'||R.cur==='NPR';}}
], fn:function(v,X){
  var us=v.sys==='us', kg=us?v.lb*0.45359237:v.kg, m=us?(v.ft*12+(v.inch||0))*0.0254:v.cm/100;
  if(!(kg>=10)||!(m>=0.5)||m>2.8) return {err:'Enter a realistic adult weight and height.'};
  var b=kg/(m*m), cat;
  if(v.asia) cat=b<18.5?'Underweight':b<23?'Healthy weight':b<25?'Overweight':b<30?'Obese (class I)':'Obese (class II)';
  else cat=b<18.5?'Underweight':b<25?'Healthy weight':b<30?'Overweight':b<35?'Obese (class I)':b<40?'Obese (class II)':'Obese (class III)';
  var lo=18.5*m*m, hi=(v.asia?22.9:24.9)*m*m, W=function(k){ return us?X.N(k/0.45359237,1)+' lb':X.N(k,1)+' kg'; };
  var rows=[['Your BMI',X.N(b,1),1],['Category',cat],['Healthy weight range for your height',X.T('{a} to {b}',{a:W(lo),b:W(hi)})]];
  rows.push(kg>hi?['To reach the healthy range',X.T('Lose about {w}',{w:W(kg-hi)})]:kg<lo?['To reach the healthy range',X.T('Gain about {w}',{w:W(lo-kg)})]:['To reach the healthy range','You are already in range']);
  return rows; }});

def('age',{ f:[
  {k:'d',t:'d',l:'Date of birth',d:'1995-06-15'},
  {k:'a',t:'d',l:'Age on this date',d:function(){return iso(today());}}
], fn:function(v,X){
  var b=pd(v.d), a=pd(v.a); if(!b||!a) return {err:'Pick both dates.'}; if(b>a) return {err:'Date of birth must be before the second date.'};
  var p=ymd(b,a), days=dd(b,a), nb=new Date(a.getFullYear(),b.getMonth(),b.getDate()); if(nb<a) nb=new Date(a.getFullYear()+1,b.getMonth(),b.getDate());
  var to=dd(a,nb);
  return [['Age',p[0]+' years, '+p[1]+' months, '+p[2]+' days',1],['Total months',X.N(p[0]*12+p[1],0)],['Total weeks',X.N(Math.floor(days/7),0)],['Total days',X.N(days,0)],
          ['Next birthday',to===0?'Today!':'in '+to+' days ('+nb.toLocaleDateString('en-US',{weekday:'long'})+')'],
          ['Born on a',b.toLocaleDateString('en-US',{weekday:'long'})]]; }});

def('discount',{ f:[
  {k:'p',l:'Original price ({c})',d:function(R){return sc(R.cur,120);}},
  {k:'o',l:'Discount (%)',d:25},
  {k:'o2',l:'Extra discount (%), optional',d:0,opt:1},
  {k:'t',l:'Tax rate (%)',d:function(R){return R.cur==='USD'?8.25:R.cur==='INR'?18:R.cur==='SAR'?15:R.cur==='AED'?5:R.cur==='GBP'?20:10;}},
  {k:'tm',t:'s',l:'Tax is',o:[['add','Added on top (sales tax)'],['incl','Already included in the price (GST / VAT)']],d:function(R){return R.cur==='USD'?'add':'incl';}}
], fn:function(v,X){
  if(!(v.p>0)||v.o<0||v.o>100||v.o2<0||v.o2>100||v.t<0) return {err:'Check the price and percentages.'};
  var s=v.p*(1-v.o/100)*(1-v.o2/100), tax, fin;
  if(v.tm==='add'){ tax=s*v.t/100; fin=s+tax; } else { fin=s; tax=s-s/(1+v.t/100); }
  return [['Final price',X.M(fin),1],['You save',X.M(v.p-s)],['Price after discount',X.M(s)],[v.tm==='add'?'Tax added':'Tax included in price',X.M(tax)],['Effective discount',X.P((1-s/v.p)*100,2)]]; }});

def('dates',{ f:[
  {k:'a',t:'d',l:'From',d:function(){return iso(today());}},
  {k:'b',t:'d',l:'To',d:function(){return iso(addDays(today(),100));}},
  {k:'c',t:'c',l:'Count both the start and end day',d:false},
  {k:'w',t:'s',l:'Weekend days',o:[['6,0','Saturday and Sunday'],['5,6','Friday and Saturday']],d:function(R){return ['SAR','KWD','QAR','BHD','OMR'].indexOf(R.cur)>-1?'5,6':'6,0';}}
], fn:function(v,X){
  var a=pd(v.a), b=pd(v.b); if(!a||!b) return {err:'Pick both dates.'};
  var s=a<=b?a:b, e=a<=b?b:a, days=dd(s,e)+(v.c?1:0); if(days>36600) return {err:'Please pick dates less than 100 years apart.'};
  var p=ymd(s,e), we=v.w.split(',').map(Number), bd=0, last=v.c?days:days;
  for(var i=0;i<days;i++){ var wd=addDays(s,i).getDay(); if(we.indexOf(wd)<0) bd++; }
  return [['Days between',X.N(days,0)+' days',1],['Weeks and days',Math.floor(days/7)+' weeks, '+(days%7)+' days'],['Years, months, days',p[0]+' y, '+p[1]+' m, '+p[2]+' d'],
          ['Working days',X.N(bd,0)],['Weekend days',X.N(days-bd,0)]]; }});

def('hourly',{ f:[
  {k:'md',t:'s',l:'Convert',o:[['h2s','Hourly rate to salary'],['s2h','Yearly salary to hourly rate']],d:'h2s'},
  {k:'a',l:function(v){return v.md==='h2s'?'Hourly rate ({c})':'Yearly salary ({c})';},d:function(R){return R.cur==='INR'?500:sc(R.cur,25);}},
  {k:'h',l:'Hours per week',d:40},
  {k:'w',l:'Paid weeks per year',d:52}
], fn:function(v,X){
  if(!(v.a>0)||!(v.h>0)||!(v.w>0)) return NEED;
  var y=v.md==='h2s'?v.a*v.h*v.w:v.a, hr=y/(v.h*v.w);
  return [[v.md==='h2s'?'Yearly salary':'Hourly rate',v.md==='h2s'?X.M(y):X.M(hr),1],['Monthly',X.M(y/12)],['Every two weeks',X.M(y/26)],['Weekly',X.M(y/v.w)],['Daily (5-day week)',X.M(y/v.w/5)],['Hourly',X.M(hr)]]; }});

def('fuel',{ f:[
  {k:'du',t:'s',l:'Distance unit',o:[['mi','Miles'],['km','Kilometers']],d:function(R){return fuelDef(R).du;}},
  {k:'dist',l:'Trip distance',d:300,cv:{sel:'du',fn:function(x,a,b){return x*(a==='mi'?KM_MI:1)/(b==='mi'?KM_MI:1);}}},
  {k:'eu',t:'s',l:'Fuel economy unit',o:[['mpgus','MPG (US)'],['mpguk','MPG (UK)'],['kml','km per litre'],['l100','L per 100 km']],d:function(R){return fuelDef(R).eu;}},
  {k:'econ',l:'Fuel economy',d:function(R){return fuelDef(R).econ;},cv:{sel:'eu',fn:function(x,a,b){return l100ToEcon(b,econToL100(a,x));}}},
  {k:'pu',t:'s',l:'Fuel price per',o:[['l','Litre'],['usgal','US gallon'],['ukgal','UK gallon']],d:function(R){return fuelDef(R).pu;}},
  {k:'price',l:'Fuel price ({c})',d:function(R){return fuelDef(R).price;},cv:{sel:'pu',fn:function(x,a,b){return perLToPrice(b,priceToPerL(a,x));}}},
  {k:'rt',t:'c',l:'Round trip',d:false},
  {k:'ppl',l:'People sharing the cost',d:1,opt:1}
], fn:function(v,X){
  if(!(v.dist>0)||!(v.econ>0)||!(v.price>=0)) return NEED;
  var ppl=Math.max(1,Math.floor(v.ppl||1)), km=v.dist*(v.du==='mi'?KM_MI:1)*(v.rt?2:1), l100=econToL100(v.eu,v.econ), pl=priceToPerL(v.pu,v.price),
      L=km*l100/100, cost=L*pl, pk=pl*l100/100;
  var gal=v.pu==='ukgal'?X.N(L/L_UK,2)+' UK gal':X.N(L/L_US,2)+' US gal';
  var rows=[[v.rt?'Round trip cost':'Trip cost',X.M(cost),1],['Fuel needed',X.N(L,1)+' L ('+gal+')'],['Cost per km',X.M(pk,pk<1?3:2)],['Cost per mile',X.M(pk*KM_MI,pk*KM_MI<1?3:2)]];
  if(ppl>1) rows.push(['Cost per person',X.M(cost/ppl)]);
  rows.push(['CO₂ (petrol, approx.)',X.N(L*2.31,1)+' kg']); return rows; }});

def('roi',{ f:[
  {k:'i',l:'Amount invested ({c})',d:function(R){return sc(R.cur,10000);}},
  {k:'f',l:'Current or final value ({c})',d:function(R){return sc(R.cur,15000);}},
  {k:'y',l:'Years held',d:4}
], fn:function(v,X){
  if(!(v.i>0)||v.f<0||!(v.y>0)) return NEED;
  var t=(v.f-v.i)/v.i*100, a=v.f>0?(Math.pow(v.f/v.i,1/v.y)-1)*100:-100, rows=[['Total return',X.P(t),1],['Profit or loss',X.M(v.f-v.i)],['Annualized return (CAGR)',X.P(a)],['Value multiple',X.N(v.f/v.i,2)+'x']];
  if(a>0) rows.push(['Years to double at this rate',X.N(Math.log(2)/Math.log(1+a/100),1)+' years']); return rows; }});

def('change',{ f:[
  {k:'a',l:'Old value',d:80},{k:'b',l:'New value',d:100}
], fn:function(v,X){
  if(isNaN(v.a)||isNaN(v.b)||v.a===0) return {err:'Old value cannot be zero or blank.'};
  var ch=(v.b-v.a)/Math.abs(v.a)*100, rows=[[ch>=0?'Percent increase':'Percent decrease',X.P(Math.abs(ch),4),1],['Difference',X.N(v.b-v.a,4)],['Change as a ratio',X.N(v.b/v.a,4)+'x']];
  if(v.b!==0) rows.push(['Change needed to get back',X.P((v.a-v.b)/Math.abs(v.b)*100,2)]); return rows; }});

def('due',{ f:[
  {k:'d',t:'d',l:'First day of last period',d:function(){return iso(addDays(today(),-70));}},
  {k:'c',l:'Average cycle length (days)',d:28}
], fn:function(v,X){
  var l=pd(v.d); if(!l||!(v.c>=20)||v.c>45) return {err:'Pick a date and a cycle length between 20 and 45 days.'};
  var adj=Math.round(v.c)-28, due=addDays(l,280+adj), t=today(), ga=dd(l,t);
  if(ga<-30||ga>300) return {err:'That date looks too far from today. Check the first day of your last period.'};
  var rows=[['Estimated due date',X.D(due),1]];
  if(ga>=0){ var w=Math.floor(ga/7); rows.push(['Pregnancy today',w+' weeks, '+(ga%7)+' days'],['Trimester',w<14?'First':w<28?'Second':'Third'],['Days to go',dd(t,due)>0?String(dd(t,due)):'Due date has passed']); }
  rows.push(['Estimated conception',X.D(addDays(l,Math.round(v.c)-14))],['Full-term window (37 to 42 weeks)',X.D(addDays(l,259+adj))+' to '+X.D(addDays(l,294+adj))]); return rows; }});

def('area',{ f:[
  {k:'s',t:'s',l:'Shape',o:[['rect','Rectangle or room'],['tri','Triangle'],['circ','Circle']],d:'rect'},
  {k:'u',t:'s',l:'Unit you are measuring in',o:[['ft','Feet'],['in','Inches'],['yd','Yards'],['m','Meters'],['cm','Centimeters'],['mm','Millimeters'],['km','Kilometers'],['mi','Miles']],d:function(R){return (R.cur==='USD'||R.cur==='GBP'||R.cur==='INR')?'ft':'m';}},
  {k:'l',l:function(v){return v.s==='tri'?'Base':v.s==='circ'?'Radius':'Length';},d:12},
  {k:'w',l:function(v){return v.s==='tri'?'Height':'Width';},d:10,sh:function(v){return v.s!=='circ';}},
  {k:'h',l:'Depth or height, optional (for volume)',d:0,opt:1}
], fn:function(v,X){
  var K={ft:0.3048,in:0.0254,yd:0.9144,m:1,cm:0.01,mm:0.001,km:1000,mi:1609.344}, k=K[v.u]||1, L=v.l*k, W=(v.w||0)*k, H=(v.h||0)*k, a, per;
  if(!(v.l>0)||(v.s!=='circ'&&!(v.w>0))) return NEED;
  if(v.s==='rect'){ a=L*W; per=2*(L+W); } else if(v.s==='tri'){ a=0.5*L*W; per=null; } else { a=Math.PI*L*L; per=2*Math.PI*L; }
  var rows=[['Square feet',X.N(a/0.09290304),1],['Square meters',X.N(a)],['Square yards (gaj)',X.N(a/0.83612736)],['Square inches',X.N(a/0.00064516)],['Square centimeters',X.N(a*1e4)],['Acres',X.N(a/4046.8564224,4)],['Hectares',X.N(a/10000,6)]];
  if(per) rows.push([v.s==='circ'?'Circumference':'Perimeter',X.N(per/k)+' '+v.u]);
  if(H>0){ var vol=a*H; rows.push(['Volume (cubic feet)',X.N(vol/0.028316846592)],['Volume (cubic meters)',X.N(vol,3)],['Volume (litres)',X.N(vol*1000,1)]); }
  return rows; }});

def('goal',{ f:[
  {k:'md',t:'s',l:'Find',o:[['time','How long it will take'],['monthly','How much to save each month']],d:'time'},
  {k:'t',l:'Savings goal ({c})',d:function(R){return sc(R.cur,20000);}},
  {k:'c',l:'Saved so far ({c})',d:function(R){return sc(R.cur,2000);},opt:1},
  {k:'m',l:'Monthly deposit ({c})',d:function(R){return sc(R.cur,400);},sh:function(v){return v.md==='time';}},
  {k:'y',l:'Years to reach the goal',d:5,sh:function(v){return v.md==='monthly';}},
  {k:'r',l:'Annual return (%)',d:4,opt:1}
], fn:function(v,X){
  if(!(v.t>0)) return NEED; var i=v.r/1200;
  if(v.md==='time'){ if(!(v.m>0)&&v.c<v.t) return {err:'Enter a monthly deposit above zero.'};
    var b=v.c,k=0; while(b<v.t&&k<1200){ b=b*(1+i)+v.m; k++; }
    if(b<v.t) return {err:'The goal is not reachable within 100 years with these numbers.'};
    var put=v.c+v.m*k; return [['Time needed',ymTxt(k),1],['Total months',X.N(k,0)],['You will deposit',X.M(put)],['Growth earned',X.M(v.t-put)]]; }
  if(!(v.y>0)) return NEED; var n=Math.round(v.y*12), need=v.t-v.c*Math.pow(1+i,n);
  var pmt=need<=0?0:(i?need*i/(Math.pow(1+i,n)-1):need/n);
  return [['Save each month',X.M(pmt),1],['Total you deposit',X.M(pmt*n+v.c)],['Growth earned',X.M(v.t-v.c-pmt*n)],['Months',X.N(n,0)]]; }});

def('units',{ f:[
  {k:'cat',t:'s',l:'Category',o:Object.keys(UT).map(function(c){return [c,c];}),d:'Length'},
  {k:'x',l:'Value',d:1},
  {k:'u',t:'s',l:'From',o:function(v){return UT[v.cat].map(function(u){return [u[0],u[1]];});},dd:function(v){return UDEF[v.cat][0];}},
  {k:'to',t:'s',l:'To',o:function(v){return UT[v.cat].map(function(u){return [u[0],u[1]];});},dd:function(v){return UDEF[v.cat][1];}}
], fn:function(v,X){
  var list=UT[v.cat], x=v.x; if(isNaN(x)) return NEED;
  var fu=list.filter(function(u){return u[0]===v.u;})[0], tu=list.filter(function(u){return u[0]===v.to;})[0]; if(!fu||!tu) return NEED;
  var tr=function(code,val){ // convert to base
    if(v.cat==='Temperature') return code==='c'?val:code==='f'?(val-32)*5/9:val-273.15;
    if(v.cat==='Fuel economy') return econToL100(code,val);
    return val*list.filter(function(u){return u[0]===code;})[0][2]; };
  var fr=function(code,base){
    if(v.cat==='Temperature') return code==='c'?base:code==='f'?base*9/5+32:base+273.15;
    if(v.cat==='Fuel economy') return l100ToEcon(code,base);
    return base/list.filter(function(u){return u[0]===code;})[0][2]; };
  if(v.cat==='Fuel economy'&&!(x>0)) return {err:'Enter a value above zero.'};
  var base=tr(v.u,x), y=fr(v.to,base), rows=[['Result',G(x,X)+' '+fu[1]+' = '+G(y,X)+' '+tu[1],1]];
  if(v.cat==='Length'){ var inch=base/0.0254, ft=Math.floor(inch/12+1e-9), ri=inch-ft*12; rows.push(['In feet and inches',ft+' ft '+X.N(ri,2)+' in']); }
  list.forEach(function(u){ rows.push([u[1],G(fr(u[0],base),X)]); }); return rows; }});

def('currency',{ f:[
  {k:'amt',l:'Amount',d:100},
  {k:'from',t:'s',l:'From',o:Object.keys(CUR).map(function(c){return [c,c+' – '+CUR[c][0]];}),d:function(R){return R.cur==='INR'?'SAR':R.cur;}},
  {k:'sw',t:'b',l:'⇅ Swap currencies',act:function(g,s){ var a=g('from'),b=g('to'); s('from',b); s('to',a); }},
  {k:'to',t:'s',l:'To',o:Object.keys(CUR).map(function(c){return [c,c+' – '+CUR[c][0]];}),d:'INR'}
], fn:function(v,X){
  if(isNaN(v.amt)||!RATES[v.from]||!RATES[v.to]) return NEED;
  var r=RATES[v.to]/RATES[v.from], rows=[['Converted amount',X.M(v.amt*r,null,v.to),1],['Exchange rate','1 '+v.from+' = '+X.N(r,r<1?5:4)+' '+v.to],['Inverse rate','1 '+v.to+' = '+X.N(1/r,1/r<1?5:4)+' '+v.from]];
  [10,100,1000,10000].forEach(function(a){ rows.push([X.N(a,0)+' '+v.from,X.M(a*r,null,v.to)]); });
  rows.push(['Rates',RMETA.live?X.T('Live, updated {t}',{t:RMETA.upd}):'Built-in approximate rates (live service not reachable)']);
  return rows; }});

def('gst',{ f:[
  {k:'md',t:'s',l:'What do you want to do?',o:[['add','Add tax to a price'],['remove','Remove tax from a price (price includes tax)']],d:'add'},
  {k:'a',l:'Amount ({c})',d:function(R){return sc(R.cur,100);}},
  {k:'ps',t:'s',l:'Quick rate',fill:'r',o:function(){return [['','Custom']].concat(RULES.gst);},d:''},
  {k:'r',l:'Tax rate (%)',d:function(R){return R.cur==='INR'?18:R.cur==='SAR'?15:R.cur==='AED'?5:R.cur==='GBP'?20:R.cur==='EUR'?19:R.cur==='CAD'?5:R.cur==='AUD'?10:R.cur==='USD'?8:18;}},
  {k:'sp',t:'c',l:'Show CGST / SGST / IGST split (India)',d:function(R){return R.cur==='INR';}}
], fn:function(v,X){
  if(!(v.a>=0)||!(v.r>=0)) return NEED; var net,tax,gross;
  if(v.md==='add'){ net=v.a; tax=net*v.r/100; gross=net+tax; } else { gross=v.a; net=gross/(1+v.r/100); tax=gross-net; }
  var rows=[[v.md==='add'?'Total with tax':'Price before tax',X.M(v.md==='add'?gross:net),1],['Tax amount',X.M(tax)],['Price before tax',X.M(net)],['Price with tax',X.M(gross)]];
  if(v.sp) rows.push(['CGST + SGST (same state)',X.M(tax/2)+' + '+X.M(tax/2)],['IGST (other state)',X.M(tax)]);
  return rows; }});

def('eosb',{ fixCur:'SAR', f:[
  {k:'w',l:'Last monthly wage, basic plus regular allowances ({c})',d:8000},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-4,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}},
  {k:'ty',t:'s',l:'How did employment end?',o:[['term','Employer ended the contract, or it expired'],['resign','Employee resigned'],['full','Full-award case (for example Article 81 or force majeure)']],d:'term'}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var p=ymd(s,e), yrs=p[0]+p[1]/12+p[2]/365;
  var full=yrs<=5?0.5*v.w*yrs:0.5*v.w*5+v.w*(yrs-5), f=1, tag='Full award';
  if(v.ty==='resign'){ if(yrs<2){ f=0; tag='Nothing (under 2 years)'; } else if(yrs<=5){ f=1/3; tag='One third'; } else if(yrs<10){ f=2/3; tag='Two thirds'; } else { f=1; tag='Full award (10 years or more)'; } }
  var due=full*f;
  return [['End-of-service award',X.M(due),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Full award before resignation reduction',X.M(full)],['Share applied',tag],['Equal to',X.T('{n} months of wage',{n:X.N(due/v.w,2)})]]; }});

def('zakat',{ f:[
  {k:'nb',t:'s',l:'Nisab based on',o:[['gold','Gold (85 g)'],['silver','Silver (595 g)']],d:'gold'},
  {k:'gp',l:'Gold price per gram ({c})',d:0,opt:1},
  {k:'sp',l:'Silver price per gram ({c})',d:0,opt:1},
  {k:'cash',l:'Cash, bank and savings ({c})',d:0,opt:1},
  {k:'gg',l:'Gold you own (grams)',d:0,opt:1},
  {k:'sg',l:'Silver you own (grams)',d:0,opt:1},
  {k:'inv',l:'Shares, funds and other investments ({c})',d:0,opt:1},
  {k:'biz',l:'Business stock and trade goods ({c})',d:0,opt:1},
  {k:'rec',l:'Money owed to you that you expect back ({c})',d:0,opt:1},
  {k:'debt',l:'Debts and bills due now ({c})',d:0,opt:1}
], fn:function(v,X){
  var need=v.nb==='gold'?v.gp:v.sp; if(!(need>0)) return {err:v.nb==='gold'?'Enter today\'s gold price per gram to find the nisab.':'Enter today\'s silver price per gram to find the nisab.'};
  var wealth=v.cash+v.gg*v.gp+v.sg*v.sp+v.inv+v.biz+v.rec-v.debt, nisab=v.nb==='gold'?RULES.zakat.gold_g*v.gp:RULES.zakat.silver_g*v.sp, due=wealth>=nisab?wealth*RULES.zakat.rate/100:0;
  return [['Zakat due (2.5%)',X.M(due),1],['Net zakatable wealth',X.M(wealth)],['Nisab threshold',X.M(nisab)],['Status',wealth>=nisab?'Above nisab, zakat is due':'Below nisab, no zakat due']]; }});

def('calorie',{ f:[
  {k:'sex',t:'s',l:'Sex',o:[['m','Male'],['f','Female']],d:'m'},
  {k:'age',l:'Age (years, 18 or over)',d:30},
  {k:'sys',t:'s',l:'Units',o:[['m','Metric (kg, cm)'],['us','US (lb, ft, in)']],d:function(R){return R.cur==='USD'?'us':'m';}},
  {k:'kg',l:'Weight (kg)',d:70,sh:function(v){return v.sys==='m';}},
  {k:'cm',l:'Height (cm)',d:170,sh:function(v){return v.sys==='m';}},
  {k:'lb',l:'Weight (lb)',d:154,sh:function(v){return v.sys==='us';}},
  {k:'ft',l:'Height (ft)',d:5,sh:function(v){return v.sys==='us';}},
  {k:'inch',l:'Height (in)',d:7,opt:1,sh:function(v){return v.sys==='us';}},
  {k:'act',t:'s',l:'Activity level',o:[['1.2','Little or no exercise'],['1.375','Light, 1 to 3 days a week'],['1.55','Moderate, 3 to 5 days a week'],['1.725','Hard, 6 to 7 days a week'],['1.9','Very hard, physical job plus training']],d:'1.375'},
  {k:'g',t:'s',l:'Goal',o:[['-0.75','Lose 0.75 kg per week'],['-0.5','Lose 0.5 kg per week'],['-0.25','Lose 0.25 kg per week'],['0','Maintain weight'],['0.25','Gain 0.25 kg per week'],['0.5','Gain 0.5 kg per week']],d:'0'},
  {k:'mx',t:'s',l:'Macro split',o:[['bal','Balanced (20% protein, 50% carbs, 30% fat)'],['hp','Higher protein (30% / 40% / 30%)'],['lc','Lower carb (30% / 25% / 45%)']],d:'bal'}
], fn:function(v,X){
  var us=v.sys==='us', kg=us?v.lb*0.45359237:v.kg, cm=us?(v.ft*12+(v.inch||0))*2.54:v.cm;
  if(!(v.age>=18)||v.age>100) return {err:'This calculator is for adults aged 18 to 100.'}; if(!(kg>=30)||!(cm>=120)) return {err:'Enter a realistic adult weight and height.'};
  var bmr=10*kg+6.25*cm-5*v.age+(v.sex==='m'?5:-161), tdee=bmr*(+v.act), g=+v.g, target=tdee+g*1100, floor=v.sex==='m'?1500:1200, note='';
  if(target<floor){ target=floor; note=' (raised to a safe minimum)'; }
  var wk=(target-tdee)/1100, sp={bal:[.2,.5,.3],hp:[.3,.4,.3],lc:[.3,.25,.45]}[v.mx];
  var rows=[['Daily calories for your goal',X.N(target,0)+' kcal'+note,1],['Maintenance calories (TDEE)',X.N(tdee,0)+' kcal'],['Basal metabolic rate (BMR)',X.N(bmr,0)+' kcal'],
    ['Protein',X.N(target*sp[0]/4,0)+' g'],['Carbohydrates',X.N(target*sp[1]/4,0)+' g'],['Fat',X.N(target*sp[2]/9,0)+' g'],
    ['Expected change',(wk>0?'Gain':wk<0?'Lose':'Hold')+(wk!==0?' about '+X.N(Math.abs(wk),2)+' kg per week':' your weight')]]; return rows; }});

def('quadratic',{ f:[{k:'a',l:'a (coefficient of x²)',d:1},{k:'b',l:'b (coefficient of x)',d:-3},{k:'c',l:'c (constant)',d:-10}],
 fn:function(v,X){
  var a=v.a,b=v.b,c=v.c; if(isNaN(a)||isNaN(b)||isNaN(c)) return NEED;
  var eq=X.N(a,4)+'x² '+(b<0?'− ':'+ ')+X.N(Math.abs(b),4)+'x '+(c<0?'− ':'+ ')+X.N(Math.abs(c),4)+' = 0';
  if(a===0){ if(b===0) return {err:'With a = 0 and b = 0 there is no equation to solve.'}; return [['Equation',eq],['Linear solution x',X.N(-c/b,6),1],['Note','a = 0 makes this a straight-line equation']]; }
  var D=b*b-4*a*c, rows=[['Equation',eq],['Discriminant (b² − 4ac)',X.N(D,6)]];
  if(D>0){ var s=Math.sqrt(D); rows.push(['Roots','x₁ = '+X.N((-b+s)/(2*a),6)+',  x₂ = '+X.N((-b-s)/(2*a),6),1],['Nature of roots','Two different real roots']); }
  else if(D===0){ rows.push(['Root','x = '+X.N(-b/(2*a),6),1],['Nature of roots','One repeated real root']); }
  else { var re=-b/(2*a), im=Math.sqrt(-D)/(2*Math.abs(a)); rows.push(['Roots','x = '+X.N(re,6)+' ± '+X.N(im,6)+'i',1],['Nature of roots','Two complex roots']); }
  rows.push(['Sum of roots (−b/a)',X.N(-b/a,6)],['Product of roots (c/a)',X.N(c/a,6)],['Vertex','('+X.N(-b/(2*a),4)+', '+X.N(c-b*b/(4*a),4)+')'],['Opens',a>0?'Upward':'Downward']); return rows; }});

def('sip',{ f:[
  {k:'s',l:'Monthly SIP amount ({c})',d:function(R){return R.cur==='INR'?5000:sc(R.cur,100);}},
  {k:'r',l:'Expected return (% per year)',d:12},
  {k:'y',l:'Years',d:10},
  {k:'st',l:'Yearly step-up (%), optional',d:0,opt:1},
  {k:'inf',l:'Inflation (% per year), optional',d:6,opt:1}
], fn:function(v,X){
  if(!(v.s>0)||v.r<0||!(v.y>0)) return NEED; var i=v.r/1200, n=Math.round(v.y*12), b=0, inv=0, cur=v.s;
  for(var m=0;m<n;m++){ if(m>0&&m%12===0) cur*=1+v.st/100; b=(b+cur)*(1+i); inv+=cur; }
  var real=b/Math.pow(1+v.inf/100,v.y);
  return [['Maturity value',X.M(b),1],['Total invested',X.M(inv)],['Estimated returns',X.M(b-inv)],['Value in today\'s money',X.M(real)]]; }});

def('fd',{ f:[
  {k:'md',t:'s',l:'Deposit type',o:[['fd','Fixed deposit (lump sum)'],['rd','Recurring deposit (monthly)']],d:'fd'},
  {k:'a',l:function(v){return v.md==='fd'?'Deposit amount ({c})':'Monthly deposit ({c})';},d:function(R){return R.cur==='INR'?100000:sc(R.cur,5000);}},
  {k:'r',l:'Interest rate (% per year)',d:7},
  {k:'n',l:'Tenure',d:5},
  {k:'u',t:'s',l:'Tenure in',o:[['y','Years'],['m','Months']],d:'y'},
  {k:'cf',t:'s',l:'Interest compounding (FD only)',o:[['4','Quarterly'],['12','Monthly'],['2','Half-yearly'],['1','Yearly'],['0','Simple interest']],d:'4',sh:function(v){return v.md==='fd';}}
], fn:function(v,X){
  if(!(v.a>0)||v.r<0||!(v.n>0)) return NEED; var months=Math.round(v.n*(v.u==='y'?12:1)), yrs=months/12, cf=+v.cf, A, inv, eff='';
  if(v.md==='fd'){ inv=v.a; A=cf===0?v.a*(1+v.r/100*yrs):v.a*Math.pow(1+v.r/100/cf,cf*yrs); eff=cf===0?v.r:(Math.pow(1+v.r/100/cf,cf)-1)*100; }
  else { var im=Math.pow(1+v.r/400,1/3)-1; A=0; for(var k=1;k<=months;k++) A+=v.a*Math.pow(1+im,months-k+1); inv=v.a*months; eff=(Math.pow(1+v.r/400,4)-1)*100; }
  return [['Maturity amount',X.M(A),1],[v.md==='fd'?'Amount deposited':'Total deposited',X.M(inv)],['Interest earned',X.M(A-inv)],['Effective yearly yield',X.P(eff,2)]]; }});

def('gratuity',{ fixCur:'INR', f:[
  {k:'s',l:'Last drawn Basic + DA per month ({c})',d:50000},
  {k:'y',l:'Years of service',d:10},
  {k:'m',l:'Extra months',d:0,opt:1},
  {k:'rl',t:'s',l:'Employer is',o:[['act','Covered by the gratuity law (15 ÷ 26)'],['no','Not covered (15 ÷ 30)']],d:'act'},
  {k:'ru',t:'c',l:'Count more than 6 extra months as a full year',d:true},
  {k:'cap',l:'Tax-free limit ({c})',d:function(){return RULES.caps.gratuity_in;},opt:1}
], fn:function(v,X){
  if(!(v.s>0)||!(v.y>=0)||v.m<0||v.m>11) return {err:'Enter a monthly wage, years of service and months (0 to 11).'};
  var yrs=v.y+(v.rl==='act'&&v.ru&&v.m>6?1:0); if(!(yrs>0)) return {err:'Service must be at least one counted year.'};
  var g=v.s*15/(v.rl==='act'?26:30)*yrs, cap=v.cap>0?v.cap:Infinity, free=Math.min(g,cap);
  var rows=[['Gratuity',X.M(g),1],['Years counted',X.N(yrs,0)],['Tax-free portion (up to the limit)',X.M(free)],['Taxable portion',X.M(Math.max(0,g-free))]];
  if(v.y+v.m/12<5) rows.push(['Eligibility','Usually needs 5 years of service. Fixed-term employees may qualify after 1 year.']); return rows; }});


/* ---------- V2 calculators ---------- */
var HMONTHS=['Muharram','Safar','Rabi\u02bb I','Rabi\u02bb II','Jumada I','Jumada II','Rajab','Sha\u02bbban','Ramadan','Shawwal','Dhu al-Qi\u02bbdah','Dhu al-Hijjah'];
function hFmt(opt){ return new Intl.DateTimeFormat(sloc()+'-u-ca-islamic-umalqura'+(L()==='ar'?'-nu-latn':''),opt); }
function hParts(d){ var o={}; new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(d).forEach(function(p){ if(p.type==='day'||p.type==='month'||p.type==='year') o[p.type]=parseInt(p.value,10); }); return o; }
function hijriToGreg(hy,hm,hd){
  var est=Math.floor(hy*0.970224+621.5774), start=new Date(est-1,0,1), f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'});
  for(var i=0;i<1100;i++){ var d=addDays(start,i), o={}; f.formatToParts(d).forEach(function(p){ if(p.type==='day'||p.type==='month'||p.type==='year') o[p.type]=parseInt(p.value,10); });
    if(o.year===hy&&o.month===hm&&o.day===hd) return d; if(o.year>hy+1) break; }
  return null;
}
def('hijri',{ f:[
  {k:'md',t:'s',l:'Convert',o:[['g2h','Gregorian date to Hijri'],['h2g','Hijri date to Gregorian']],d:'g2h'},
  {k:'g',t:'d',l:'Gregorian date',d:function(){return iso(today());},sh:function(v){return v.md==='g2h';}},
  {k:'hy',l:'Hijri year',d:function(){return hParts(today()).year;},sh:function(v){return v.md==='h2g';}},
  {k:'hm',t:'s',l:'Hijri month',o:HMONTHS.map(function(m,i){return [String(i+1),(i+1)+' - '+m];}),d:function(){return String(hParts(today()).month);},sh:function(v){return v.md==='h2g';}},
  {k:'hd',l:'Hijri day',d:function(){return hParts(today()).day;},sh:function(v){return v.md==='h2g';}}
], fn:function(v,X){
  var wd=function(d){ return d.toLocaleDateString(sloc()+(L()==='ar'?'-u-ca-gregory':''),{weekday:'long'}); };
  if(v.md==='g2h'){ var d=pd(v.g); if(!d) return {err:'Pick a date.'};
    var y=d.getFullYear(); if(y<1900||y>2100) return {err:'Please pick a date between 1900 and 2100.'};
    var hp=hParts(d), name=hFmt({month:'long'}).format(d), full=hFmt({day:'numeric',month:'long',year:'numeric'}).format(d);
    return [['Hijri date',(L()==='ar'?full:hp.day+' '+name+' '+hp.year+' AH'),1],['Numeric',hp.day+'/'+hp.month+'/'+hp.year],['Day of the week',wd(d)],['Gregorian date',X.D(d)]]; }
  var hy=v.hy,hm=+v.hm,hd=v.hd; if(!(hy>=1300&&hy<=1600)||!(hd>=1&&hd<=30)) return {err:'Enter a Hijri year from 1300 to 1600 and a day from 1 to 30.'};
  var g=hijriToGreg(hy,hm,hd); if(!g) return {err:'That Hijri date does not exist. Check the day, because Hijri months have 29 or 30 days.'};
  return [['Gregorian date',X.D(g),1],['Day of the week',wd(g)],['Hijri date',L()==='ar'?hFmt({day:'numeric',month:'long',year:'numeric'}).format(g):hd+' '+HMONTHS[hm-1]+' '+hy+' AH']]; }});

def('overtime',{ fixCur:'SAR', f:[
  {k:'b',l:'Basic monthly wage ({c})',d:6000},
  {k:'al',l:'Fixed allowances per month ({c})',d:2000,opt:1},
  {k:'hpd',l:'Normal working hours per day',d:8},
  {k:'h',l:'Overtime hours worked',d:10}
], fn:function(v,X){
  if(!(v.b>0)||!(v.hpd>0)||!(v.h>=0)) return NEED;
  var act=(v.b+v.al)/(30*v.hpd), bas=v.b/(30*v.hpd), rate=act+0.5*bas;
  return [['Overtime pay',X.M(rate*v.h),1],['Overtime rate per hour',X.M(rate)],['Normal hourly wage',X.M(act)],['Basic hourly wage',X.M(bas)],['50% premium per hour',X.M(0.5*bas)]]; }});

function svcYears(s,e,unpaid){ var p=ymd(s,e); return Math.max(0,p[0]+p[1]/12+p[2]/365-(unpaid||0)/365); }
def('uaegrat',{ fixCur:'AED', f:[
  {k:'w',l:'Last basic monthly salary ({c}), without allowances',d:10000},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-6,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}},
  {k:'up',l:'Unpaid leave days, if any',d:0,opt:1}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var y=svcYears(s,e,v.up), p=ymd(s,e);
  if(y<1) return [['Gratuity',X.M(0),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Eligibility','Gratuity needs at least one year of service.']];
  var days=Math.min(y,5)*21+Math.max(0,y-5)*30, amt=v.w/30*days, cap=v.w*RULES.caps.uae_months, capped=amt>cap;
  return [['Gratuity',X.M(Math.min(amt,cap)),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Days of pay counted',X.N(days,1)+' days'],['Before the two-year cap',X.M(amt)],['Two-year cap',capped?'Applied':'Not reached']]; }});

def('qatar',{ fixCur:'QAR', f:[
  {k:'w',l:'Last basic monthly wage ({c})',d:7000},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-4,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var y=svcYears(s,e,0), p=ymd(s,e);
  if(y<1) return [['Gratuity',X.M(0),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Eligibility','Gratuity needs at least one year of service.']];
  var days=y*21; return [['Gratuity (minimum)',X.M(v.w/30*days),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Days of pay counted',X.N(days,1)+' days (3 weeks per year)']]; }});

def('oman',{ fixCur:'OMR', f:[
  {k:'w',l:'Last basic monthly wage ({c})',d:400},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-6,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}},
  {k:'up',l:'Unpaid leave days, if any',d:0,opt:1}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var cut=pd(RULES.oman.law_date)||new Date(2023,6,31), p=ymd(s,e), un=Math.max(0,v.up||0);
  var preEnd=e<cut?e:cut, yPre=s<cut?svcYears(s,preEnd,0):0, yPost=e>cut?svcYears(s<cut?cut:s,e,0):0, tot=yPre+yPost;
  if(tot>0&&un>0){ var f=Math.max(0,(tot*365-un)/(tot*365)); yPre*=f; yPost*=f; }
  var old=yPre<=3?0.5*v.w*yPre:0.5*v.w*3+v.w*(yPre-3), nw=v.w*yPost;
  return [['End-of-service gratuity',X.M(old+nw),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],
    ['Service before the new law',X.N(yPre,2)+' years'],['Gratuity for that part (15 days a year, then one month)',X.M(old)],
    ['Service after the new law',X.N(yPost,2)+' years'],['Gratuity for that part (one month a year)',X.M(nw)]]; }});

def('bahrain',{ fixCur:'BHD', f:[
  {k:'w',l:'Last monthly wage ({c}), basic plus fixed allowances',d:500},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-5,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}},
  {k:'up',l:'Unpaid leave days, if any',d:0,opt:1}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var y=svcYears(s,e,v.up), p=ymd(s,e), first=Math.min(y,3), rest=Math.max(0,y-3);
  return [['Leaving indemnity',X.M(0.5*v.w*first+v.w*rest),1],['Service counted',X.N(y,2)+' years'],['First 3 years (half a month each)',X.M(0.5*v.w*first)],['After 3 years (one month each)',X.M(v.w*rest)],
    ['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})]]; }});

var GOLD_CUR=['SAR','AED','QAR','KWD','OMR','BHD','INR','USD','GBP','EUR','CAD','AUD'];
def('gold',{ f:[
  {k:'c',t:'s',l:'Currency',o:GOLD_CUR.map(function(c){return [c,c+' - '+CUR[c][0]];}),d:function(R){return GOLD_CUR.indexOf(R.cur)>-1?R.cur:'USD';}},
  {k:'wt',l:'Weight of gold',d:10},
  {k:'wu',t:'s',l:'Weight unit',o:[['g','Grams'],['tola','Tola (11.66 g)'],['oz','Troy ounce (31.1 g)'],['kg','Kilograms']],d:'g'},
  {k:'k',t:'s',l:'Purity (karat)',o:[['24','24K (pure, 99.9%)'],['22','22K (91.6%)'],['21','21K (87.5%)'],['18','18K (75%)']],d:function(R){return R.cur==='INR'||R.cur==='AED'||R.cur==='QAR'?'22':(R.cur==='SAR'||R.cur==='KWD'||R.cur==='OMR'||R.cur==='BHD')?'21':'24';}},
  {k:'mk',l:'Making charges (%), for jewellery',d:0,opt:1},
  {k:'gp',l:'24K price per gram, optional (type it to replace the live price)',d:0,opt:1}
], fn:function(v,X){
  var f={g:1,tola:11.6638038,oz:31.1034768,kg:1000}[v.wu]||1, grams=v.wt*f;
  if(!(v.wt>0)) return NEED;
  var rate=(RATES[v.c]||1)/(RATES.USD||1), live=METALS.xau>0?METALS.xau/31.1034768*rate:0, p24=v.gp>0?v.gp:live;
  if(!(p24>0)) return {err:'The live gold price is not available right now. Please type today\'s 24K price per gram in the last box.'};
  var pure=grams*(v.k/24), total=pure*p24*(1+(v.mk||0)/100), M=function(n){ return X.M(n,null,v.c); };
  var rows=[['Value of your gold',M(total),1],['24K per gram',M(p24)],['22K per gram',M(p24*22/24)],['21K per gram',M(p24*21/24)],['18K per gram',M(p24*18/24)],
    ['24K per tola',M(p24*11.6638038)],['24K per ounce',M(p24*31.1034768)],['Pure gold in your piece',X.N(pure,2)+' g'],
    ['Price used',v.gp>0?'Your own price':'Live international price, indicative']];
  return rows; }});

def('kuwait',{ fixCur:'KWD', f:[
  {k:'w',l:'Last monthly wage ({c})',d:600},
  {k:'s',t:'d',l:'Start date',d:function(){return iso(new Date(today().getFullYear()-7,today().getMonth(),1));}},
  {k:'e',t:'d',l:'Last working day',d:function(){return iso(today());}},
  {k:'ty',t:'s',l:'How did employment end?',o:[['term','Employer ended the contract'],['resign','Employee resigned (open-ended contract)']],d:'term'}
], fn:function(v,X){
  var s=pd(v.s), e=pd(v.e); if(!s||!e||e<=s||!(v.w>0)) return {err:'Enter a wage and a valid start and end date.'};
  var y=svcYears(s,e,0), p=ymd(s,e), full=y<=5?0.5*v.w*y:0.5*v.w*5+v.w*(y-5), capv=RULES.caps.kuwait_months*v.w, capped=full>capv; full=Math.min(full,capv);
  var f=1, tag='Full indemnity'; if(v.ty==='resign'){ if(y<3){ f=0; tag='Nothing (under 3 years)'; } else if(y<5){ f=0.5; tag='Half'; } else if(y<10){ f=2/3; tag='Two thirds'; } else { f=1; tag='Full indemnity (10 years or more)'; } }
  return [['End-of-service indemnity',X.M(full*f),1],['Service period',X.T('{y} years, {m} months, {d} days',{y:p[0],m:p[1],d:p[2]})],['Full indemnity',X.M(full)],['Share applied',tag],['Cap of one and a half years of wages',capped?'Applied':'Not reached']]; }});

def('mortgage',{ f:[
  {k:'p',l:'Home price ({c})',d:function(R){return R.cur==='INR'?8000000:sc(R.cur,400000);}},
  {k:'dp',l:'Down payment (%)',d:20},
  {k:'r',l:'Interest rate (% per year)',d:function(R){return R.cur==='INR'?8.75:6.5;}},
  {k:'y',l:'Loan term (years)',d:function(R){return R.cur==='INR'?20:30;}},
  {k:'tx',l:'Property tax (% of price per year)',d:function(R){return R.cur==='USD'?1.1:0;},opt:1},
  {k:'ins',l:'Home insurance per year ({c})',d:function(R){return R.cur==='INR'?0:sc(R.cur,1200);},opt:1},
  {k:'hoa',l:'HOA or maintenance fees per month ({c})',d:0,opt:1}
], fn:function(v,X){
  if(!(v.p>0)||v.dp<0||v.dp>=100||v.r<0||!(v.y>0)) return NEED;
  var L=v.p*(1-v.dp/100), n=Math.round(v.y*12), i=v.r/1200, pi=i?L*i/(1-Math.pow(1+i,-n)):L/n, tax=v.p*v.tx/100/12, ins=v.ins/12, tot=pi+tax+ins+v.hoa;
  return [['Total monthly payment',X.M(tot),1],['Principal and interest',X.M(pi)],['Property tax',X.M(tax)],['Home insurance',X.M(ins)],['HOA or maintenance',X.M(v.hoa)],['Loan amount',X.M(L)],['Down payment',X.M(v.p-L)],['Total interest over the term',X.M(pi*n-L)]]; }});

var TZ=[['Asia/Riyadh','Riyadh (Saudi Arabia)'],['Asia/Dubai','Dubai (UAE)'],['Asia/Qatar','Doha (Qatar)'],['Asia/Kuwait','Kuwait City'],['Asia/Bahrain','Manama (Bahrain)'],['Asia/Muscat','Muscat (Oman)'],['Asia/Kolkata','New Delhi / Mumbai (India)'],['Asia/Karachi','Karachi (Pakistan)'],['Asia/Dhaka','Dhaka (Bangladesh)'],['Europe/London','London (UK)'],['Europe/Paris','Paris / Berlin (Europe)'],['Europe/Istanbul','Istanbul (Turkey)'],['Africa/Cairo','Cairo (Egypt)'],['America/New_York','New York (US East)'],['America/Chicago','Chicago (US Central)'],['America/Los_Angeles','Los Angeles (US West)'],['America/Toronto','Toronto (Canada)'],['Australia/Sydney','Sydney (Australia)'],['Asia/Singapore','Singapore'],['Asia/Tokyo','Tokyo (Japan)']];
function zoneOffset(tz,ms){ var p={}; new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(ms)).forEach(function(x){ p[x.type]=x.value; }); return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-ms; }
function localToUtc(tz,y,m,d,hh,mm){ var g=Date.UTC(y,m-1,d,hh,mm), o=zoneOffset(tz,g), u=g-o, o2=zoneOffset(tz,u); if(o2!==o) u=g-o2; return u; }
function tzFmt(ms,tz){ return new Intl.DateTimeFormat('en-GB',{timeZone:tz,weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(ms)); }
def('tz',{ f:[
  {k:'d',t:'d',l:'Date',d:function(){return iso(today());}},
  {k:'t',t:'t',l:'Time',d:'09:00'},
  {k:'from',t:'s',l:'From time zone',o:TZ,d:function(R){return {SAR:'Asia/Riyadh',AED:'Asia/Dubai',QAR:'Asia/Qatar',KWD:'Asia/Kuwait',INR:'Asia/Kolkata',GBP:'Europe/London',EUR:'Europe/Paris',USD:'America/New_York',CAD:'America/Toronto',AUD:'Australia/Sydney'}[R.cur]||'Asia/Riyadh';}},
  {k:'to',t:'s',l:'To time zone',o:TZ,d:function(R){return R.cur==='INR'?'Asia/Riyadh':'Asia/Kolkata';}}
], fn:function(v,X){
  var d=pd(v.d), m=/^(\d{2}):(\d{2})/.exec(v.t||''); if(!d||!m) return {err:'Pick a date and a time.'};
  var utc=localToUtc(v.from,d.getFullYear(),d.getMonth()+1,d.getDate(),+m[1],+m[2]), diff=(zoneOffset(v.to,utc)-zoneOffset(v.from,utc))/36e5;
  var rows=[['Time there',tzFmt(utc,v.to),1],['Time difference',(diff>=0?'+':'')+X.N(diff,2)+' hours']];
  TZ.forEach(function(z){ rows.push([z[1],tzFmt(utc,z[0])]); }); return rows; }});

def('cgpa',{ f:[
  {k:'md',t:'s',l:'Convert',o:[['c2p','CGPA to percentage'],['p2c','Percentage to CGPA']],d:'c2p'},
  {k:'sc',t:'s',l:'Conversion rule',o:[['cbse','CBSE (CGPA × 9.5)'],['gen','General (CGPA × 10)'],['vtu','VTU ((CGPA − 0.75) × 10)'],['mu','Mumbai University (7.1 × CGPA + 12)']],d:'cbse'},
  {k:'x',l:function(v){return v.md==='c2p'?'CGPA (out of 10)':'Percentage (%)';},d:function(){return 8.4;}}
], fn:function(v,X){
  var x=v.x; if(isNaN(x)||x<0) return NEED;
  if(v.md==='c2p'){ if(x>10) return {err:'CGPA on a 10 point scale cannot be above 10.'}; var p=v.sc==='cbse'?x*9.5:v.sc==='vtu'?(x-0.75)*10:v.sc==='mu'?7.1*x+12:x*10; return [['Percentage',X.N(p,2)+'%',1],['Rule used',v.sc==='cbse'?'CGPA × 9.5':v.sc==='vtu'?'(CGPA − 0.75) × 10':v.sc==='mu'?'7.1 × CGPA + 12':'CGPA × 10']]; }
  if(x>100) return {err:'Percentage cannot be above 100.'}; var c=v.sc==='cbse'?x/9.5:v.sc==='vtu'?x/10+0.75:v.sc==='mu'?(x-12)/7.1:x/10; return [['CGPA',X.N(c,2),1],['Rule used',v.sc==='cbse'?'Percentage ÷ 9.5':v.sc==='vtu'?'Percentage ÷ 10 + 0.75':v.sc==='mu'?'(Percentage − 12) ÷ 7.1':'Percentage ÷ 10']]; }});


/* ---------- live exchange rates ---------- */
function loadRates(done){
  var c=null; try { c=JSON.parse(sg('cp_rates')||'null'); } catch(e){}
  if(c&&c.r&&Date.now()-c.t<3600e3){ RATES=c.r; RMETA={live:true,upd:c.u}; done(); return; }
  if(c&&c.r){ RATES=c.r; RMETA={live:true,upd:c.u}; }
  if(typeof fetch==='undefined'){ done(); return; }
  fetch('https://open.er-api.com/v6/latest/USD').then(function(r){ return r.json(); }).then(function(j){
    if(j&&j.result==='success'&&j.rates&&j.rates.INR){ RATES=j.rates; var u=(j.time_last_update_utc||'').replace(/ \+0000$/,' UTC'); RMETA={live:true,upd:u};
      ss('cp_rates',JSON.stringify({t:Date.now(),r:j.rates,u:u})); }
    done(); }).catch(function(){ done(); });
}

/* ---------- live rules (law, tax rates, caps) ---------- */
function setVerified(){
  var els=document.querySelectorAll('[data-verified]'); if(!els.length) return;
  var d=new Date(RULES.verified+'T00:00:00'), t=isNaN(d)?RULES.verified:d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  [].forEach.call(els,function(e){ e.textContent=t; });
}
function showBanner(){
  var old=document.getElementById('cp-notice'); if(old) old.parentNode.removeChild(old);
  if(!RULES.banner) return; var m=document.getElementById('main'); if(!m) return;
  var n=document.createElement('div'); n.id='cp-notice'; n.className='notice'; n.setAttribute('role','status'); n.textContent=RULES.banner; m.insertBefore(n,m.firstChild);
}
function loadRules(done){
  if(typeof fetch==='undefined'){ done(); return; }
  fetch('/rules.json',{cache:'no-cache'}).then(function(r){ return r.json(); }).then(function(j){
    if(!j||typeof j!=='object'){ done(); return; }
    if(j.verified) RULES.verified=String(j.verified);
    RULES.banner=typeof j.banner==='string'?j.banner:'';
    if(j.gst&&j.gst.length) RULES.gst=j.gst;
    if(j.zakat) RULES.zakat={gold_g:+j.zakat.gold_g||RULES.zakat.gold_g,silver_g:+j.zakat.silver_g||RULES.zakat.silver_g,rate:+j.zakat.rate||RULES.zakat.rate};
    if(j.caps) for(var k in j.caps){ if(+j.caps[k]>0) RULES.caps[k]=+j.caps[k]; }
    if(j.metals) RULES.metals.auto=j.metals.auto!==false;
    if(j.oman&&j.oman.law_date) RULES.oman.law_date=String(j.oman.law_date);
    if(j.ads){ RULES.ads.on=j.ads.on===true; if(j.ads.client) RULES.ads.client=String(j.ads.client); if(j.ads.slots) for(var q in j.ads.slots) RULES.ads.slots[q]=String(j.ads.slots[q]||''); }
    done(); }).catch(function(){ done(); });
}
function afterRules(){
  if(!CAL) return;
  CAL.f.forEach(function(f){
    if(f.t==='s'&&typeof f.o==='function'&&f.fill) fillSelect(f,readVals(),true);
    if(f.k==='cap'&&!touched.cap&&$('f_cap')) $('f_cap').value=dflt(f,{});
  });
  update(); setVerified(); showBanner(); initAds();
}


/* ---------- ads: switched on from rules.json ("ads":{"on":true}) after AdSense approval ---------- */
var adsDone=false, METALS={xau:0,xag:0,t:0};
function initAds(){
  if(adsDone||!(RULES.ads.on||ADS_ON)||!RULES.ads.client) return; adsDone=true;
  document.documentElement.classList.add('ads-on');
  var slots=document.querySelectorAll('.ad'), used=0;
  [].forEach.call(slots,function(el){
    var id=el.classList.contains('wide')?RULES.ads.slots.below:RULES.ads.slots.side;
    if(!id){ el.style.display='none'; return; }
    el.innerHTML='<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="'+RULES.ads.client+'" data-ad-slot="'+id+'" data-ad-format="auto" data-full-width-responsive="true"></ins>'; used++;
  });
  if(!used) return;
  var pushAll=function(){ [].forEach.call(document.querySelectorAll('ins.adsbygoogle'),function(){ try{ (root.adsbygoogle=root.adsbygoogle||[]).push({}); }catch(e){} }); };
  if(document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')){ pushAll(); return; }
  var s=document.createElement('script'); s.async=true; s.crossOrigin='anonymous'; s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+RULES.ads.client;
  s.onload=function(){ [].forEach.call(document.querySelectorAll('ins.adsbygoogle'),function(){ try{ (root.adsbygoogle=root.adsbygoogle||[]).push({}); }catch(e){} }); };
  document.head.appendChild(s);
}

/* ---------- live gold and silver price (Zakat page) ---------- */
function autoMetals(){
  if(!CAL||!RULES.metals.auto) return;
  var isZ=CAL.id==='zakat'&&$('f_gp');
  var apply=function(m){ METALS=m;
    if(isZ){ var k=(RATES[R.cur]||1)/(RATES.USD||1), g=m.xau/31.1034768*k, s=m.xag/31.1034768*k;
      if(!touched.gp&&g>0) $('f_gp').value=Number(g.toFixed(2)); if(!touched.sp&&s>0) $('f_sp').value=Number(s.toFixed(2));
      var w=$('w_gp'); if(w&&!w.querySelector('.hint')){ var h=document.createElement('p'); h.className='hint'; h.textContent=T('Filled from the live market price. Please edit it if your jeweller or country uses a different rate.'); w.appendChild(h); } }
    update(); };
  var c=null; try { c=JSON.parse(sg('cp_metals')||'null'); } catch(e){}
  if(c&&c.xau>0&&Date.now()-c.t<6*3600e3){ apply(c); return; }
  if(typeof fetch==='undefined') return;
  Promise.all(['XAU','XAG'].map(function(x){ return fetch('https://api.gold-api.com/price/'+x).then(function(r){ return r.json(); }); })).then(function(a){
    var m={t:Date.now(),xau:+a[0].price,xag:+a[1].price}; if(!(m.xau>0)) return; ss('cp_metals',JSON.stringify(m)); apply(m); }).catch(function(){});
}

/* ---------- UI engine ---------- */
var R={cur:'USD'}, CAL=null, touched={}, prevSel={};
function curOf(){ return (CAL&&CAL.fixCur)||R.cur; }
function lbl(f,v){ var t=T(typeof f.l==='function'?f.l(v):f.l); return t.replace('{c}',makeX(curOf()).sym); }
function dflt(f,v){ if(f.dd) return f.dd(v); return typeof f.d==='function'?f.d(R):f.d; }
function optsOf(f,v){ return typeof f.o==='function'?f.o(v):f.o; }

function readVals(){
  var v={}; CAL.f.forEach(function(f){ var e=$('f_'+f.k); if(!e) return;
    if(f.t==='s'||f.t==='d'||f.t==='t') v[f.k]=e.value; else if(f.t==='c') v[f.k]=e.checked; else if(f.t==='b') return;
    else { var x=parseFloat(e.value); v[f.k]=isNaN(x)?(f.opt?0:NaN):x; } });
  return v;
}
function fillSelect(f,v,keep){
  var e=$('f_'+f.k), o=optsOf(f,v), cur=keep?e.value:null, h='';
  o.forEach(function(p){ h+='<option value="'+p[0]+'">'+T(p[1])+'</option>'; }); e.innerHTML=h;
  var want=keep&&o.some(function(p){return p[0]===cur;})?cur:dflt(f,v); e.value=want;
  if(e.value!==String(want)&&o.length) e.value=o[0][0];
}
function build(){
  var box=$('form'), h='', v0={}; CAL.f.forEach(function(f){ if(f.t!=='b'&&typeof f.d!=='function'&&!f.dd) v0[f.k]=f.d; });
  CAL.f.forEach(function(f){
    var id='f_'+f.k, w='w_'+f.k;
    if(f.t==='s') h+='<div class="f" id="'+w+'"><label for="'+id+'"></label><select id="'+id+'"></select></div>';
    else if(f.t==='c') h+='<div class="f" id="'+w+'"><label class="ck"><input type="checkbox" id="'+id+'"><span></span></label></div>';
    else if(f.t==='b') h+='<div class="f" id="'+w+'"><button type="button" class="btn2" id="'+id+'"></button></div>';
    else h+='<div class="f" id="'+w+'"><label for="'+id+'"></label><input id="'+id+'" type="'+(f.t==='d'?'date':f.t==='t'?'time':'number')+'"'+((f.t==='d'||f.t==='t')?'':' inputmode="decimal" step="any"')+'></div>';
  });
  box.innerHTML=h;
  // defaults, two passes so dependent selects (units) see the first values
  var v={}; CAL.f.forEach(function(f){ var e=$('f_'+f.k);
    if(f.t==='s'&&typeof f.o!=='function'){ fillSelect(f,v,false); v[f.k]=e.value; }
    else if(f.t==='c'){ e.checked=!!dflt(f,v); v[f.k]=e.checked; }
    else if(f.t==='b'){ e.textContent=T(f.l); }
    else if(f.t==='s'){ /* dynamic, later */ }
    else { e.value=dflt(f,v); v[f.k]=(f.t==='d'||f.t==='t')?e.value:parseFloat(e.value); } });
  CAL.f.forEach(function(f){ if(f.t==='s'&&typeof f.o==='function'){ fillSelect(f,v,false); v[f.k]=$('f_'+f.k).value; } });
  CAL.f.forEach(function(f){ var e=$('f_'+f.k); if(!e) return;
    if(f.t==='s') prevSel[f.k]=e.value;
    var on=function(){ onChange(f); };
    if(f.t==='b'){ e.addEventListener('click',function(){ f.act(function(k){return $('f_'+k).value;},function(k,val){ $('f_'+k).value=val; prevSel[k]=val; }); update(); }); }
    else { e.addEventListener('input',on); e.addEventListener('change',on); } });
  refreshFields();
}
function onChange(f){
  touched[f.k]=true; var v=readVals();
  if(f.t==='s'){
    var old=prevSel[f.k], nw=$('f_'+f.k).value;
    CAL.f.forEach(function(g){ if(g.cv&&g.cv.sel===f.k){ var e=$('f_'+g.k), x=parseFloat(e.value); if(!isNaN(x)&&old!==nw) e.value=clean(g.cv.fn(x,old,nw)); }
      if(g.t==='s'&&typeof g.o==='function'&&f.k==='cat'){ /* rebuilt below */ } });
    prevSel[f.k]=nw;
    if(f.k==='cat'){ CAL.f.forEach(function(g){ if(g.t==='s'&&typeof g.o==='function'){ var vv=readVals(); fillSelect(g,vv,false); prevSel[g.k]=$('f_'+g.k).value; } }); }
    if(f.fill){ var val=$('f_'+f.k).value; if(val!==''){ $('f_'+f.fill).value=val; touched[f.fill]=true; } }
  }
  if(f.k===CAL.f[0].k&&false){}
  update();
}
function refreshFields(){
  var v=readVals(), X=makeX(curOf());
  CAL.f.forEach(function(f){ var w=$('w_'+f.k); if(!w) return;
    var show=f.sh?!!f.sh(v):true; w.hidden=!show;
    if(f.t==='c'){ w.querySelector('span').textContent=lbl(f,v); }
    else if(f.t!=='b'){ w.querySelector('label').textContent=lbl(f,v)+(f.opt&&false?'':''); } });
  return v;
}
function update(){
  var v=refreshFields(), X=makeX(curOf()), vis=[];
  // required numeric fields (visible only)
  for(var i=0;i<CAL.f.length;i++){ var f=CAL.f[i]; if(f.t==='s'||f.t==='d'||f.t==='t'||f.t==='c'||f.t==='b') continue; if(f.sh&&!f.sh(v)) continue; if(!f.opt&&isNaN(v[f.k])){ vis.push(f); } }
  var out=$('res'); var res;
  if(vis.length) res=NEED; else { try { res=CAL.fn(v,X); } catch(e){ res={err:'Something went wrong. Check your numbers.'}; } }
  if(res&&res.err){ out.innerHTML='<p class="err">'+T(res.err)+'</p>'; $('big').textContent='\u2014'; $('bigl').textContent=''; return; }
  var h='', big=null; res.forEach(function(r){ r=[T(r[0]),T(String(r[1])),r[2]]; if(r[2]&&!big) big=r; else h+='<div class="r"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'; });
  if(big){ $('bigl').textContent=big[0]; $('big').textContent=big[1]; } else { $('bigl').textContent=''; $('big').textContent=''; }
  out.innerHTML=h;
}
function applyRegion(reset){
  setTimeout(function(){ if(CAL&&CAL.id==='zakat'){ if(!touched.gp&&$('f_gp')) $('f_gp').value=0; if(!touched.sp&&$('f_sp')) $('f_sp').value=0; autoMetals(); } },0);
  CAL.f.forEach(function(f){ if(touched[f.k]&&!reset) return; if(f.cv&&touched[f.cv.sel]&&!reset) return; var e=$('f_'+f.k); if(!e||f.t==='b') return; var v=readVals();
    if(f.t==='s'){ if(typeof f.o!=='function'){ e.value=dflt(f,v); prevSel[f.k]=e.value; } }
    else if(f.t==='c'){ e.checked=!!dflt(f,v); } else { var d=dflt(f,v); e.value=d; } });
  update();
}

function initHeader(){
  var slot=$('cur-slot');
  if(slot){ var h='<select id="cp-cur" aria-label="Country or currency">'; Object.keys(CUR).forEach(function(c){ h+='<option value="'+c+'">'+c+' '+symOf(c)+'</option>'; }); slot.innerHTML=h+'</select>';
    var s=$('cp-cur'); s.value=R.cur; s.addEventListener('change',function(){ R.cur=s.value; ss('cp_cur',R.cur); if(CAL){ applyRegion(false); } }); }
  var t=$('cp-theme');
  if(t){ var cur=sg('cp_theme'); if(cur) document.documentElement.setAttribute('data-theme',cur);
    t.addEventListener('click',function(){ var d=document.documentElement, dark=d.getAttribute('data-theme')==='dark'||(!d.getAttribute('data-theme')&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
      var n=dark?'light':'dark'; d.setAttribute('data-theme',n); ss('cp_theme',n); }); }
  if(ADS_ON) document.documentElement.classList.add('ads-on');
  var chips=document.querySelectorAll('.cn'), popBox=$('cp-popular'), popSec=$('popular');
  if(chips.length&&popBox){
    var POP={SAR:['saudi-end-of-service-calculator','gold-rate-calculator','saudi-overtime-pay-calculator','zakat-calculator','hijri-gregorian-date-converter','currency-converter','gst-vat-calculator','loan-calculator','time-zone-converter'],
      AED:['uae-gratuity-calculator','gold-rate-calculator','currency-converter','gst-vat-calculator','loan-calculator','hijri-gregorian-date-converter','hourly-to-salary-calculator','time-zone-converter','calorie-calculator'],
      QAR:['qatar-end-of-service-calculator','gold-rate-calculator','currency-converter','loan-calculator','hijri-gregorian-date-converter','gst-vat-calculator','time-zone-converter','gas-fuel-cost-calculator','bmi-calculator'],
      KWD:['kuwait-end-of-service-calculator','gold-rate-calculator','currency-converter','loan-calculator','hijri-gregorian-date-converter','gst-vat-calculator','time-zone-converter','gas-fuel-cost-calculator','bmi-calculator'],
      OMR:['oman-end-of-service-calculator','gold-rate-calculator','currency-converter','loan-calculator','hijri-gregorian-date-converter','gst-vat-calculator','time-zone-converter','gas-fuel-cost-calculator','bmi-calculator'],
      BHD:['bahrain-end-of-service-calculator','gold-rate-calculator','currency-converter','loan-calculator','hijri-gregorian-date-converter','gst-vat-calculator','time-zone-converter','gas-fuel-cost-calculator','bmi-calculator'],
      INR:['gratuity-calculator','gold-rate-calculator','sip-calculator','fd-rd-calculator','gst-vat-calculator','loan-calculator','currency-converter','cgpa-to-percentage-calculator','bmi-calculator'],
      USD:['mortgage-calculator','loan-calculator','compound-interest-calculator','tip-calculator','bmi-calculator','calorie-calculator','discount-and-sales-tax-calculator','time-zone-converter'],
      GBP:['gst-vat-calculator','loan-calculator','mortgage-calculator','tip-calculator','unit-converter','bmi-calculator','gas-fuel-cost-calculator','currency-converter'],
      EUR:['gst-vat-calculator','currency-converter','unit-converter','gas-fuel-cost-calculator','loan-calculator','bmi-calculator','mortgage-calculator','time-zone-converter'],
      CAD:['mortgage-calculator','loan-calculator','discount-and-sales-tax-calculator','gst-vat-calculator','unit-converter','currency-converter','bmi-calculator','gas-fuel-cost-calculator'],
      AUD:['mortgage-calculator','loan-calculator','discount-and-sales-tax-calculator','gst-vat-calculator','unit-converter','currency-converter','bmi-calculator','gas-fuel-cost-calculator']};
    var tmap={}; [].forEach.call(document.querySelectorAll('.cat-sec .tile'),function(a){ tmap[(a.getAttribute('href')||'').split('/').pop().replace('.html','').replace(/^(ar|hi)-/,'')]=a; });
    var showPop=function(cur){ [].forEach.call(chips,function(c){ c.classList.toggle('on',c.getAttribute('data-cur')===cur); }); popBox.innerHTML='';
      (POP[cur]||POP.USD).forEach(function(f){ var a=tmap[f]; if(a) popBox.appendChild(a.cloneNode(true)); }); popSec.hidden=!popBox.children.length; };
    [].forEach.call(chips,function(c){ c.addEventListener('click',function(){ var cur=c.getAttribute('data-cur'); R.cur=cur; ss('cp_cur',cur); var sel=$('cp-cur'); if(sel) sel.value=cur; showPop(cur); popSec.scrollIntoView({behavior:'smooth',block:'start'}); }); });
    if(sg('cp_cur')) showPop(R.cur); else popSec.hidden=true;
  }
  var es=$('eos-switch'); if(es) es.addEventListener('change',function(){ if(es.value) location.href=es.value; });
  var q=$('cp-search');
  if(q){ var tiles=[].slice.call(document.querySelectorAll('.tile')), secs=[].slice.call(document.querySelectorAll('.cat-sec')), none=$('cp-none');
    q.addEventListener('input',function(){ var s=q.value.trim().toLowerCase(), n=0;
      tiles.forEach(function(a){ var ok=!s||(a.getAttribute('data-k')||'').indexOf(s)>-1; a.hidden=!ok; if(ok) n++; });
      secs.forEach(function(sec){ sec.hidden=!sec.querySelector('.tile:not([hidden])'); }); if(popSec&&s) popSec.hidden=true; if(popSec&&!s&&popBox&&popBox.children.length) popSec.hidden=false; if(none) none.hidden=n>0; }); }
}

function miniBar(){
  var res=document.querySelector('.result'), big=$('big'); if(!res||!big||typeof IntersectionObserver==='undefined') return;
  var bar=document.createElement('div'); bar.className='minibar'; bar.setAttribute('aria-hidden','true'); bar.hidden=true; document.body.appendChild(bar);
  var vis=true, sync=function(){ bar.textContent=($('bigl').textContent?$('bigl').textContent+': ':'')+big.textContent; bar.hidden=vis||big.textContent==='\u2014'; };
  new IntersectionObserver(function(en){ vis=en[0].isIntersecting; sync(); }).observe(res);
  new MutationObserver(sync).observe(big,{childList:true,characterData:true,subtree:true});
}
function boot(){
  R.cur=sg('cp_cur')&&CUR[sg('cp_cur')]?sg('cp_cur'):guessCur();
  initHeader();
  var id=document.body.getAttribute('data-calc'); CAL=id?CALCS[id]:null;
  if(!CAL){ loadRules(initAds); return; }
  build(); update(); miniBar();
  loadRules(afterRules);
  loadRates(function(){ update(); autoMetals(); });
  setInterval(function(){ loadRates(function(){ update(); }); loadRules(afterRules); },1800e3);
}

if(typeof module!=='undefined'&&module.exports){ module.exports={CALCS:CALCS,makeX:makeX,CUR:CUR,FB:FB,fuelDef:fuelDef}; }
else if(typeof document!=='undefined'){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
})(typeof window!=='undefined'?window:this);
