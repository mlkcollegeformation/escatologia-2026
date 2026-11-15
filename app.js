const C=window.EVENT_CONFIG;const agenda=[{date:"SEXTA-FEIRA, 04 DE DEZEMBRO",items:[["19:00","Check-in, retirada de crachás e acertos finais"],["19:30","Intercessão Hefesibá e louvor — Profetas que Louvam"],["20:15","1ª palestra — Olhe ao Seu Redor (Lc 21:29–31)"],["22:00","Encerramento"]]},{date:"SÁBADO, 05 DE DEZEMBRO",items:[["15:40","Profetas que Louvam"],["16:00","2ª palestra — Como Num Funil: Convergência e Iminência do Fim (Mt 24:33)"],["17:30","3ª palestra — As Dores de Parto e Caos Global (Mt 24:8)"],["18:15","Intervalo de 30 minutos"],["18:50","Apresentação — Grupo Profético de Dança Fontes de Sião"]]},{date:"DOMINGO, 06 DE DEZEMBRO",items:[["07:30–08:30","Café da manhã — Cantina Tabernáculo"],["08:30","Oração e louvores — Profetas que Louvam"],["09:00","Ministério CIA de Teatro Kalil"],["09:20","4ª palestra — Infraestrutura Tecnológica e a Economia da Besta (Dn 12:4; Ap 13:16–17)"],["10:30–11:30","5ª palestra — Aguardando a Bendita Esperança"]]}];function renderAgenda(i){const box=document.getElementById("schedule-list");const day=agenda[i];box.replaceChildren();const heading=document.createElement("div");heading.className="agenda-heading";heading.textContent=day.date;box.appendChild(heading);day.items.forEach(([time,label])=>{const row=document.createElement("div");row.className="agenda-row";const t=document.createElement("time");t.textContent=time;const p=document.createElement("p");p.textContent=label;row.append(t,p);box.appendChild(row)});document.querySelectorAll(".day-tab").forEach((b,k)=>{b.classList.toggle("active",i===k);b.setAttribute("aria-selected",String(i===k))})}renderAgenda(0);document.querySelectorAll(".day-tab").forEach(btn=>btn.addEventListener("click",()=>renderAgenda(Number(btn.dataset.day))));document.getElementById("copy-pix").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(C.pixKey);document.getElementById("copy-pix").textContent="CHAVE PIX COPIADA ✓"}catch{prompt("Copie a chave PIX:",C.pixKey)}});

const form=document.getElementById("registration-form"),msg=document.getElementById("form-message"),submit=document.getElementById("register-btn");
const ready=Boolean(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
const db=ready?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
let enrollment=null;
const paymentChoices=[...form.querySelectorAll('input[name="payment_method"]')];
const receiptField=document.getElementById("pix-upload-field");
const receiptInput=form.querySelector('input[name="receipt"]');
const pixDetails=document.querySelector(".payment-details");
function selectedMethod(){return form.querySelector('input[name="payment_method"]:checked')?.value||"pix";}
function updatePaymentOption(){
 const pix=selectedMethod()==="pix";
 receiptField.hidden=!pix;
 receiptInput.required=pix;
 receiptInput.disabled=!pix;
 if(!pix) receiptInput.value="";
 if(pixDetails)pixDetails.hidden=!pix;
 paymentChoices.forEach(radio=>{const label=radio.closest(".payment-option");if(label)label.classList.toggle("selected",radio.checked);});
 submit.textContent=pix?"ENVIAR COMPROVANTE E FINALIZAR ↗":"CONFIRMAR INSCRIÇÃO — PAGAR NA ENTRADA ↗";
}
paymentChoices.forEach(c=>c.addEventListener("change",updatePaymentOption));updatePaymentOption();
function showMessage(value){msg.textContent=value;msg.classList.add("error");}
form.addEventListener("submit",async event=>{
 event.preventDefault();msg.textContent="";msg.classList.remove("error");
 if(!ready){showMessage("As inscrições não estão disponíveis neste momento.");return;}
 const fields=new FormData(form);
 const name=String(fields.get("full_name")||"").trim(),phone=String(fields.get("phone")||"").replace(/\D/g,""),email=String(fields.get("email")||"").trim().toLowerCase();
 const method=selectedMethod();const receipt=fields.get("receipt");
 if(name.length<3||phone.length<10||!/^\S+@\S+\.\S+$/.test(email)||!fields.get("consent")){showMessage("Confira seus dados e aceite a declaração de privacidade.");return;}
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
  const code="ESC-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
  const {error}=await db.from("event_registrations").insert({registration_code:code,event_slug:C.eventSlug,full_name:name,phone,email,consent:true,receipt_path:path,payment_method:method});
  if(error){showMessage(error.code==="23505"?"E-mail ou telefone já cadastrado. Contate a organização.":"Não foi possível finalizar o cadastro. Contate a organização informando seus dados.");return;}
  enrollment={name,phone,email,code,method,createdAt:new Date()};
  form.classList.add("hidden");
  document.querySelector("#registration-success h3").textContent="Inscrição cadastrada!";
  document.querySelector("#registration-success > p").textContent=method==="entrance"?"Seu cadastro foi concluído. O pagamento de R$ 100,00 será feito na entrada do evento.":"Comprovante recebido. Sua inscrição aguarda a conferência manual do PIX.";
  document.getElementById("registration-reference").textContent="Número da inscrição: "+code;
  document.getElementById("receipt-success-detail").textContent=method==="entrance"?"Modalidade: pagamento na entrada. Situação: pagamento pendente.":"Modalidade: PIX antecipado. Situação: pagamento em análise.";
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
 c.strokeStyle="#d5b16b";c.strokeRect(70,335,960,580);
 const line=(label,value,y)=>{c.fillStyle="#c1c4cc";c.font="22px Arial";c.fillText(label,105,y);c.fillStyle="#ffffff";c.font="bold 28px Arial";c.fillText(value,105,y+41);};
 line("NÚMERO DE INSCRIÇÃO",e.code,395);
 line("PARTICIPANTE",e.name.slice(0,50),510);
 line("DATA DO EVENTO","4, 5 E 6 DE DEZEMBRO DE 2026",625);
 line("INVESTIMENTO","R$ 100,00",740);
 line("FORMA DE PAGAMENTO",e.method==="entrance"?"PAGAMENTO NA ENTRADA":"PIX - EM ANÁLISE",850);
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
 c.fillText("Apresente o número da inscrição na recepção.",80,1906);
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
