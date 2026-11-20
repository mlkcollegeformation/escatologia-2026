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
 const {error}=await db.from("event_registrations").update({payment_status:next,confirmed_at:next==="confirmed"?new Date().toISOString():null,confirmed_by:next==="confirmed"?user.id:null}).in("id",groupIds).eq("event_slug",cfg.eventSlug);if(error){setMsg("Não foi possível atualizar. Verifique permissões de administrador.");btn.disabled=false;return}setMsg("Inscrição atualizada.");await load()};actions.append(btn);tbody.append(tr)}}async function load(){setMsg("Carregando inscrições...");const {data,error}=await db.from("event_registrations").select("id,created_at,full_name,phone,email,registration_code,payment_status,receipt_path,entrance_receipt_path,payment_method,registration_source,sheet_responsible,registration_type,couple_id,amount_cents").eq("event_slug",cfg.eventSlug).order("created_at",{ascending:false}).limit(5000);if(error){setMsg("Acesso negado ou erro ao carregar inscrições. Confirme a autorização do usuário no Supabase.");return}authorizedRows(data);setMsg(records.length>=5000?"Exibindo até 5.000 registros; exporte periodicamente.":"Dados atualizados.")}async function sessionCheck(){const {data:{session}}=await db.auth.getSession();if(!session){login.classList.remove("hidden");dashboard.classList.add("hidden");return}const {data,isError,error}=await db.from("event_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();if(error||!data){await db.auth.signOut();login.classList.remove("hidden");dashboard.classList.add("hidden");loginMsg.textContent="Sua conta não está autorizada para acessar este painel.";return}login.classList.add("hidden");dashboard.classList.remove("hidden");await load()}loginForm.addEventListener("submit",async e=>{e.preventDefault();loginMsg.textContent="Validando acesso...";const f=new FormData(loginForm);const {error}=await db.auth.signInWithPassword({email:String(f.get("email")),password:String(f.get("password"))});if(error){loginMsg.textContent="Credenciais inválidas ou conta sem acesso.";return}loginMsg.textContent="";await sessionCheck()});document.getElementById("logout").onclick=async()=>{await db.auth.signOut();records=[];dashboard.classList.add("hidden");login.classList.remove("hidden")};document.getElementById("reload").onclick=load;document.getElementById("search").oninput=render;document.getElementById("filter").onchange=render;
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
async function exportPdf(){
 const button=document.getElementById("export");
 if(!window.jspdf?.jsPDF){setMsg("O gerador de PDF não carregou. Verifique a conexão e atualize a página.");return;}
 button.disabled=true;button.textContent="GERANDO PDF...";
 try{
  const all=await fetchAllForPdf();
  const pdf=new window.jspdf.jsPDF({orientation:"landscape",unit:"mm",format:"a3"});
  if(typeof pdf.autoTable!=="function")throw new Error("O módulo de tabelas do PDF não carregou. Atualize a página.");
  const total=all.length;
  const confirmed=all.filter(r=>r.payment_status==="confirmed");
  const pending=all.filter(r=>r.payment_status!=="confirmed");
  const money=cents=>fmt.format(cents/100);
  const paid=confirmed.reduce((sum,r)=>sum+(r.amount_cents??10000),0);
  const toReceive=pending.reduce((sum,r)=>sum+(r.amount_cents??10000),0);
  const date=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(16);
  pdf.text("XIV SEMINÁRIO DE ESCATOLOGIA — LISTA DE INSCRITOS",13,17);
  pdf.setFontSize(9);pdf.setFont("helvetica","normal");
  pdf.text("Relatório administrativo | Gerado em: "+date+" | Todos os inscritos, independentemente dos filtros do painel",13,25);
  pdf.text("Inscritos: "+total+"   Confirmados: "+confirmed.length+"   Pendentes: "+pending.length,13,32);
  pdf.text("Arrecadado confirmado: "+money(paid)+"   A receber (pendentes): "+money(toReceive)+"   Total das inscrições: "+money(paid+toReceive),13,39);
  const rows=all.map(r=>{
   const mode=r.registration_type==="couple"?"Casal (R$ 160 / 2)":r.registration_source==="sheet"?"Ficha: "+(r.sheet_responsible||"Não informado"):"Individual online";
   const receipt=r.payment_method==="pix"?(r.receipt_path?"PIX anexado":"PIX pendente"):(r.entrance_receipt_path?"Portaria anexado":"Portaria pendente");
   return [clean(r.registration_code),clean(r.full_name),clean(r.phone),clean(r.email),
     niceDate(r.created_at),mode,
     r.payment_method==="entrance"?"Na entrada":"PIX",
     r.payment_status==="confirmed"?"Confirmado":"Pendente",
     money(r.amount_cents??10000),receipt];
  });
  pdf.autoTable({
   head:[["Nº","PARTICIPANTE","WHATSAPP","E-MAIL","CADASTRO","ORIGEM / RESPONSÁVEL","PAGAMENTO","STATUS","VALOR","COMPROVANTE"]],
   body:rows,
   startY:45,
   margin:{top:15,bottom:18,left:12,right:12},
   theme:"grid",
   styles:{font:"helvetica",fontSize:7,cellPadding:2.5,overflow:"linebreak",valign:"middle",lineColor:[215,220,228],lineWidth:.1},
   headStyles:{fillColor:[19,31,50],textColor:[255,255,255],fontStyle:"bold",fontSize:7},
   alternateRowStyles:{fillColor:[247,249,252]},
   columnStyles:{
    0:{cellWidth:15},1:{cellWidth:53},2:{cellWidth:28},3:{cellWidth:62},
    4:{cellWidth:30},5:{cellWidth:70},6:{cellWidth:25},
    7:{cellWidth:24},8:{cellWidth:24},9:{cellWidth:31}
   },
   didDrawPage:()=>{
    const pages=pdf.internal.getNumberOfPages();
    pdf.setFontSize(8);pdf.setTextColor(100,110,120);
    pdf.text("Documento administrativo confidencial — dados pessoais de inscritos",12,285);
    pdf.text("Página "+pages,405,285,{align:"right"});
   }
  });
  pdf.save("lista-completa-inscritos-escatologia-2026.pdf");
  setMsg("PDF gerado com "+total+" inscrição(ões). Inclui todos os registros, inclusive os fora dos filtros visuais.");
 }catch(err){setMsg("Erro ao gerar PDF: "+(err?.message||"tente novamente."));}
 finally{button.disabled=false;button.textContent="EXPORTAR PDF";}
}
document.getElementById("export").onclick=exportPdf;sessionCheck()})();