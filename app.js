const C=window.EVENT_CONFIG;const agenda=[{date:"SEXTA-FEIRA, 04 DE DEZEMBRO",items:[["19:00","Check-in, retirada de crachás e acertos finais"],["19:30","Intercessão Hefesibá e louvor — Profetas que Louvam"],["20:15","1ª palestra — Olhe ao Seu Redor (Lc 21:29–31)"],["22:00","Encerramento"]]},{date:"SÁBADO, 05 DE DEZEMBRO",items:[["15:40","Profetas que Louvam"],["16:00","2ª palestra — Como Num Funil: Convergência e Iminência do Fim (Mt 24:33)"],["17:30","3ª palestra — As Dores de Parto e Caos Global (Mt 24:8)"],["18:15","Intervalo de 30 minutos"],["18:50","Apresentação — Grupo Profético de Dança Fontes de Sião"]]},{date:"DOMINGO, 06 DE DEZEMBRO",items:[["07:30–08:30","Café da manhã — Cantina Tabernáculo"],["08:30","Oração e louvores — Profetas que Louvam"],["09:00","Ministério CIA de Teatro Kalil"],["09:20","4ª palestra — Infraestrutura Tecnológica e a Economia da Besta (Dn 12:4; Ap 13:16–17)"],["10:30–11:30","5ª palestra — Aguardando a Bendita Esperança"]]}];function renderAgenda(i){const box=document.getElementById("schedule-list");const day=agenda[i];box.replaceChildren();const heading=document.createElement("div");heading.className="agenda-heading";heading.textContent=day.date;box.appendChild(heading);day.items.forEach(([time,label])=>{const row=document.createElement("div");row.className="agenda-row";const t=document.createElement("time");t.textContent=time;const p=document.createElement("p");p.textContent=label;row.append(t,p);box.appendChild(row)});document.querySelectorAll(".day-tab").forEach((b,k)=>{b.classList.toggle("active",i===k);b.setAttribute("aria-selected",String(i===k))})}renderAgenda(0);document.querySelectorAll(".day-tab").forEach(btn=>btn.addEventListener("click",()=>renderAgenda(Number(btn.dataset.day))));document.getElementById("copy-pix").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(C.pixKey);document.getElementById("copy-pix").textContent="CHAVE PIX COPIADA ✓"}catch{prompt("Copie a chave PIX:",C.pixKey)}});

const form=document.getElementById("registration-form"),msg=document.getElementById("form-message"),submit=document.getElementById("register-btn");
const ready=Boolean(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
const db=ready?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
let enrollment=null;
let registrationMode="online";
const openingActions=document.getElementById("registration-open-actions");
const openOnline=document.getElementById("open-online-registration");
const openSheet=document.getElementById("open-sheet-registration");
const openCouple=document.getElementById("open-couple-registration");
const coupleExtra=document.getElementById("couple-extra-fields");
const coupleInputs=[...coupleExtra.querySelectorAll("input")];
const dateParts=()=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));return obj.year+"-"+obj.month+"-"+obj.day;};
function coupleAvailable(){return dateParts()<="2026-11-20"}
openCouple.hidden=!coupleAvailable();
const backButton=document.getElementById("back-registration");
const panelTitle=document.getElementById("form-panel-title");
const sheetResponsibleField=document.getElementById("sheet-responsible-field");
const sheetResponsibleInput=sheetResponsibleField.querySelector('select[name="sheet_responsible"]');
const sheetPaymentInfo=document.getElementById("sheet-payment-info");
const paymentChoice=document.getElementById("payment-choice");
const paymentChoices=[...form.querySelectorAll('input[name="payment_method"]')];
const receiptField=document.getElementById("pix-upload-field");
const receiptInput=form.querySelector('input[name="receipt"]');
const pixDetails=document.getElementById("registration-pix-details");
function selectedMethod(){return registrationMode==="sheet"?"pix":form.querySelector('input[name="payment_method"]:checked')?.value||"pix";}
function updatePaymentOption(){
 const pix=selectedMethod()==="pix";
 receiptField.hidden=!pix;
 receiptInput.required=pix;
 receiptInput.disabled=!pix;
 if(!pix)receiptInput.value="";
 if(pixDetails)pixDetails.hidden=(!pix||form.classList.contains("hidden"));
 paymentChoices.forEach(radio=>{const label=radio.closest(".payment-option");if(label)label.classList.toggle("selected",radio.checked);});
 document.getElementById("entrance-payment-value").textContent=registrationMode==="couple"?"R$ 160,00 por casal no dia do evento · sem comprovante agora":"R$ 100,00 no dia do evento · sem comprovante agora";
 submit.textContent=registrationMode==="couple"?(pix?"ENVIAR COMPROVANTE DO CASAL ↗":"CONFIRMAR INSCRIÇÃO DO CASAL ↗"):registrationMode==="sheet"?"ENVIAR COMPROVANTE E CONFIRMAR FICHA ↗":pix?"ENVIAR COMPROVANTE E FINALIZAR ↗":"CONFIRMAR INSCRIÇÃO — PAGAR NA ENTRADA ↗";
}
function openRegistration(mode){
 if(mode==="couple"&&!coupleAvailable()){alert("A promoção de casal foi encerrada em 20/11/2026.");openCouple.hidden=true;return;}
 registrationMode=mode;
 const isCouple=mode==="couple";coupleExtra.hidden=!isCouple;coupleInputs.forEach(el=>{el.required=isCouple;el.disabled=!isCouple;});
 document.getElementById("couple-promo-price").hidden=!isCouple;
 openingActions.classList.add("hidden");
 form.classList.remove("hidden");
 openOnline.setAttribute("aria-expanded",String(mode==="online"));
 openSheet.setAttribute("aria-expanded",String(mode==="sheet"));
 openCouple.setAttribute("aria-expanded",String(isCouple));
 panelTitle.textContent=mode==="sheet"?"CONFIRMAR INSCRIÇÃO POR FICHA":isCouple?"INSCRIÇÃO PROMOCIONAL CASAL — R$ 160":"REALIZAR INSCRIÇÃO";
 const isSheet=mode==="sheet";
 sheetResponsibleField.hidden=!isSheet;
 sheetResponsibleInput.disabled=!isSheet;
 sheetResponsibleInput.required=isSheet;
 sheetPaymentInfo.hidden=!isSheet;
 paymentChoice.hidden=isSheet;
 if(isSheet){form.querySelector('input[name="payment_method"][value="pix"]').checked=true;}
 updatePaymentOption();
 form.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function closeRegistration(){
 form.classList.add("hidden");
 coupleExtra.hidden=true;document.getElementById("couple-promo-price").hidden=true;
 openingActions.classList.remove("hidden");
 if(pixDetails)pixDetails.hidden=true;
 openOnline.setAttribute("aria-expanded","false");openSheet.setAttribute("aria-expanded","false");openCouple.setAttribute("aria-expanded","false");
 panelTitle.textContent="ESCOLHA SUA INSCRIÇÃO";
 msg.textContent="";
}
openOnline.addEventListener("click",()=>openRegistration("online"));
openSheet.addEventListener("click",()=>openRegistration("sheet"));
openCouple.addEventListener("click",()=>openRegistration("couple"));
backButton.addEventListener("click",closeRegistration);
paymentChoices.forEach(c=>c.addEventListener("change",updatePaymentOption));
updatePaymentOption();
function showMessage(value){msg.textContent=value;msg.classList.add("error");}
form.addEventListener("submit",async event=>{
 event.preventDefault();msg.textContent="";msg.classList.remove("error");
 if(!ready){showMessage("As inscrições não estão disponíveis neste momento.");return;}
 const fields=new FormData(form);
 const name=String(fields.get("full_name")||"").trim(),phone=String(fields.get("phone")||"").replace(/\D/g,""),email=String(fields.get("email")||"").trim().toLowerCase();
 const isCouple=registrationMode==="couple";
 const spouseName=String(fields.get("spouse_name")||"").trim(),spousePhone=String(fields.get("spouse_phone")||"").replace(/\D/g,""),spouseEmail=String(fields.get("spouse_email")||"").trim().toLowerCase();
 if(isCouple&&(!coupleAvailable()||spouseName.length<3||spousePhone.length<10||!/^\S+@\S+\.\S+$/.test(spouseEmail)||spousePhone===phone||spouseEmail===email)){showMessage("Promoção encerrada ou dados do casal inválidos. Informe contatos diferentes para cada cônjuge.");return;}
 const method=selectedMethod();const receipt=fields.get("receipt");const responsible=registrationMode==="sheet"?String(fields.get("sheet_responsible")||"").trim():null;
 if(name.length<3||phone.length<10||!/^\S+@\S+\.\S+$/.test(email)||!fields.get("consent")){showMessage("Confira seus dados e aceite a declaração de privacidade.");return;}
 if(registrationMode==="sheet"&&(!responsible||responsible.length<3)){showMessage("Informe o nome do pastor ou responsável pela ficha de inscrição.");return;}
 const kinds={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
 if(method==="pix"&&(!(receipt instanceof File)||!kinds[receipt.type]||receipt.size<1||receipt.size>5*1024*1024)){
  showMessage("Para pagamento PIX, anexe um comprovante JPG, PNG, WEBP ou PDF de até 5 MB.");return;
 }
 submit.disabled=true;let path=null;
 try{
  if(method==="pix"){
   path=C.eventSlug+"/"+crypto.randomUUID()+"."+kinds[receipt.type];
   submit.textContent="ENVIANDO COMPROVANTE…";
   const {error:uploadError}=await db.storage.from("escatologia-comprovantes").upload(path,receipt,{upsert:false,contentType:receipt.type});
   if(uploadError){showMessage("Não foi possível enviar o comprovante. Tente novamente.");return;}
  }
  submit.textContent="FINALIZANDO INSCRIÇÃO…";
  if(isCouple){
   const {data:codes,error:coupleError}=await db.rpc("event_register_couple",{p_name_1:name,p_phone_1:phone,p_email_1:email,p_name_2:spouseName,p_phone_2:spousePhone,p_email_2:spouseEmail,p_payment_method:method,p_receipt_path:path,p_consent:true});
   if(coupleError||!codes?.first_code||!codes?.second_code){
    const errText=String(coupleError?.message||"");
    const errDetail=String(coupleError?.details||"");
    const duplicateContact=coupleError?.code==="23505"&&/registration_event_(phone|email)_unique/i.test(errText+" "+errDetail);
    const duplicateReceipt=/receipt_path|Comprovante PIX ja vinculado/i.test(errText+" "+errDetail);
    showMessage(errText.includes("Promocao")?"A promoção de casal terminou em 20/11/2026.":duplicateContact?"Um dos telefones ou e-mails já está cadastrado. Confira os contatos ou fale com a organização.":duplicateReceipt?"Este comprovante PIX já está vinculado a outra inscrição. Confira o arquivo e tente novamente.":"Não foi possível registrar o casal. Verifique os dados e tente novamente.");return;
   }
   enrollment={name,phone,email,code:String(codes.first_code),secondCode:String(codes.second_code),spouseName,method,registrationMode,responsible:null,amount:160,createdAt:new Date()};
   form.classList.add("hidden");openingActions.classList.add("hidden");if(pixDetails)pixDetails.hidden=true;
   document.querySelector("#registration-success h3").textContent="Inscrição do casal registrada!";
   document.querySelector("#registration-success > p").textContent=method==="entrance"?"Pagamento de R$ 160,00 por casal na entrada do evento.":"Comprovante de R$ 160,00 recebido para análise da organização.";
   document.getElementById("registration-reference").textContent=name+": inscrição "+codes.first_code+" · "+spouseName+": inscrição "+codes.second_code;
   document.getElementById("receipt-success-detail").textContent="Dois participantes, um pagamento de R$ 160,00. Baixe o comprovante do casal para apresentar na portaria.";
   document.getElementById("registration-success").classList.remove("hidden");return;
  }
  const registrationId=crypto.randomUUID();
  // A sequência 001, 002, 003... é atribuída pelo banco de dados.
  const {error}=await db.from("event_registrations").insert({id:registrationId,registration_code:"PENDENTE",event_slug:C.eventSlug,full_name:name,phone,email,consent:true,receipt_path:path,payment_method:method,registration_source:registrationMode,sheet_responsible:responsible});
  if(error){const detail=String(error.message||"")+" "+String(error.details||"");showMessage(error.code==="23505"&&/registration_event_(phone|email)_unique/i.test(detail)?"E-mail ou telefone já cadastrado. Contate a organização.":/receipt_path|Comprovante PIX ja vinculado/i.test(detail)?"Comprovante PIX já utilizado em outra inscrição. Confirme o arquivo enviado.":"Não foi possível finalizar o cadastro. Contate a organização informando seus dados.");return;}
  const {data:issuedCode,error:codeError}=await db.rpc("event_registration_code_by_id",{p_id:registrationId});
  if(codeError||!issuedCode){
   showMessage("Seu cadastro foi registrado, mas não foi possível recuperar o número de inscrição. Entre em contato com a organização antes de reenviar.");return;
  }
  const code=String(issuedCode);
  enrollment={name,phone,email,code,method,registrationMode,responsible,createdAt:new Date()};
  form.classList.add("hidden");openingActions.classList.add("hidden");if(pixDetails)pixDetails.hidden=true;
  document.querySelector("#registration-success h3").textContent=registrationMode==="sheet"?"Inscrição por ficha registrada!":"Inscrição cadastrada!";
  document.querySelector("#registration-success > p").textContent=method==="entrance"?"Seu cadastro foi concluído. O pagamento de R$ 100,00 será feito na entrada do evento.":"Comprovante recebido. Sua inscrição aguarda a conferência manual do PIX.";
  document.getElementById("registration-reference").textContent="Número da inscrição: "+code;
  document.getElementById("receipt-success-detail").textContent=registrationMode==="sheet"?"Ficha entregue por: "+responsible+". Pagamento PIX em análise.":method==="entrance"?"Modalidade: pagamento na entrada. Situação: pagamento pendente.":"Modalidade: PIX antecipado. Situação: pagamento em análise.";
  document.getElementById("registration-success").classList.remove("hidden");
 }catch(err){showMessage("Erro de conexão. Verifique sua internet e tente novamente.");}
 finally{submit.disabled=false;updatePaymentOption();}
});
function receiptCanvas(){
 if(!enrollment)return null;
 const canvas=document.createElement("canvas");canvas.width=1100;canvas.height=2050;
 const c=canvas.getContext("2d"),e=enrollment;
 c.fillStyle="#090e1b";c.fillRect(0,0,1100,2050);
 c.fillStyle="#d5b16b";c.fillRect(70,65,960,5);
 c.font="bold 28px Montserrat, Arial";c.fillText("XIV SEMINÁRIO DE ESCATOLOGIA",80,132);
 c.font="23px Montserrat, Arial";c.fillText("E BATALHA ESPIRITUAL · 2026",80,172);
 c.fillStyle="#f2dfad";c.font="bold 56px Georgia, serif";c.fillText("O PALCO ESTÁ PRONTO",80,280);
 // Número individual de inscrição em destaque no comprovante baixado.
 c.fillStyle="#251d14";c.fillRect(70,324,960,115);
 c.strokeStyle="#d5b16b";c.lineWidth=3;c.strokeRect(70,324,960,115);
 c.fillStyle="#e9cc89";c.font="bold 21px Arial";c.fillText("SEU NÚMERO INDIVIDUAL DE INSCRIÇÃO",105,357);
 c.fillStyle="#ffffff";c.font="bold 44px Arial";c.fillText(e.secondCode?e.code+"  /  "+e.secondCode:e.code,105,411);
 c.lineWidth=1;c.strokeStyle="#d5b16b";c.strokeRect(70,465,960,450);
 const line=(label,value,y)=>{c.fillStyle="#c1c4cc";c.font="22px Arial";c.fillText(label,105,y);c.fillStyle="#ffffff";c.font="bold 28px Arial";c.fillText(value,105,y+41);};
 line(e.secondCode?"PARTICIPANTES DO CASAL":"PARTICIPANTE",e.name.slice(0,50),510);
 if(e.secondCode){c.fillStyle="#e9cc89";c.font="bold 24px Arial";c.fillText("Cônjuge: "+e.spouseName.slice(0,48)+" · Nº "+e.secondCode,105,605);}
 line("DATA DO EVENTO","4, 5 E 6 DE DEZEMBRO DE 2026",625);
 line("INVESTIMENTO",e.secondCode?"R$ 160,00 POR CASAL":"R$ 100,00",740);
 line("FORMA DE PAGAMENTO",e.method==="entrance"?"PAGAMENTO NA ENTRADA":"PIX - EM ANÁLISE",850);
 if(e.registrationMode==="sheet"){c.fillStyle="#f2dfad";c.font="bold 18px Arial";c.fillText("INSCRIÇÃO POR FICHA · RESPONSÁVEL: "+e.responsible.slice(0,45),80,952);}
 c.fillStyle="#d5b16b";c.font="bold 28px Arial";c.fillText("INFORMAÇÕES DO SEMINÁRIO",80,990);
 c.font="21px Arial";c.fillStyle="#f5f1e9";
 c.fillText("Palestrante: Dr. Th. Gilson Henriques",80,1035);
 c.fillText("Local: Av. Alberto Byington, 2354",80,1075);
 c.fillText("Vila Maria Alta - São Paulo/SP",80,1111);
 c.fillStyle="#d5b16b";c.font="bold 28px Arial";c.fillText("PROGRAMAÇÃO",80,1188);
 const lines=[
 "SEXTA, 04/12",
 "19h — Check-in e retirada de crachás",
 "19h30 — Intercessão e louvor",
 "20h15 — Olhe ao Seu Redor",
 "SÁBADO, 05/12",
 "15h40 — Louvor | 16h — Como Num Funil",
 "17h30 — As Dores de Parto e Caos Global",
 "18h15 — Intervalo | 18h50 — Apresentação de dança",
 "DOMINGO, 06/12",
 "07h30 — Café da manhã | 08h30 — Oração e louvor",
 "09h — Teatro Kalil | 09h20 — Economia da Besta",
 "10h30 — Aguardando a Bendita Esperança"
 ];
 lines.forEach((text,i)=>{c.fillStyle=i===0||i===4||i===8?"#d5b16b":"#f5f1e9";c.font=(i===0||i===4||i===8?"bold ":"")+"20px Arial";c.fillText(text,80,1240+i*44);});
 c.fillStyle="#d5b16b";c.fillRect(80,1815,940,2);
 c.font="bold 22px Arial";c.fillStyle="#f5f1e9";
 c.fillText("COMPROVANTE DE CADASTRO - PAGAMENTO PENDENTE",80,1865);
 c.font="18px Arial";c.fillStyle="#b1b4be";
 c.fillText(e.secondCode?"Números de inscrição: "+e.code+" e "+e.secondCode:"Número de inscrição: "+e.code,80,1906);
 c.fillText("A confirmação financeira é realizada pela administração.",80,1941);
 return canvas;
}
function savePng(){
 const canvas=receiptCanvas();if(!canvas)return;
 canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="inscricao-"+enrollment.code+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},"image/png");
}
document.getElementById("download-png").addEventListener("click",savePng);
document.getElementById("download-pdf").addEventListener("click",()=>{
 const canvas=receiptCanvas();if(!canvas)return;
 // Usa a função nativa de impressão do navegador para salvar como PDF.
 const image=canvas.toDataURL("image/png");
 const win=window.open("","_blank");
 if(!win){savePng();alert("Seu navegador bloqueou a impressão. O PNG foi baixado; você pode salvá-lo como PDF.");return;}
 win.document.write('<!doctype html><html><head><title>Inscrição '+enrollment.code+'</title><style>body{margin:0;text-align:center;background:#fff}img{max-width:100%;height:auto}@page{size:A4;margin:0}</style></head><body><img alt="Comprovante de inscrição" src="'+image+'"><script>window.onload=()=>window.print();<\/script></body></html>');
 win.document.close();
});
