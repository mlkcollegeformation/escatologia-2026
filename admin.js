(()=>{"use strict";const cfg=window.EVENT_CONFIG;const login=document.getElementById("login-section"),dashboard=document.getElementById("dashboard"),loginForm=document.getElementById("login-form"),loginMsg=document.getElementById("login-message"),dashboardMsg=document.getElementById("dashboard-message");let db=null,records=[];const fmt=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});const niceDate=v=>new Date(v).toLocaleString("pt-BR");const setMsg=(s)=>dashboardMsg.textContent=s;const clean=s=>String(s??"");if(cfg?.supabaseUrl&&cfg?.supabaseAnonKey&&window.supabase){db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey)}else{loginMsg.textContent="Painel ainda não configurado. Conecte o Supabase no arquivo config.js.";loginForm.querySelector("button").disabled=true;return}function authorizedRows(rows){records=rows??[];const total=records.length,confirmed=records.filter(r=>r.payment_status==="confirmed").length;document.getElementById("total").textContent=total;document.getElementById("confirmed").textContent=confirmed;document.getElementById("pending").textContent=total-confirmed;document.getElementById("revenue").textContent=fmt.format(records.filter(r=>r.payment_status==="confirmed").reduce((total,r)=>total+(r.amount_cents??10000),0)/100);render()}
const proofBucket="escatologia-comprovantes";
const portariaMimes={"application/pdf":"pdf","image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
function whatsappNumber(value){const digits=clean(value).replace(/\D/g,"");if(digits.length===11||digits.length===10)return "55"+digits;if(digits.startsWith("55")&&digits.length>=12&&digits.length<=13)return digits;return null}
function organizationWhatsApp(){return whatsappNumber(cfg.portariaReceiptWhatsapp||cfg.whatsapps?.[0]||"5511991766716")}
async function sendPortariaWhatsapp(r){
 if(!r.entrance_receipt_path){setMsg("Anexe primeiro o comprovante da portaria.");return;}
 const phone=organizationWhatsApp();
 if(!phone){setMsg("O WhatsApp fixo da organização não está configurado corretamente.");return;}
 if(!confirm("Encaminhar o comprovante da inscrição "+r.registration_code+" para o WhatsApp fixo da organização: +"+phone+"?"))return;
 const opened=window.open("about:blank","_blank");
 const {data,error}=await db.storage.from(proofBucket).createSignedUrl(r.entrance_receipt_path,604800);
 if(error||!data?.signedUrl){if(opened)opened.close();setMsg("Não foi possível gerar o link temporário do comprovante.");return;}
 const message="COMPROVANTE DE PAGAMENTO NA PORTARIA — XIV Seminário de Escatologia e Batalha Espiritual 2026\nInscrição nº: "+r.registration_code+"\nParticipante: "+r.full_name+"\nWhatsApp do inscrito: "+r.phone+"\nComprovante (link válido por 7 dias): "+data.signedUrl;
 const link="https://wa.me/"+phone+"?text="+encodeURIComponent(message);
 if(opened){opened.location.replace(link);}else{window.location.href=link;}
 setMsg("WhatsApp da organização aberto para a inscrição "+r.registration_code+". Confira o destinatário e toque em ENVIAR na conversa.");
}
async function uploadPortariaReceipt(r,input,button){
 const file=input.files?.[0],extension=file&&portariaMimes[file.type];
 if(!file||!extension||file.size<1||file.size>5*1024*1024){setMsg("Selecione PDF, JPG, PNG ou WEBP de até 5 MB.");return;}
 if(!confirm("Anexar este comprovante à inscrição "+r.registration_code+" de "+r.full_name+"?"))return;
 button.disabled=true;button.textContent="ANEXANDO...";
 const path="portaria/"+r.id+"/"+crypto.randomUUID()+"."+extension;
 try{
  const uploaded=await db.storage.from(proofBucket).upload(path,file,{upsert:false,contentType:file.type});
  if(uploaded.error){setMsg("Não foi possível anexar o arquivo. Confira as permissões do Supabase.");return;}
  const {error}=await db.from("event_registrations").update({entrance_receipt_path:path}).eq("id",r.id).eq("event_slug",cfg.eventSlug).eq("payment_method","entrance");
  if(error){setMsg("Arquivo enviado, mas não foi possível vinculá-lo à inscrição. Verifique a permissão de administrador.");return;}
  setMsg("Comprovante da portaria anexado à inscrição "+r.registration_code+". Agora clique em ENVIAR NO WHATSAPP.");
  await load();
 }finally{button.disabled=false;button.textContent="ANEXAR COMPROVANTE";}
}
function portariaControls(cell,r){
 const wrap=document.createElement("div");wrap.className="portaria-actions";
 const destination=document.createElement("small");destination.className="portaria-destination";destination.textContent="Organização (fixo): "+(organizationWhatsApp()?"+"+organizationWhatsApp():"Não configurado");wrap.append(destination);
 const file=document.createElement("input");file.type="file";file.accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
 file.setAttribute("aria-label","Arquivo de comprovante da portaria da inscrição "+r.registration_code);
 const upload=document.createElement("button");upload.type="button";upload.textContent=r.entrance_receipt_path?"SUBSTITUIR COMPROVANTE":"ANEXAR COMPROVANTE";
 upload.onclick=()=>uploadPortariaReceipt(r,file,upload);
 wrap.append(file,upload);
 if(r.entrance_receipt_path){
  const view=document.createElement("button");view.type="button";view.textContent="VISUALIZAR";
  view.onclick=async()=>{const {data,error}=await db.storage.from(proofBucket).createSignedUrl(r.entrance_receipt_path,120);if(error||!data?.signedUrl){setMsg("Não foi possível abrir o comprovante.");return;}window.open(data.signedUrl,"_blank","noopener,noreferrer")};
  const send=document.createElement("button");send.type="button";send.className="portaria-whatsapp";send.textContent="ENVIAR AO WHATSAPP DA ORGANIZAÇÃO";send.onclick=()=>sendPortariaWhatsapp(r);
  wrap.append(view,send);
 }
 cell.append(wrap);
}

const responsibleNames=["Pr. Adriano Rufino","Deivisson Gomes","Ev Rodrigo Gomes","Fernando Guilherme","Glauber","Manoel Borges","Matheus Oliveira","PB. Wellington Menezes","Pr Ivo Becca","Pr. Arnaldo","Pr. Wanderson"];
let activeResponsible="all";
const normalizeResponsible=value=>clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g," ").trim().toLowerCase();
function responsibleKey(value){
 const normalized=normalizeResponsible(value);
 if(normalized==="pb wellington menezes"||normalized==="pb wellington menezes")return normalizeResponsible("PB. Wellington Menezes");
 return normalized;
}
function renderResponsibleTabs(){
 const container=document.getElementById("responsible-tabs");if(!container)return;
 container.replaceChildren();
 const sheetRecords=records.filter(r=>r.registration_source==="sheet");
 const all=[{key:"all",name:"TODAS AS INSCRIÇÕES",count:records.length},...responsibleNames.map(name=>({key:responsibleKey(name),name,count:sheetRecords.filter(r=>responsibleKey(r.sheet_responsible)===responsibleKey(name)).length}))];
 for(const entry of all){
  const button=document.createElement("button");button.type="button";button.className="responsible-tab"+(activeResponsible===entry.key?" selected":"");
  button.setAttribute("aria-pressed",String(activeResponsible===entry.key));
  const label=document.createElement("span");label.textContent=entry.name;
  const total=document.createElement("strong");total.textContent=entry.count;total.className="responsible-tab-count";
  button.append(label,total);
  button.onclick=()=>{activeResponsible=entry.key;render()};
  container.append(button);
 }
 const selected=all.find(x=>x.key===activeResponsible);
 const caption=document.getElementById("responsible-count");
 if(caption)caption.textContent=activeResponsible==="all"?"Total de inscrições no evento: "+records.length:(selected?.name??"Responsável")+" — "+(selected?.count??0)+" inscrição(ões) por ficha";
}
function render(){renderResponsibleTabs();const query=document.getElementById("search").value.trim().toLowerCase(),filter=document.getElementById("filter").value;const visible=records.filter(r=>(activeResponsible==="all"||(r.registration_source==="sheet"&&responsibleKey(r.sheet_responsible)===activeResponsible))&&((filter==="all")||(r.payment_status===filter))&&[r.full_name,r.phone,r.registration_code,r.email,r.sheet_responsible].some(s=>clean(s).toLowerCase().includes(query)));const tbody=document.getElementById("registrations");tbody.replaceChildren();if(!visible.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=9;td.textContent="Nenhuma inscrição encontrada.";tr.append(td);tbody.append(tr);return}for(const r of visible){const tr=document.createElement("tr");const cell=(t)=>{const td=document.createElement("td");td.textContent=clean(t);tr.append(td);return td};cell(r.registration_code);cell(r.full_name+(r.registration_type==="couple"?" · CASAL":""));const contact=cell(r.phone),small=document.createElement("small");small.textContent=r.email;contact.append(small);cell(niceDate(r.created_at));cell(r.registration_source==="sheet"?"Ficha — "+(r.sheet_responsible||"Sem responsável"):r.registration_type==="couple"?"Promoção casal · R$ 160,00 (2 pessoas)":"Inscrição online");cell(r.payment_method==="entrance"?"Pagar na entrada":"PIX antecipado");const proofCell=cell("");if(r.receipt_path){const proofButton=document.createElement("button");proofButton.type="button";proofButton.textContent="VER COMPROVANTE";proofButton.onclick=async()=>{const {data,error}=await db.storage.from("escatologia-comprovantes").createSignedUrl(r.receipt_path,120);if(error||!data?.signedUrl){setMsg("Não foi possível abrir o comprovante.");return}window.open(data.signedUrl,"_blank","noopener,noreferrer")};proofCell.append(proofButton)}else if(r.payment_method!=="entrance"){proofCell.textContent="Não enviado"}if(r.payment_method==="entrance")portariaControls(proofCell,r);const status=cell("");const label=document.createElement("span");label.className="status "+r.payment_status;label.textContent=r.payment_status==="confirmed"?"Confirmado":"Pendente";status.append(label);const actions=cell("");const btn=document.createElement("button");btn.className=r.payment_status==="confirmed"?"undo":"";btn.textContent=r.payment_status==="confirmed"?"REVERTER":(r.payment_method==="entrance"?"CONFIRMAR RECEBIMENTO":"CONFIRMAR PIX");btn.onclick=async()=>{const next=r.payment_status==="confirmed"?"pending":"confirmed";if(!confirm(next==="confirmed"?(r.payment_method==="entrance"?(r.registration_type==="couple"?"Confirma o recebimento de R$ 160,00 pelo casal na entrada do evento (duas inscrições)?":"O valor de R$ 100,00 foi recebido na entrada do evento?"):(r.registration_type==="couple"?"Você verificou o PIX de R$ 160,00 referente ao casal e deseja confirmar ambas as inscrições?":"Você verificou o crédito no Bradesco e deseja confirmar este pagamento?")):"Deseja reverter a confirmação de pagamento?"))return;btn.disabled=true;const {data:{user}}=await db.auth.getUser();const groupIds=r.registration_type==="couple"&&r.couple_id?records.filter(entry=>entry.couple_id===r.couple_id).map(entry=>entry.id):[r.id];
 const {error}=await db.from("event_registrations").update({payment_status:next,confirmed_at:next==="confirmed"?new Date().toISOString():null,confirmed_by:next==="confirmed"?user.id:null}).in("id",groupIds).eq("event_slug",cfg.eventSlug);if(error){setMsg("Não foi possível atualizar. Verifique permissões de administrador.");btn.disabled=false;return}setMsg("Inscrição atualizada.");await load()};actions.append(btn);tbody.append(tr)}}async function load(){setMsg("Carregando inscrições...");const {data,error}=await db.from("event_registrations").select("id,created_at,full_name,phone,email,registration_code,payment_status,receipt_path,entrance_receipt_path,payment_method,registration_source,sheet_responsible,registration_type,couple_id,amount_cents").eq("event_slug",cfg.eventSlug).order("created_at",{ascending:false}).limit(5000);if(error){setMsg("Acesso negado ou erro ao carregar inscrições. Confirme a autorização do usuário no Supabase.");return}authorizedRows(data);setMsg(records.length>=5000?"Exibindo até 5.000 registros; exporte periodicamente.":"Dados atualizados.")}async function sessionCheck(){const {data:{session}}=await db.auth.getSession();if(!session){login.classList.remove("hidden");dashboard.classList.add("hidden");return}const {data,isError,error}=await db.from("event_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();if(error||!data){await db.auth.signOut();login.classList.remove("hidden");dashboard.classList.add("hidden");loginMsg.textContent="Sua conta não está autorizada para acessar este painel.";return}login.classList.add("hidden");dashboard.classList.remove("hidden");await load()}loginForm.addEventListener("submit",async e=>{e.preventDefault();loginMsg.textContent="Validando acesso...";const f=new FormData(loginForm);const {error}=await db.auth.signInWithPassword({email:String(f.get("email")),password:String(f.get("password"))});if(error){loginMsg.textContent="Credenciais inválidas ou conta sem acesso.";return}loginMsg.textContent="";await sessionCheck()});document.getElementById("logout").onclick=async()=>{await db.auth.signOut();records=[];dashboard.classList.add("hidden");login.classList.remove("hidden")};document.getElementById("reload").onclick=load;document.getElementById("search").oninput=render;document.getElementById("filter").onchange=()=>{updateMetricSelection();render()};
function updateMetricSelection(){
 const status=document.getElementById("filter").value;
 document.querySelectorAll(".metric-filter").forEach(button=>{
  const selected=button.dataset.status===status;
  button.classList.toggle("active",selected);
  button.setAttribute("aria-pressed",String(selected));
 });
}
document.querySelectorAll(".metric-filter").forEach(button=>button.addEventListener("click",()=>{
 document.getElementById("filter").value=button.dataset.status;
 document.getElementById("search").value="";
 activeResponsible="all";
 updateMetricSelection();
 render();
 document.querySelector(".table-scroll")?.scrollIntoView({behavior:"smooth",block:"start"});
}));
async function fetchAllForPdf(){
 const all=[],step=500;
 for(let from=0;from<50000;from+=step){
  const {data,error}=await db.from("event_registrations")
   .select("registration_code,full_name,phone,email,created_at,registration_source,sheet_responsible,registration_type,couple_id,payment_method,payment_status,receipt_path,entrance_receipt_path,amount_cents")
   .eq("event_slug",cfg.eventSlug).order("registration_code",{ascending:true}).range(from,from+step-1);
  if(error)throw new Error("Não foi possível consultar a listagem completa. "+error.message);
  all.push(...(data||[]));
  if(!data||data.length<step)return all;
 }
 throw new Error("Limite de 50.000 inscrições alcançado. Procure a administração do sistema.");
}


function reportData(all){
 const sorted=[...all].sort((a,b)=>String(a.registration_code).localeCompare(String(b.registration_code),"pt-BR",{numeric:true}));
 const confirmed=sorted.filter(r=>r.payment_status==="confirmed");
 const pending=sorted.filter(r=>r.payment_status!=="confirmed");
 const totalCents=rows=>rows.reduce((sum,r)=>sum+(Number(r.amount_cents) || 10000),0);
 return {all:sorted,confirmed,pending,total:totalCents(sorted),paid:totalCents(confirmed),due:totalCents(pending)};
}
function reportMode(r){
 return r.registration_type==="couple"?"Casal · R$ 80/pessoa":r.registration_source==="sheet"?"Ficha · "+(r.sheet_responsible||"Sem responsável"):"Individual · Online";
}
function reportProof(r){
 if(r.payment_method==="pix")return r.receipt_path?"PIX anexado":"PIX não anexado";
 return r.entrance_receipt_path?"Comprovante portaria":"Pagamento na entrada";
}
function reportSectionData(data){
 return [
  {id:"all",index:"01",title:"LISTA GERAL DE INSCRITOS",description:"Todos os participantes registrados, independentemente da situação de pagamento.",rows:data.all,amount:data.total,amountLabel:"TOTAL EM INSCRIÇÕES",color:[191,154,89]},
  {id:"confirmed",index:"02",title:"INSCRIÇÕES CONFIRMADAS",description:"Participantes com pagamento marcado como confirmado pela administração.",rows:data.confirmed,amount:data.paid,amountLabel:"VALOR CONFIRMADO",color:[47,143,109]},
  {id:"pending",index:"03",title:"INSCRIÇÕES PENDENTES",description:"Participantes aguardando confirmação de pagamento, incluindo pagamento na entrada.",rows:data.pending,amount:data.due,amountLabel:"VALOR PENDENTE",color:[177,119,48]}
 ];
}

function printableHtml(all){
 const data=reportData(all), sections=reportSectionData(data);
 const money=cents=>fmt.format(cents/100);
 const safe=v=>clean(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const date=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
 const most=Math.max(1,...sections.map(s=>s.rows.length));
 const rowFont=Math.max(4,Math.min(9,Math.floor(90/most)));
 const rows=s=>s.rows.length?s.rows.map(r=>'<tr><td>'+safe(r.registration_code)+'</td><td>'+safe(r.full_name)+'</td><td>'+safe(r.phone)+'</td><td>'+safe(money(Number(r.amount_cents)??10000))+'</td></tr>').join(""):'<tr><td colspan="4">Nenhum participante</td></tr>';
 const blocks=sections.map(s=>'<section><div class="section-title"><b>'+safe(s.title.replace("LISTA GERAL DE INSCRITOS","TOTAL DE INSCRITOS").replace("INSCRIÇÕES CONFIRMADAS","CONFIRMADOS").replace("INSCRIÇÕES PENDENTES","PENDENTES"))+'</b><span>'+s.rows.length+' pessoas</span></div><p>'+safe(s.amountLabel)+': <strong>'+safe(money(s.amount))+'</strong></p><table><thead><tr><th>Nº</th><th>NOME</th><th>WHATSAPP</th><th>VALOR</th></tr></thead><tbody>'+rows(s)+'</tbody></table></section>').join("");
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inscrições Escatologia 2026 — A4</title><style>'+
 '@page{size:A4 landscape;margin:5mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#162338;font-family:Arial,sans-serif}body{padding:5mm}.toolbar{padding:12px;background:#eff2f6;margin-bottom:10px}button{background:#162338;color:#fff;border:0;padding:10px;font-weight:bold}.header{background:#14233b;color:white;padding:12px 15px;border-top:4px solid #c9a265}.eyebrow{color:#e3bf84;font-size:9px;letter-spacing:1.3px;font-weight:bold}.header h1{font-size:17px;margin:7px 0 2px}.header p{font-size:9px;color:#dde3ef;margin:3px 0}.stats{display:flex;gap:7px;margin:7px 0 12px}.stat{border:1px solid #d6dce6;border-left:3px solid #be9658;padding:5px 8px;flex:1}.stat span{display:block;font-size:8px;color:#566779}.stat b{display:block;font-size:13px}.lists{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;align-items:start}section{min-width:0;border:1px solid #d6dce6}.section-title{background:#182b47;color:white;padding:8px;font-size:10px;display:flex;justify-content:space-between;gap:5px}.section-title span{white-space:nowrap}section p{background:#f1e9dd;margin:0;padding:6px 8px;font-size:9px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:'+rowFont+'px}th{background:#ecf0f5;color:#37455a;font-size:'+Math.max(4,rowFont-1)+'px;text-align:left}td,th{border-bottom:1px solid #e3e7ed;padding:3px 2px;overflow-wrap:anywhere;vertical-align:top}th:nth-child(1){width:8%}th:nth-child(2){width:48%}th:nth-child(3){width:27%}th:nth-child(4){width:17%}.footer{font-size:8px;color:#657487;margin-top:7px}@media print{body{padding:0}.toolbar{display:none}.header,.section-title,.stat{print-color-adjust:exact;-webkit-print-color-adjust:exact}thead{display:table-header-group}section{break-inside:avoid}} </style></head><body>'+
 '<div class="toolbar"><button onclick="window.print()">SALVAR EM PDF / IMPRIMIR</button> · Formato A4 horizontal, uma página. Se necessário, ajuste a escala de impressão para caber em uma folha.</div>'+
 '<header class="header"><div class="eyebrow">MLK COLLEGE FORMATION · RELATÓRIO ADMINISTRATIVO</div><h1>XIV SEMINÁRIO DE ESCATOLOGIA E BATALHA ESPIRITUAL 2026</h1><p>O PALCO ESTÁ PRONTO · Gerado em '+safe(date)+' · Evento: 04 a 06 de dezembro de 2026</p></header>'+
 '<div class="stats">'+[["TOTAL DE INSCRITOS",data.all.length],["CONFIRMADOS",data.confirmed.length],["PENDENTES",data.pending.length],["ARRECADADO",money(data.paid)],["A RECEBER",money(data.due)],["TOTAL PREVISTO",money(data.total)]].map(([label,val])=>'<div class="stat"><span>'+safe(label)+'</span><b>'+safe(val)+'</b></div>').join("")+'</div>'+
 '<main class="lists">'+blocks+'</main><div class="footer">Documento confidencial · cada pessoa aparece na lista total e em apenas uma lista de situação financeira.</div></body></html>';
}
function makePremiumPdf(all){
 const data=reportData(all),sections=reportSectionData(data),money=cents=>fmt.format(cents/100);
 const pdf=new window.jspdf.jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
 const W=297,H=210,ink=[20,35,59],gold=[198,156,90];
 const fill=(c)=>pdf.setFillColor(...c),color=(c)=>pdf.setTextColor(...c);
 const now=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
 fill(ink);pdf.rect(0,0,W,38,"F");fill(gold);pdf.rect(0,0,W,3,"F");
 color([226,191,132]);pdf.setFont("helvetica","bold");pdf.setFontSize(8);
 pdf.text("MLK COLLEGE FORMATION  |  RELATÓRIO ADMINISTRATIVO",8,12);
 color([255,255,255]);pdf.setFontSize(15);
 pdf.text("XIV SEMINÁRIO DE ESCATOLOGIA E BATALHA ESPIRITUAL 2026",8,21);
 color([216,223,235]);pdf.setFont("helvetica","normal");pdf.setFontSize(8);
 pdf.text("O PALCO ESTÁ PRONTO  |  04 a 06 de dezembro de 2026  |  Emitido: "+now,8,30);
 const stats=[["INSCRITOS",data.all.length],["CONFIRMADOS",data.confirmed.length],["PENDENTES",data.pending.length],["ARRECADADO",money(data.paid)],["A RECEBER",money(data.due)],["TOTAL PREVISTO",money(data.total)]];
 const gap=3,cardW=(W-16-5*gap)/6;
 stats.forEach(([label,value],i)=>{
  const x=8+i*(cardW+gap);
  fill([242,245,249]);pdf.roundedRect(x,41,cardW,19,1.5,1.5,"F");
  color([91,105,124]);pdf.setFont("helvetica","bold");pdf.setFontSize(6.4);pdf.text(label,x+3,48);
  color(ink);pdf.setFontSize(11);pdf.text(String(value),x+3,56);
 });
 const colsGap=4,colsW=(W-16-2*colsGap)/3,top=66,bottom=202,usable=bottom-top-19;
 const maxRows=Math.max(1,...sections.map(s=>s.rows.length));
 // Calcula a altura das linhas para encaixar cada lista inteira em uma única A4.
 const rowH=Math.min(5.2,usable/maxRows);
 const fontSize=Math.max(2.8,Math.min(7.2,rowH*1.6));
 const dense=maxRows>45;
 const widths=[9,colsW*0.45,colsW*0.26,colsW*0.17];
 function fittedText(txt,width,size){
  const raw=String(txt||"");
  pdf.setFontSize(size);
  // Ajusta horizontalmente o texto, sem ocultar nomes.
  const w=pdf.getTextWidth(raw);
  if(w<=width)return {value:raw,font:size};
  return {value:raw,font:Math.max(2, size*width/w)};
 }
 sections.forEach((s,i)=>{
  const x=8+i*(colsW+colsGap);
  fill(ink);pdf.roundedRect(x,top,colsW,12,1.5,1.5,"F");
  color([255,255,255]);pdf.setFont("helvetica","bold");pdf.setFontSize(9);
  const heading=i===0?"TOTAL DE INSCRITOS":i===1?"CONFIRMADOS":"PENDENTES";
  pdf.text(heading,x+3,top+5);
  pdf.setFontSize(7);pdf.text(String(s.rows.length)+" pessoas",x+colsW-3,top+5,{align:"right"});
  fill([239,233,222]);pdf.rect(x,top+12,colsW,9,"F");
  color(ink);pdf.setFontSize(7);
  pdf.text(money(s.amount),x+colsW-3,top+18,{align:"right"});
  pdf.text(s.amountLabel,x+3,top+18);
  const colNames=["Nº","NOME","WHATSAPP","VALOR"];
  let at=x;
  fill([227,232,239]);pdf.rect(x,top+21,colsW,6,"F");
  colNames.forEach((name,k)=>{color(ink);pdf.setFont("helvetica","bold");pdf.setFontSize(5.9);pdf.text(name,at+1,top+25);at+=widths[k]});
  const bodyStart=top+27,bodyH=bottom-bodyStart-3;
  const effectiveRowH=s.rows.length?Math.min(5.2,bodyH/s.rows.length):5.2;
  const currentFont=Math.max(2.5,Math.min(7.1,effectiveRowH*1.5));
  s.rows.forEach((r,k)=>{
   const y=bodyStart+k*effectiveRowH;
   if(k%2===0){fill([247,249,251]);pdf.rect(x,y,colsW,effectiveRowH,"F");}
   const values=[r.registration_code,r.full_name,r.phone,money(Number(r.amount_cents)??10000)];
   let xx=x;
   values.forEach((v,col)=>{
    color(ink);pdf.setFont("helvetica",col===1?"bold":"normal");
    const txt=fittedText(v,widths[col]-2,currentFont);
    pdf.setFontSize(txt.font);
    pdf.text(txt.value,xx+1,y+effectiveRowH*.73);
    xx+=widths[col];
   });
  });
  if(!s.rows.length){color([101,114,130]);pdf.setFont("helvetica","italic");pdf.setFontSize(8);pdf.text("Nenhum participante",x+3,bodyStart+8);}
  pdf.setDrawColor(217,224,233);pdf.rect(x,top,colsW,bottom-top);
 });
 color([98,111,129]);pdf.setFont("helvetica","normal");pdf.setFontSize(7);
 pdf.text("DOCUMENTO CONFIDENCIAL  ·  Cada pessoa aparece na lista geral e na respectiva situação de pagamento.",8,207);
 return pdf;
}
async function exportPdf(){
 const button=document.getElementById("export");
 if(button.disabled)return;
 // A aba é aberta no clique para evitar bloqueios dos navegadores mobile.
 const viewer=window.open("about:blank","_blank");
 if(viewer){viewer.document.title="Preparando relatório";viewer.document.body.textContent="Preparando relatório de inscrições...";}
 button.disabled=true;button.textContent="GERANDO PDF...";
 setMsg("Reunindo a lista geral, confirmados e pendentes...");
 try{
  const all=await fetchAllForPdf();
  if(!window.jspdf?.jsPDF || typeof window.jspdf.jsPDF.API?.autoTable!=="function"){
   if(!viewer)throw Error("Abra as permissões de novas abas do navegador e tente novamente.");
   viewer.document.open();viewer.document.write(printableHtml(all));viewer.document.close();viewer.focus();
   setMsg("Relatório premium aberto. Use SALVAR COMO PDF / IMPRIMIR e selecione Salvar como PDF.");
   return;
  }
  const pdf=makePremiumPdf(all),blob=pdf.output("blob"),url=URL.createObjectURL(blob);
  if(viewer){viewer.location.replace(url);viewer.focus();setMsg("PDF A4 de uma página aberto com total, confirmados e pendentes.");}
  else{
   const a=document.createElement("a");a.href=url;a.download="relatorio-unico-A4-inscricoes-escatologia-2026.pdf";
   document.body.append(a);a.click();a.remove();setMsg("Relatório PDF completo gerado. Confira seus downloads.");
  }
 }catch(err){
  if(viewer){try{viewer.document.body.textContent="Não foi possível gerar o relatório: "+(err?.message||"Erro desconhecido");}catch(_){viewer.close();}}
  setMsg("Falha na exportação: "+(err?.message||"tente novamente."));
 }finally{button.disabled=false;button.textContent="EXPORTAR PDF";}
}
document.getElementById("export").onclick=exportPdf;sessionCheck()})();