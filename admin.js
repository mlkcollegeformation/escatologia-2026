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
 const data=reportData(all),sections=reportSectionData(data);
 const money=cents=>fmt.format(cents/100);
 const safe=v=>clean(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const time=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
 const row=r=>"<tr>"+[
  r.registration_code,r.full_name,r.phone,r.email,niceDate(r.created_at),reportMode(r),
  r.payment_method==="entrance"?"Na entrada":"PIX",
  r.payment_status==="confirmed"?"Confirmado":"Pendente",
  money(Number(r.amount_cents)??10000),reportProof(r)
 ].map(x=>"<td>"+safe(x)+"</td>").join("")+"</tr>";
 const heads=["Nº","PARTICIPANTE","WHATSAPP","E-MAIL","CADASTRO","ORIGEM / RESPONSÁVEL","PAGAMENTO","STATUS","VALOR","COMPROVANTE"];
 const blocks=sections.map(s=>'<section class="report-section"><div class="section-label">RELATÓRIO '+s.index+' / 03</div><h2>'+safe(s.title)+'</h2><p class="muted">'+safe(s.description)+'</p><div class="section-summary"><b>'+s.rows.length+' PARTICIPANTES</b><b>'+safe(s.amountLabel)+': '+safe(money(s.amount))+'</b></div><table><thead><tr>'+heads.map(x=>"<th>"+x+"</th>").join("")+'</tr></thead><tbody>'+(s.rows.length?s.rows.map(row).join(""):'<tr><td colspan="10" class="empty">Nenhuma inscrição nesta categoria.</td></tr>')+'</tbody></table></section>').join("");
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Inscritos — Escatologia 2026</title><style>'+
 '@page{size:A3 landscape;margin:13mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#162235;background:#f6f7fa;margin:0;padding:18px}.cover{background:#101d31;color:#fff;padding:38px 40px;border-top:7px solid #caa568;page-break-after:always;min-height:220mm}.eyebrow{color:#ead19b;font-weight:bold;letter-spacing:2px;font-size:11px}.cover h1{font-size:30px;margin:22px 0 8px}.cover .sub{color:#d4dbea;font-size:16px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:38px}.kpi{background:#21334b;border:1px solid #526078;padding:19px;border-radius:5px}.kpi span{display:block;color:#ccd5e0;font-size:11px;margin-bottom:10px}.kpi b{font-size:24px;color:#f1d497}.cover .foot{margin-top:40px;color:#c7cfda}.report-section{background:white;padding:23px 12px;break-before:page;page-break-before:always}.section-label{font-weight:bold;color:#af8447;letter-spacing:1.5px;font-size:11px}.report-section h2{font-size:24px;color:#14233b;margin:9px 0}.muted{color:#59667a}.section-summary{background:#f0e8db;border-left:5px solid #bd9455;padding:13px;display:flex;gap:34px;justify-content:space-between;margin:18px 0}table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}th{background:#17263e;color:#fff;padding:9px 5px;text-align:left;word-break:break-word}td{border-bottom:1px solid #d9e0e8;padding:8px 5px;word-break:break-word;vertical-align:top}tr:nth-child(even){background:#f2f5f8}thead{display:table-header-group}tr{break-inside:avoid}.empty{text-align:center;padding:22px;color:#59667a}.toolbar{background:#e5e9ef;padding:12px;border-radius:5px;margin-bottom:12px}button{background:#17263e;color:#fff;font-weight:bold;border:0;border-radius:4px;padding:12px 16px}@media print{body{background:white;padding:0}.toolbar{display:none}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}th,.section-summary,.kpi{print-color-adjust:exact;-webkit-print-color-adjust:exact}.report-section{padding:10px 0}}</style></head><body>'+
 '<div class="toolbar">Relatório gerado. Clique em <button onclick="window.print()">SALVAR COMO PDF / IMPRIMIR</button> e escolha “Salvar como PDF”.</div>'+
 '<section class="cover"><div class="eyebrow">MLK COLLEGE FORMATION · RELATÓRIO ADMINISTRATIVO</div><h1>XIV SEMINÁRIO DE ESCATOLOGIA<br>E BATALHA ESPIRITUAL 2026</h1><div class="sub">O PALCO ESTÁ PRONTO · Controle de inscrições e pagamentos</div><p>Emitido em '+safe(time)+' · 04 a 06 de dezembro de 2026</p><div class="kpis">'+[
  ["INSCRITOS",data.all.length],["PAGAMENTOS CONFIRMADOS",data.confirmed.length],["PAGAMENTOS PENDENTES",data.pending.length],
  ["ARRECADADO",money(data.paid)],["A RECEBER",money(data.due)],["TOTAL DE INSCRIÇÕES",money(data.total)]
 ].map(([label,value])=>'<div class="kpi"><span>'+safe(label)+'</span><b>'+safe(value)+'</b></div>').join("")+'</div><p class="foot">Este documento contém dados pessoais de participantes e destina-se exclusivamente à organização do seminário.</p></section>'+blocks+'</body></html>';
}
function makePremiumPdf(all){
 const data=reportData(all), sections=reportSectionData(data), money=cents=>fmt.format(cents/100);
 const pdf=new window.jspdf.jsPDF({orientation:"landscape",unit:"mm",format:"a3",compress:true});
 if(typeof pdf.autoTable!=="function")throw Error("Biblioteca de tabelas PDF indisponível.");
 const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight();
 const ink=[19,31,51],gold=[199,159,91],white=[255,255,255],muted=[101,115,134];
 const date=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
 const fill=(rgb)=>pdf.setFillColor(...rgb);
 const textColor=(rgb)=>pdf.setTextColor(...rgb);
 const valueCard=(x,y,w,h,label,value)=>{
  fill([34,49,72]);pdf.roundedRect(x,y,w,h,3,3,"F");
  pdf.setDrawColor(85,102,125);pdf.roundedRect(x,y,w,h,3,3,"S");
  textColor([198,209,223]);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.text(label,x+8,y+13);
  textColor([245,219,161]);pdf.setFontSize(21);pdf.text(String(value),x+8,y+31);
 };
 // Capa premium, sem depender de imagens externas.
 fill(ink);pdf.rect(0,0,W,H,"F");
 fill(gold);pdf.rect(0,0,W,7,"F");
 fill([28,43,65]);pdf.rect(0,H-47,W,47,"F");
 textColor([227,198,142]);pdf.setFont("helvetica","bold");pdf.setFontSize(12);
 pdf.text("MLK COLLEGE FORMATION  /  RELATÓRIO ADMINISTRATIVO",23,31);
 textColor(white);pdf.setFontSize(30);pdf.text("XIV SEMINÁRIO DE ESCATOLOGIA",23,61);
 pdf.setFontSize(22);pdf.text("E BATALHA ESPIRITUAL 2026",23,74);
 textColor([220,226,235]);pdf.setFontSize(14);pdf.setFont("helvetica","normal");
 pdf.text("O PALCO ESTÁ PRONTO  |  Controle de inscrições e pagamentos",23,90);
 fill(gold);pdf.rect(23,101,66,1.5,"F");
 pdf.setFontSize(10);pdf.text("Evento: 04 a 06 de dezembro de 2026   •   Emitido em: "+date,23,114);
 const cw=(W-59)/3, gap=6;
 const stats=[
  ["INSCRITOS",data.all.length],
  ["CONFIRMADOS",data.confirmed.length],
  ["PENDENTES",data.pending.length],
  ["ARRECADADO",money(data.paid)],
  ["A RECEBER",money(data.due)],
  ["TOTAL DE INSCRIÇÕES",money(data.total)]
 ];
 stats.forEach(([label,value],i)=>{
  const col=i%3,row=Math.floor(i/3);
  valueCard(23+col*(cw+gap),134+row*54,cw,45,label,value);
 });
 textColor([206,213,226]);pdf.setFontSize(9);
 pdf.text("Documento confidencial. Contém dados pessoais destinados exclusivamente à organização do evento.",23,H-24);
 const headings=["Nº","PARTICIPANTE","WHATSAPP","E-MAIL","DATA","ORIGEM / RESPONSÁVEL","PAGAMENTO","STATUS","VALOR","COMPROVANTE"];
 const widths={0:{cellWidth:15},1:{cellWidth:53},2:{cellWidth:28},3:{cellWidth:62},4:{cellWidth:29},5:{cellWidth:73},6:{cellWidth:25},7:{cellWidth:25},8:{cellWidth:25},9:{cellWidth:32}};
 const sectionHeader=(section)=>{
  fill(ink);pdf.rect(0,0,W,40,"F");
  fill(section.color);pdf.rect(0,0,7,40,"F");
  textColor([229,202,151]);pdf.setFont("helvetica","bold");pdf.setFontSize(9);
  pdf.text("RELATÓRIO "+section.index+" / 03   ·   ESCATOLOGIA 2026",16,13);
  textColor(white);pdf.setFontSize(19);pdf.text(section.title,16,29);
 };
 sections.forEach((section)=>{
  pdf.addPage();
  sectionHeader(section);
  textColor(muted);pdf.setFont("helvetica","normal");pdf.setFontSize(10);
  pdf.text(section.description,16,49);
  fill([242,237,228]);pdf.roundedRect(15,55,W-30,19,2,2,"F");
  textColor(ink);pdf.setFont("helvetica","bold");pdf.setFontSize(11);
  pdf.text("PARTICIPANTES: "+section.rows.length,21,67);
  pdf.text(section.amountLabel+": "+money(section.amount),W-21,67,{align:"right"});
  const rows=section.rows.map(r=>[
   clean(r.registration_code),clean(r.full_name),clean(r.phone),clean(r.email),
   niceDate(r.created_at),reportMode(r),r.payment_method==="entrance"?"Na entrada":"PIX",
   r.payment_status==="confirmed"?"Confirmado":"Pendente",
   money(Number(r.amount_cents)??10000),reportProof(r)
  ]);
  if(!rows.length){
   fill([246,248,251]);pdf.roundedRect(15,82,W-30,24,2,2,"F");
   textColor(muted);pdf.setFontSize(11);pdf.text("Nenhuma inscrição nesta categoria.",23,97);
  }else{
   pdf.autoTable({
    head:[headings],body:rows,startY:81,margin:{top:48,bottom:17,left:15,right:15},
    theme:"striped",showHead:"everyPage",rowPageBreak:"avoid",
    styles:{font:"helvetica",fontSize:7.6,cellPadding:2.7,overflow:"linebreak",valign:"middle",textColor:ink,lineWidth:.08,lineColor:[221,225,230]},
    headStyles:{fillColor:ink,textColor:white,fontStyle:"bold",fontSize:7.5,cellPadding:3.5},
    alternateRowStyles:{fillColor:[246,248,251]},
    columnStyles:widths,
    didDrawPage:(ctx)=>{if(ctx.pageNumber>1)sectionHeader(section);}
   });
  }
 });
 const count=pdf.internal.getNumberOfPages();
 for(let n=1;n<=count;n++){
  pdf.setPage(n);
  pdf.setDrawColor(215,220,227);pdf.line(15,H-13,W-15,H-13);
  textColor(muted);pdf.setFont("helvetica","normal");pdf.setFontSize(8);
  pdf.text("MLK COLLEGE FORMATION  •  Relatório confidencial  •  "+date,15,H-8);
  pdf.text("PÁGINA "+n+" / "+count,W-15,H-8,{align:"right"});
 }
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
  if(viewer){viewer.location.replace(url);viewer.focus();setMsg("Relatório PDF completo aberto: lista geral, confirmados e pendentes.");}
  else{
   const a=document.createElement("a");a.href=url;a.download="relatorio-premium-inscricoes-escatologia-2026.pdf";
   document.body.append(a);a.click();a.remove();setMsg("Relatório PDF completo gerado. Confira seus downloads.");
  }
 }catch(err){
  if(viewer){try{viewer.document.body.textContent="Não foi possível gerar o relatório: "+(err?.message||"Erro desconhecido");}catch(_){viewer.close();}}
  setMsg("Falha na exportação: "+(err?.message||"tente novamente."));
 }finally{button.disabled=false;button.textContent="EXPORTAR PDF";}
}
document.getElementById("export").onclick=exportPdf;sessionCheck()})();