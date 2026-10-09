
var M=function(n){return n.toLocaleString('en-US',{style:'currency',currency:'USD'})};
var N=function(n,d){return n.toLocaleString('en-US',{maximumFractionDigits:d==null?2:d})};
var UT={"Length": [["mm", "Millimeters (mm)", 0.001], ["cm", "Centimeters (cm)", 0.01], ["m", "Meters (m)", 1], ["km", "Kilometers (km)", 1000], ["in", "Inches (in)", 0.0254], ["ft", "Feet (ft)", 0.3048], ["yd", "Yards (yd)", 0.9144], ["mi", "Miles (mi)", 1609.344]], "Weight": [["mg", "Milligrams (mg)", 1e-06], ["g", "Grams (g)", 0.001], ["kg", "Kilograms (kg)", 1], ["t", "Metric tons (t)", 1000], ["oz", "Ounces (oz)", 0.028349523125], ["lb", "Pounds (lb)", 0.45359237], ["st", "Stone (st)", 6.35029318]], "Volume": [["ml", "Milliliters (mL)", 0.001], ["l", "Liters (L)", 1], ["m3", "Cubic meters (m³)", 1000], ["tsp", "Teaspoons (US)", 0.00492892159375], ["tbsp", "Tablespoons (US)", 0.01478676478125], ["floz", "Fluid ounces (US)", 0.0295735295625], ["cup", "Cups (US)", 0.2365882365], ["pt", "Pints (US)", 0.473176473], ["qt", "Quarts (US)", 0.946352946], ["gal", "Gallons (US)", 3.785411784]], "Area": [["mm2", "Square millimeters (mm²)", 1e-06], ["cm2", "Square centimeters (cm²)", 0.0001], ["m2", "Square meters (m²)", 1], ["km2", "Square kilometers (km²)", 1000000.0], ["in2", "Square inches (in²)", 0.00064516], ["ft2", "Square feet (ft²)", 0.09290304], ["yd2", "Square yards (yd²)", 0.83612736], ["ac", "Acres", 4046.8564224], ["ha", "Hectares", 10000], ["mi2", "Square miles (mi²)", 2589988.110336]], "Speed": [["mps", "Meters per second (m/s)", 1], ["kmh", "Kilometers per hour (km/h)", 0.2777777777777778], ["mph", "Miles per hour (mph)", 0.44704], ["kn", "Knots", 0.5144444444444445], ["fps", "Feet per second (ft/s)", 0.3048]], "Time": [["s", "Seconds", 1], ["min", "Minutes", 60], ["h", "Hours", 3600], ["d", "Days", 86400], ["wk", "Weeks", 604800], ["yr", "Years (365 days)", 31536000]], "Temperature": [["c", "Celsius (°C)", null], ["f", "Fahrenheit (°F)", null], ["k", "Kelvin (K)", null]]};
function G(x){var a=Math.abs(x);return a===0?'0':(a>=1e-4&&a<1e12)?N(x,6):x.toExponential(4)}
var C=[
{id:'loan',n:'Loan Payment',i:'🏠',d:'Monthly payment for a mortgage, car or personal loan.',
 f:[['a','Loan amount ($)',300000],['r','Interest rate (% per year)',6.5],['y','Term (years)',30]],
 fn:function(v){var n=v.y*12,i=v.r/1200,m=i?v.a*i/(1-Math.pow(1+i,-n)):v.a/n;return[['Monthly payment',M(m),1],['Total paid',M(m*n)],['Total interest',M(m*n-v.a)]]}},
{id:'compound',n:'Compound Interest',i:'📈',d:'See how savings grow with monthly deposits.',
 f:[['p','Starting amount ($)',5000],['m','Monthly deposit ($)',200],['r','Annual return (%)',7],['y','Years',20]],
 fn:function(v){var b=v.p,k=v.y*12;for(var j=0;j<k;j++)b=b*(1+v.r/1200)+v.m;var put=v.p+v.m*k;return[['Final balance',M(b),1],['You put in',M(put)],['Interest earned',M(b-put)]]}},
{id:'tip',n:'Tip & Split',i:'🍽️',d:'Tip and per-person share of a bill.',
 f:[['b','Bill ($)',85],['t','Tip (%)',18],['p','People',2]],
 fn:function(v){var t=v.b*v.t/100,tot=v.b+t,p=Math.max(1,Math.round(v.p));return[['Each person pays',M(tot/p),1],['Tip',M(t)],['Total',M(tot)]]}},
{id:'percent',n:'Percentage',i:'％',d:'Find a percent of a number, or what percent one number is of another.',
 f:[['a','Number A',15],['b','Number B',2000]],
 fn:function(v){return[['A% of B',N(v.a*v.b/100),1],['A is what % of B',v.b?N(v.a/v.b*100)+'%':'-'],['B plus A%',N(v.b*(1+v.a/100))],['B minus A%',N(v.b*(1-v.a/100))]]}},
{id:'bmi',n:'BMI',i:'⚖️',d:'Body mass index from weight and height (US units).',
 f:[['w','Weight (lb)',160],['h','Height (inches)',67]],
 fn:function(v){var b=v.h?703*v.w/(v.h*v.h):0,c=b<18.5?'Underweight':b<25?'Healthy range':b<30?'Overweight':'Obese';return[['BMI',N(b,1),1],['Category',c]]}},
{id:'age',n:'Age',i:'🎂',d:'Exact age in years, months and days.',
 f:[['d','Date of birth','1995-06-15','date']],
 fn:function(v){var b=new Date(v.d),t=new Date();if(isNaN(b)||b>t)return[['Enter a valid past date','-']];var y=t.getFullYear()-b.getFullYear(),m=t.getMonth()-b.getMonth(),d=t.getDate()-b.getDate();if(d<0){m--;d+=new Date(t.getFullYear(),t.getMonth(),0).getDate()}if(m<0){y--;m+=12}return[['Age',y+' yrs, '+m+' mo, '+d+' days',1],['Total days',N(Math.floor((t-b)/864e5),0)]]}},
{id:'discount',n:'Discount & Tax',i:'🏷️',d:'Final price after a discount and sales tax.',
 f:[['p','Original price ($)',120],['o','Discount (%)',25],['t','Sales tax (%)',8.25]],
 fn:function(v){var s=v.p*(1-v.o/100),x=s*v.t/100;return[['Final price',M(s+x),1],['You save',M(v.p-s)],['Sale price',M(s)],['Tax',M(x)]]}},
{id:'dates',n:'Date Difference',i:'📅',d:'Days between two dates.',
 f:[['a','From','2026-01-01','date'],['b','To','2026-12-25','date'],['c','Count both start and end day',0,'check']],
 fn:function(v){var a=new Date(v.a),b=new Date(v.b);if(isNaN(a)||isNaN(b))return[['Pick both dates','-']];var d=Math.round(Math.abs(b-a)/864e5)+(v.c?1:0);return[['Days',N(d,0),1],['Weeks',N(d/7,1)],['Months (approx)',N(d/30.44,1)]]}},
{id:'hourly',n:'Hourly to Salary',i:'💵',d:'Turn an hourly wage into weekly, monthly and yearly pay.',
 f:[['r','Hourly rate ($)',25],['h','Hours per week',40],['w','Weeks per year',52]],
 fn:function(v){var y=v.r*v.h*v.w;return[['Yearly',M(y),1],['Monthly',M(y/12)],['Weekly',M(v.r*v.h)],['Daily (5 days)',M(v.r*v.h/5)]]}},
{id:'fuel',n:'Fuel Cost',i:'⛽',d:'Estimate the gas cost of a trip.',
 f:[['m','Trip distance (miles)',300],['g','Fuel economy (MPG)',28],['p','Gas price ($/gallon)',3.5]],
 fn:function(v){var g=v.g?v.m/v.g:0;return[['Trip cost',M(g*v.p),1],['Gallons needed',N(g)],['Cost per mile',M(v.m?g*v.p/v.m:0)]]}},
{id:'roi',n:'Investment Return',i:'💹',d:'Total and yearly return on an investment.',
 f:[['i','Amount invested ($)',10000],['f','Current value ($)',15000],['y','Years held',4]],
 fn:function(v){var t=v.i?(v.f-v.i)/v.i*100:0,a=v.i>0&&v.y>0&&v.f>0?(Math.pow(v.f/v.i,1/v.y)-1)*100:0;return[['Total return',N(t)+'%',1],['Profit / loss',M(v.f-v.i)],['Annualized return',N(a)+'%']]}},
{id:'change',n:'Percent Change',i:'🔺',d:'Percentage increase or decrease between two numbers.',
 f:[['a','Old value',80],['b','New value',100]],
 fn:function(v){return[['Change',v.a?N((v.b-v.a)/Math.abs(v.a)*100)+'%':'-',1],['Difference',N(v.b-v.a)]]}},
{id:'due',n:'Due Date',i:'🤰',d:'Estimated due date from the first day of your last period.',
 f:[['d','First day of last period','2026-08-01','date']],
 fn:function(v){var l=new Date(v.d);if(isNaN(l))return[['Pick a valid date','-']];var u=new Date(l.getTime()+280*864e5),w=Math.floor((new Date()-l)/864e5/7);return[['Estimated due date',u.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),1],['Weeks now',w>=0&&w<=42?w+' weeks':'-']]}},
{id:'area',n:'Square Footage',i:'📐',d:'Area of a room or rectangle in feet, inches, yards, meters, centimeters or kilometers.',
 f:[['u','Unit for length, width and height','ft','select',[['ft','Feet'],['in','Inches'],['yd','Yards'],['m','Meters'],['cm','Centimeters'],['mm','Millimeters'],['km','Kilometers'],['mi','Miles']]],['l','Length',12],['w','Width',10],['h','Height (optional, for volume)',0]],
 fn:function(v){var k={ft:0.3048,in:0.0254,yd:0.9144,m:1,cm:0.01,mm:0.001,km:1000,mi:1609.344}[v.u]||0.3048,L=v.l*k,W=v.w*k,H=v.h*k,a=L*W;var r=[['Square feet',N(a/0.09290304),1],['Square inches',N(a/0.00064516)],['Square yards',N(a/0.83612736)],['Square meters',N(a)],['Square centimeters',N(a*1e4)],['Square kilometers',N(a/1e6,6)],['Acres',N(a/4046.8564224,4)],['Perimeter (meters)',N(2*(L+W))]];if(H>0){var vol=a*H;r.push(['Volume (cubic feet)',N(vol/0.028316846592)],['Volume (cubic meters)',N(vol,3)],['Volume (liters)',N(vol*1000,1)])}return r}},
{id:'goal',n:'Savings Goal',i:'🎯',d:'How long it takes to reach a savings target.',
 f:[['t','Goal ($)',20000],['c','Saved so far ($)',2000],['m','Monthly deposit ($)',400],['r','Annual return (%)',4]],
 fn:function(v){var b=v.c,k=0;while(b<v.t&&k<1200){b=b*(1+v.r/1200)+v.m;k++}if(b<v.t)return[['Goal not reachable with these numbers','-']];return[['Time needed',Math.floor(k/12)+' yrs, '+(k%12)+' mo',1],['Total months',N(k,0)]]}},
{id:'units',n:'Unit Converter',i:'🔄',d:'Convert length, weight, volume, area, temperature, speed and time between metric and US units.',
 f:[['u','Convert from','m','select'],['x','Value',1]],
 fn:function(v){var cat=null,u0=null;for(var c in UT){UT[c].forEach(function(u){if(u[0]===v.u){cat=c;u0=u}})}if(!cat)return[['Pick a unit','-']];var x=v.x,rows=[];if(cat==='Temperature'){var T=v.u==='c'?x:v.u==='f'?(x-32)*5/9:x-273.15,o={c:T,f:T*9/5+32,k:T+273.15};UT[cat].forEach(function(u){rows.push([u[1],G(o[u[0]])])})}else{var b=x*u0[2];UT[cat].forEach(function(u){rows.push([u[1],G(b/u[2])])})}return rows}}
];

function upd(){var c=window.cur,v={};c.f.forEach(function(f,k){var el=document.getElementById('f'+k),x=el.value;v[f[0]]=f[3]==='check'?el.checked:f[3]?x:(parseFloat(x)||0)});var h='';c.fn(v).forEach(function(r){h+='<div class="r'+(r[2]?' big':'')+'"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'});document.getElementById('res').innerHTML=h}
(function(){var id=document.body.getAttribute('data-calc');window.cur=C.filter(function(x){return x.id===id})[0];if(window.cur)upd()})();
