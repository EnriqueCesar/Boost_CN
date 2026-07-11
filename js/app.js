"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:2});
const number=new Intl.NumberFormat("es-MX",{maximumFractionDigits:2});
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uniq=a=>[...new Set(a.filter(v=>v!==""&&v!=null))];
const sortText=a=>a.sort((x,y)=>String(x).localeCompare(String(y),"es",{numeric:true,sensitivity:"base"}));
const sum=(a,k)=>a.reduce((t,r)=>t+(Number(r[k])||0),0);
const state={records:[],at:[],exceptions:[],summary:null,currentView:"inicio",filters:{},incidentPage:1,incidentType:"Todos",lastPivot:null};
const slicerDefs=[
 {key:"Region",label:"Región",type:"single"},{key:"DM",label:"DM",type:"multi"},{key:"Supervisor",label:"Supervisor",type:"single"},
 {key:"Tienda",label:"Tienda",type:"multi",display:r=>`${r.Tienda} · ${r.CeCo}`},{key:"CeCo",label:"CeCo",type:"single"},
 {key:"Producto",label:"Producto",type:"single"},{key:"NombreDash",label:"Nombre Dash",type:"single"},{key:"Semana",label:"Semana",type:"multi",latest:true},
 {key:"Dia",label:"Día",type:"date"},{key:"DayPart",label:"DayPart",type:"multi"},{key:"Categoria",label:"Categoría",type:"multi"},{key:"Estado",label:"Estado",type:"multi"}
];
function toast(t){const el=$("#toast");el.textContent=t;el.style.cssText="position:fixed;right:18px;bottom:18px;background:#173e31;color:#fff;padding:10px 14px;border-radius:10px;z-index:100";setTimeout(()=>el.removeAttribute("style"),1800)}
async function load(){
 const man=await fetch("./data/manifest-data.json").then(r=>r.json());
 const chunks=await Promise.all(man.chunks.map(f=>fetch(`./data/${f}`).then(r=>r.json())));
 [state.at,state.exceptions,state.summary]=await Promise.all([fetch("./data/base-at.json").then(r=>r.json()),fetch("./data/exceptions.json").then(r=>r.json()),fetch("./data/audit-summary.json").then(r=>r.json())]);
 state.records=chunks.flat(); init();
}
function init(){
 setupNav(); buildSlicers(); bindActions(); renderAll();
 $("#syncStatus").textContent=`${number.format(state.summary.sheetRowsIncludingHeader)} filas leídas`;
 if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");
 let deferred; window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installBtn").classList.remove("hidden")});
 $("#installBtn").onclick=async()=>{if(deferred){deferred.prompt();deferred=null;$("#installBtn").classList.add("hidden")}};
}
function setupNav(){
 $$(".nav-btn").forEach(b=>b.onclick=()=>{state.currentView=b.dataset.view;$$(".nav-btn").forEach(x=>x.classList.toggle("active",x===b));$$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${state.currentView}`));$("#pageTitle").textContent=state.currentView==="inicio"?"Inicio":"Desempeño por Franja";$("#pageSubtitle").textContent=state.currentView==="inicio"?"Resumen ejecutivo de venta y ticket":"Análisis dinámico por franja";$("#sidebar").classList.remove("open");renderAll()});
 $("#menuToggle").onclick=()=>$("#sidebar").classList.toggle("open");
}
function baseRowsExcluding(key){return state.records.filter(r=>Object.entries(state.filters).every(([k,v])=>k===key||matches(r,k,v)))}
function matches(r,k,v){
 if(!v) return true;
 if(k==="Dia") return (!v.from||r.Dia>=v.from)&&(!v.to||r.Dia<=v.to);
 const vals=Array.isArray(v)?v:[v]; return !vals.length||vals.includes(String(r[k]??""));
}
function availableValues(def){
 const rows=baseRowsExcluding(def.key);
 if(def.key==="Tienda"){
  const map=new Map(); rows.forEach(r=>{if(r.Tienda)map.set(String(r.Tienda),`${r.Tienda} · ${r.CeCo}`)});return [...map].sort((a,b)=>a[1].localeCompare(b[1],"es"));
 }
 const vals=sortText(uniq(rows.map(r=>String(r[def.key]??"")).filter(Boolean)));
 return vals.map(v=>[v,def.key==="Semana"?`Semana ${v}`:v]);
}
function buildSlicers(){const host=$("#slicerHost");host.innerHTML=slicerDefs.map(d=>d.type==="date"?dateSlicerHtml(d):choiceSlicerHtml(d)).join("");bindSlicerEvents();refreshSlicers()}
function choiceSlicerHtml(d){return `<div class="slicer" data-key="${d.key}"><button class="slicer-trigger" type="button"><small>${esc(d.label)}</small><strong>Todos</strong></button><div class="slicer-panel"><input class="slicer-search" type="search" placeholder="Buscar ${esc(d.label.toLowerCase())}"><div class="slicer-actions"><button data-action="all">Seleccionar todo</button>${d.latest?'<button data-action="latest">Última semana</button>':''}<button data-action="clear">Limpiar</button></div><div class="slicer-options"></div></div></div>`}
function dateSlicerHtml(d){return `<div class="slicer date-slicer" data-key="${d.key}"><button class="slicer-trigger" type="button"><small>${esc(d.label)}</small><strong>Todas</strong></button><div class="slicer-panel"><div class="date-panel"><label>Desde<input type="date" data-date="from"></label><label>Hasta<input type="date" data-date="to"></label></div><div class="slicer-actions"><button data-action="clear">Limpiar selección</button></div></div></div>`}
function bindSlicerEvents(){
 $$(".slicer-trigger").forEach(btn=>btn.onclick=e=>{e.stopPropagation();const s=btn.closest(".slicer");$$(".slicer").forEach(x=>x.classList.toggle("open",x===s&&!x.classList.contains("open")))});
 document.addEventListener("click",e=>{if(!e.target.closest(".slicer"))$$(".slicer").forEach(x=>x.classList.remove("open"))});
 $$(".slicer-search").forEach(inp=>inp.oninput=()=>{const q=inp.value.toLowerCase();$$('.slicer-option',inp.closest('.slicer')).forEach(x=>x.hidden=!x.textContent.toLowerCase().includes(q))});
 $$(".slicer-actions button").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const s=b.closest(".slicer"),key=s.dataset.key,def=slicerDefs.find(d=>d.key===key);if(b.dataset.action==="clear"){delete state.filters[key]}else if(b.dataset.action==="all"){state.filters[key]=availableValues(def).map(x=>String(x[0]))}else if(b.dataset.action==="latest"){const vals=availableValues(def).map(x=>Number(x[0])).filter(Number.isFinite);if(vals.length)state.filters[key]=[String(Math.max(...vals))]}refreshSlicers();renderAll()});
 $$("[data-date]").forEach(i=>i.onchange=()=>{const s=i.closest(".slicer"),from=$("[data-date=from]",s).value,to=$("[data-date=to]",s).value;if(from||to)state.filters.Dia={from,to};else delete state.filters.Dia;refreshSlicers();renderAll()});
}
function refreshSlicers(){
 slicerDefs.forEach(def=>{const s=$(`.slicer[data-key="${def.key}"]`);if(!s)return;const trigger=$(".slicer-trigger",s);if(def.type==="date"){
   const dates=sortText(uniq(baseRowsExcluding("Dia").map(r=>r.Dia))); const min=dates[0]||"",max=dates.at(-1)||"";$$('[data-date]',s).forEach(i=>{i.min=min;i.max=max});const v=state.filters.Dia;$("[data-date=from]",s).value=v?.from||"";$("[data-date=to]",s).value=v?.to||"";$("strong",trigger).textContent=v?(v.from&&v.to?`${fmtDate(v.from)} – ${fmtDate(v.to)}`:fmtDate(v.from||v.to)):"Todas";trigger.classList.toggle("has-value",!!v);return;
  }
  const vals=availableValues(def),selected=(state.filters[def.key]||[]).map(String),options=$(".slicer-options",s);options.innerHTML=vals.map(([value,label])=>`<label class="slicer-option"><input type="${def.type==="single"?"radio":"checkbox"}" name="s-${def.key}" value="${esc(value)}" ${selected.includes(String(value))?"checked":""}><span>${esc(label)}</span></label>`).join("")||'<div class="slicer-option">Sin valores disponibles</div>';
  const hasValues=vals.length>0;trigger.disabled=!hasValues;$("strong",trigger).textContent=selected.length?(selected.length===1?(vals.find(x=>String(x[0])===selected[0])?.[1]||selected[0]):`${selected.length} seleccionados`):"Todos";trigger.classList.toggle("has-value",selected.length>0);
  $$('input',options).forEach(inp=>inp.onchange=()=>{if(def.type==="single")state.filters[def.key]=[inp.value];else{const arr=$$('input:checked',options).map(x=>x.value);if(arr.length)state.filters[def.key]=arr;else delete state.filters[def.key]}refreshSlicers();renderAll()});
 }); renderActiveFilters();
}
function fmtDate(v){if(!v)return"";const [y,m,d]=v.split("-");return `${d}/${m}/${String(y).slice(-2)}`}
function renderActiveFilters(){const entries=Object.entries(state.filters).filter(([,v])=>v&&(Array.isArray(v)?v.length:true));$("#activeFilters").innerHTML=entries.map(([k,v])=>`<span class="filter-chip"><strong>${esc(slicerDefs.find(d=>d.key===k)?.label||k)}:</strong> ${esc(k==="Dia"?`${fmtDate(v.from)}${v.to?` – ${fmtDate(v.to)}`:""}`:(v.length>3?`${v.length} seleccionados`:v.join(", ")))}</span>`).join("")}
function filteredRows(){return state.records.filter(r=>Object.entries(state.filters).every(([k,v])=>matches(r,k,v)))}
function ticketRows(rows){
 const dms=new Set(rows.map(r=>r.DM)),weeks=new Set(rows.map(r=>Number(r.Semana))),regions=new Set(rows.map(r=>r.Region));
 return state.at.filter(r=>r.Semana>=28&&(!dms.size||dms.has(r.DM))&&(!weeks.size||weeks.has(Number(r.Semana)))&&(!regions.size||regions.has(r.Region)));
}
function ticketMetrics(rows){const a=ticketRows(rows);if(!a.length)return{real:null,ppto:null,prom:null,diff:null,comp:null,rows:[]};const real=sum(a,"TicketReal")/a.length,ppto=sum(a,"TicketPresupuesto")/a.length;return{real,ppto,prom:real,diff:real-ppto,comp:ppto?real/ppto*100:null,rows:a}}
function best(rows,key,metric="VentaCalculada"){const m=new Map();rows.forEach(r=>m.set(r[key],(m.get(r[key])||0)+(Number(r[metric])||0)));return [...m].sort((a,b)=>b[1]-a[1])[0]||["Sin datos",0]}
function kpis(host,items){host.innerHTML=items.map(i=>`<article class="kpi"><span>${esc(i.label)}</span><strong>${esc(i.value)}</strong>${i.note?`<em>${esc(i.note)}</em>`:""}</article>`).join("")}
function renderAll(){const rows=filteredRows();renderHome(rows);renderBand(rows)}
function renderHome(rows){
 const t=ticketMetrics(rows),bp=best(rows,"DayPart"),bs=best(rows,"Tienda");
 kpis($("#homeKpis"),[
  {label:"Unidades vendidas",value:number.format(sum(rows,"UnidadVendida"))},{label:"Venta calculada",value:money.format(sum(rows,"VentaCalculada"))},
  {label:"Ticket Real",value:t.real==null?"Sin datos":money.format(t.real),note:"Desde semana 28"},{label:"Ticket Presupuesto",value:t.ppto==null?"Sin datos":money.format(t.ppto),note:"Desde semana 28"},
  {label:"Ticket Promedio",value:t.prom==null?"Sin datos":money.format(t.prom)},{label:"Diferencia",value:t.diff==null?"Sin datos":money.format(t.diff)},{label:"Cumplimiento",value:t.comp==null?"Sin datos":`${number.format(t.comp)}%`},
  {label:"Mejor DayPart",value:bp[0],note:money.format(bp[1])},{label:"Tienda con mayor venta",value:bs[0],note:money.format(bs[1])}
 ]);
 const weekly=group(rows,"Semana","VentaCalculada").map(x=>[`Sem ${x[0]}`,x[1]]);drawBars($("#weeklyChart"),weekly,true);
 drawTicketChart($("#ticketChart"),t.rows);
 drawBars($("#productChart"),group(rows,"NombreDash","VentaCalculada").sort((a,b)=>b[1]-a[1]).slice(0,12),true);
 const stores=groupComposite(rows,["Tienda","DM"],"VentaCalculada").sort((a,b)=>b.value-a.value);fillStores($("#topStores"),stores.slice(0,10));fillStores($("#bottomStores"),stores.slice().sort((a,b)=>a.value-b.value).slice(0,10));renderQuality();
}
function renderQuality(){const s=state.summary,c=s.exceptionCounts,q=s.qualityPercent;$("#qualityState").textContent=q>=98?"Verde":q>=95?"Amarillo":"Rojo";$("#qualityState").className=q>=98?"state-good":q>=95?"state-warn":"state-bad";$("#qualitySummary").innerHTML=[
 ["Filas leídas",number.format(s.sheetRowsIncludingHeader)],["Registros procesados",number.format(s.totalRecords)],["Registros válidos",number.format(s.validRecords)],["Registros con advertencia",number.format(s.warningRecords)],["Productos sin relación",number.format(c["Producto sin relación"]||0)],["Calidad de datos",`${number.format(q)}%`]
 ].map(x=>`<div class="quality-item"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("")+`<div class="quality-meter"><i style="width:${Math.max(0,Math.min(100,q))}%"></i></div>`}
function group(rows,key,metric){const m={};rows.forEach(r=>m[r[key]]=(m[r[key]]||0)+(Number(r[metric])||0));return Object.entries(m).sort((a,b)=>String(a[0]).localeCompare(String(b[0]),"es",{numeric:true}))}
function groupComposite(rows,keys,metric){const m=new Map();rows.forEach(r=>{const k=keys.map(x=>r[x]).join("|||");if(!m.has(k))m.set(k,{parts:keys.map(x=>r[x]),value:0});m.get(k).value+=Number(r[metric])||0});return [...m.values()]}
function fillStores(el,rows){el.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.parts[0])}</td><td>${esc(x.parts[1])}</td><td class="num">${money.format(x.value)}</td></tr>`).join("")||'<tr><td colspan="4">Sin datos</td></tr>'}
function drawBars(el,data,currency=false){if(!data.length){el.innerHTML='<div class="no-data">Sin datos para los filtros seleccionados.</div>';return}const W=760,H=Math.max(290,data.length*26+45),left=180,right=90,top=15,max=Math.max(...data.map(x=>x[1]),1),plot=W-left-right;let svg=`<svg viewBox="0 0 ${W} ${H}" role="img">`;data.forEach((d,i)=>{const y=top+i*26,w=d[1]/max*plot;svg+=`<text class="chart-label" x="${left-8}" y="${y+14}" text-anchor="end">${esc(String(d[0]).slice(0,25))}</text><rect class="bar" x="${left}" y="${y}" width="${w}" height="17" rx="4"></rect><text class="chart-value" x="${Math.min(left+w+6,W-80)}" y="${y+13}">${currency?money.format(d[1]):number.format(d[1])}</text>`});el.innerHTML=svg+"</svg>"}
function drawTicketChart(el,rows){if(!rows.length){el.innerHTML='<div class="no-data">Sin Base_AT para la selección.</div>';return}const by=new Map();rows.forEach(r=>{const k=r.Semana;if(!by.has(k))by.set(k,{r:0,p:0,n:0});const x=by.get(k);x.r+=r.TicketReal;x.p+=r.TicketPresupuesto;x.n++});const data=[...by].sort((a,b)=>a[0]-b[0]).map(([w,x])=>[w,x.r/x.n,x.p/x.n]);const W=760,H=300,l=55,r=25,t=20,b=45,max=Math.max(...data.flatMap(x=>x.slice(1)),1),min=Math.min(...data.flatMap(x=>x.slice(1)))*.94,xp=(W-l-r)/Math.max(data.length-1,1),yp=v=>t+(max-v)/(max-min||1)*(H-t-b);let svg=`<svg viewBox="0 0 ${W} ${H}">`;for(let i=0;i<5;i++){const y=t+(H-t-b)*i/4;svg+=`<line class="gridline" x1="${l}" x2="${W-r}" y1="${y}" y2="${y}"/>`}const pts=(idx)=>data.map((d,i)=>`${l+i*xp},${yp(d[idx])}`).join(" ");svg+=`<polyline points="${pts(1)}" fill="none" stroke="#006241" stroke-width="3"/><polyline points="${pts(2)}" fill="none" stroke="#8dbdad" stroke-width="3"/>`;data.forEach((d,i)=>{svg+=`<circle cx="${l+i*xp}" cy="${yp(d[1])}" r="4" fill="#006241"><title>Semana ${d[0]} · Real ${money.format(d[1])}</title></circle><circle cx="${l+i*xp}" cy="${yp(d[2])}" r="4" fill="#8dbdad"><title>Semana ${d[0]} · Presupuesto ${money.format(d[2])}</title></circle><text class="chart-label" x="${l+i*xp}" y="${H-16}" text-anchor="middle">Sem ${d[0]}</text>`});el.innerHTML=svg+`</svg><div class="legend"><span><i style="background:#006241"></i>Ticket Real</span><span><i style="background:#8dbdad"></i>Ticket Presupuesto</span></div>`}
function renderBand(rows){const t=ticketMetrics(rows),bp=best(rows,"DayPart"),bs=best(rows,"Tienda");kpis($("#bandKpis"),[{label:"Unidades vendidas",value:number.format(sum(rows,"UnidadVendida"))},{label:"Venta calculada",value:money.format(sum(rows,"VentaCalculada"))},{label:"Ticket Promedio",value:t.prom==null?"Sin datos":money.format(t.prom)},{label:"Mejor DayPart",value:bp[0],note:money.format(bp[1])},{label:"Tienda con mayor venta",value:bs[0],note:money.format(bs[1])}]);drawGrouped(rows);drawPivot(rows)}
function metricValue(rows,metric){if(metric!=="TicketPromedio")return sum(rows,metric);const t=ticketMetrics(rows);return t.prom||0}
function drawGrouped(rows){const metric=$("#metricSelect").value,parts=sortText(uniq(rows.map(r=>r.DayPart))),prods=sortText(uniq(rows.map(r=>r.NombreDash)));if(!rows.length){$("#bandChart").innerHTML='<div class="no-data">Sin datos.</div>';return}const W=920,H=390,left=60,bottom=75,top=25,right=20,plotW=W-left-right,plotH=H-top-bottom;const vals={};parts.forEach(p=>prods.forEach(pr=>{const subset=rows.filter(r=>r.DayPart===p&&r.NombreDash===pr);vals[`${p}|||${pr}`]=metricValue(subset,metric)}));const max=Math.max(...Object.values(vals),1),groupW=plotW/parts.length,barW=Math.max(4,Math.min(22,(groupW-12)/Math.max(prods.length,1)));let svg=`<svg viewBox="0 0 ${W} ${H}">`;for(let g=0;g<=4;g++){const y=top+plotH-g*plotH/4;svg+=`<line class="gridline" x1="${left}" x2="${W-right}" y1="${y}" y2="${y}"/><text class="chart-label" x="${left-7}" y="${y+4}" text-anchor="end">${number.format(max*g/4)}</text>`}parts.forEach((p,pi)=>{prods.forEach((pr,si)=>{const v=vals[`${p}|||${pr}`]||0,h=v/max*plotH,x=left+pi*groupW+6+si*barW,y=top+plotH-h;svg+=`<rect class="bar" opacity="${.42+.5*((si%5)/5)}" x="${x}" y="${y}" width="${Math.max(2,barW-2)}" height="${h}" rx="3"><title>${esc(pr)}: ${metric==="VentaCalculada"||metric==="TicketPromedio"?money.format(v):number.format(v)}</title></rect>`});svg+=`<text class="chart-label" x="${left+pi*groupW+groupW/2}" y="${H-bottom+25}" text-anchor="middle">${esc(p)}</text>`});$("#bandChart").innerHTML=svg+"</svg>"}
function drawPivot(rows){const parts=sortText(uniq(rows.map(r=>r.DayPart))),groups=new Map();rows.forEach(r=>{const k=[r.DM,r.Tienda,r.CeCo].join("|||");if(!groups.has(k))groups.set(k,{DM:r.DM,Tienda:r.Tienda,CeCo:r.CeCo,cells:{},rows:[]});const g=groups.get(k);(g.cells[r.DayPart]??=[]).push(r);g.rows.push(r)});let h='<thead><tr><th rowspan="2">DM</th><th rowspan="2">Tienda</th><th rowspan="2">CeCo</th>'+parts.map(p=>`<th colspan="3">${esc(p)}</th>`).join("")+'<th colspan="3">Total general</th></tr><tr>'+parts.map(()=>'<th class="num">Unid.</th><th class="num">Venta</th><th class="num">Ticket</th>').join("")+'<th class="num">Unid.</th><th class="num">Venta</th><th class="num">Ticket</th></tr></thead><tbody>';h+=[...groups.values()].map(g=>`<tr><td>${esc(g.DM)}</td><td>${esc(g.Tienda)}</td><td>${esc(g.CeCo)}</td>${parts.map(p=>{const a=g.cells[p]||[],t=ticketMetrics(a).prom;return `<td class="num">${number.format(sum(a,"UnidadVendida"))}</td><td class="num">${money.format(sum(a,"VentaCalculada"))}</td><td class="num">${t==null?"—":money.format(t)}</td>`}).join("")}<td class="num"><strong>${number.format(sum(g.rows,"UnidadVendida"))}</strong></td><td class="num"><strong>${money.format(sum(g.rows,"VentaCalculada"))}</strong></td><td class="num"><strong>${ticketMetrics(g.rows).prom==null?"—":money.format(ticketMetrics(g.rows).prom)}</strong></td></tr>`).join("")||'<tr><td>Sin datos</td></tr>';$("#pivotTable").innerHTML=h+"</tbody>";state.lastPivot={parts,rows:[...groups.values()]}}
function bindActions(){
 $("#clearAll").onclick=()=>{state.filters={};refreshSlicers();renderAll()};
 $("#metricSelect").onchange=()=>renderBand(filteredRows());
 $("#exportPdf").onclick=()=>{const active=$("#view-"+state.currentView),now=new Date();$$(".view").forEach(v=>v.classList.remove("print-target"));active.classList.add("print-target");$("#printMeta").innerHTML=`<h1>BOOST CN · ${state.currentView==="inicio"?"Inicio":"Desempeño por Franja"}</h1><p>Generado: ${now.toLocaleString("es-MX")} · Filtros: ${Object.keys(state.filters).length?"selección activa":"sin filtros"}</p>`;document.title=`BOOST CN ${state.currentView} ${now.toLocaleDateString("es-MX")}`;window.print()};
 $("#openIncidents").onclick=()=>{state.incidentPage=1;buildIncidentFilter();renderIncidents();$("#incidentDialog").showModal()};$("#closeIncidents").onclick=()=>$("#incidentDialog").close();
 $("#exportErrors").onclick=()=>csv(incidentRows(),["Tipo de error","Fila","DM","Semana","Dia","DayPart","CeCo","Tienda","Producto","Unidad Vendida","Nombre Dash","Precio Venta","Descripción"],"BOOST_CN_incidencias.csv");
 $("#exportPivot").onclick=()=>{const p=state.lastPivot||{parts:[],rows:[]},headers=["DM","Tienda","CeCo",...p.parts.flatMap(x=>[`${x} Unidades`,`${x} Venta`,`${x} Ticket Promedio`]),"Total Unidades","Total Venta","Ticket Promedio"];const rows=p.rows.map(g=>{const o={DM:g.DM,Tienda:g.Tienda,CeCo:g.CeCo};p.parts.forEach(x=>{const a=g.cells[x]||[];o[`${x} Unidades`]=sum(a,"UnidadVendida");o[`${x} Venta`]=sum(a,"VentaCalculada");o[`${x} Ticket Promedio`]=ticketMetrics(a).prom??""});o["Total Unidades"]=sum(g.rows,"UnidadVendida");o["Total Venta"]=sum(g.rows,"VentaCalculada");o["Ticket Promedio"]=ticketMetrics(g.rows).prom??"";return o});csv(rows,headers,"BOOST_CN_tabla_cruzada.csv")};
}
function buildIncidentFilter(){const vals=sortText(uniq(state.exceptions.map(x=>x["Tipo de error"])));$("#incidentType").innerHTML='<option>Todos</option>'+vals.map(x=>`<option>${esc(x)}</option>`).join("");$("#incidentType").value=state.incidentType;$("#incidentType").onchange=()=>{state.incidentType=$("#incidentType").value;state.incidentPage=1;renderIncidents()}}
function incidentRows(){return state.exceptions.filter(x=>state.incidentType==="Todos"||x["Tipo de error"]===state.incidentType)}
function renderIncidents(){const all=incidentRows(),size=100,pages=Math.max(1,Math.ceil(all.length/size));state.incidentPage=Math.min(state.incidentPage,pages);const rows=all.slice((state.incidentPage-1)*size,state.incidentPage*size);$("#incidentRows").innerHTML=rows.map(e=>`<tr><td>${esc(e["Tipo de error"])}</td><td>${esc(e.Fila)}</td><td>${esc(e.DM)}</td><td>${esc(e.Semana)}</td><td>${esc(e.Dia)}</td><td>${esc(e.DayPart)}</td><td>${esc(e.CeCo)}</td><td>${esc(e.Tienda)}</td><td>${esc(e.Producto)}</td><td>${esc(e["Descripción"])}</td></tr>`).join("")||'<tr><td colspan="10">Sin incidencias</td></tr>';$("#incidentPager").innerHTML=`<button id="prevInc" ${state.incidentPage===1?"disabled":""}>Anterior</button><span>Página ${state.incidentPage} de ${pages} · ${number.format(all.length)} incidencias</span><button id="nextInc" ${state.incidentPage===pages?"disabled":""}>Siguiente</button>`;$("#prevInc").onclick=()=>{state.incidentPage--;renderIncidents()};$("#nextInc").onclick=()=>{state.incidentPage++;renderIncidents()}}
function csv(rows,headers,name){const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;const text='\ufeff'+[headers.map(q).join(","),...rows.map(r=>headers.map(h=>q(r[h])).join(","))].join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
load().catch(e=>{console.error(e);$("#syncStatus").textContent="Error de carga";toast("No fue posible cargar los datos")});
