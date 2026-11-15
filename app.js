const C=window.EVENT_CONFIG;const agenda=[{date:"SEXTA-FEIRA, 04 DE DEZEMBRO",items:[["19:00","Check-in, retirada de crachás e acertos finais"],["19:30","Intercessão Hefesibá e louvor — Profetas que Louvam"],["20:15","1ª palestra — Olhe ao Seu Redor (Lc 21:29–31)"],["22:00","Encerramento"]]},{date:"SÁBADO, 05 DE DEZEMBRO",items:[["15:40","Profetas que Louvam"],["16:00","2ª palestra — Como Num Funil: Convergência e Iminência do Fim (Mt 24:33)"],["17:30","3ª palestra — As Dores de Parto e Caos Global (Mt 24:8)"],["18:15","Intervalo de 30 minutos"],["18:50","Apresentação — Grupo Profético de Dança Fontes de Sião"]]},{date:"DOMINGO, 06 DE DEZEMBRO",items:[["07:30–08:30","Café da manhã — Cantina Tabernáculo"],["08:30","Oração e louvores — Profetas que Louvam"],["09:00","Ministério CIA de Teatro Kalil"],["09:20","4ª palestra — Infraestrutura Tecnológica e a Economia da Besta (Dn 12:4; Ap 13:16–17)"],["10:30–11:30","5ª palestra — Aguardando a Bendita Esperança"]]}];function renderAgenda(i){const box=document.getElementById("schedule-list");const day=agenda[i];box.replaceChildren();const heading=document.createElement("div");heading.className="agenda-heading";heading.textContent=day.date;box.appendChild(heading);day.items.forEach(([time,label])=>{const row=document.createElement("div");row.className="agenda-row";const t=document.createElement("time");t.textContent=time;const p=document.createElement("p");p.textContent=label;row.append(t,p);box.appendChild(row)});document.querySelectorAll(".day-tab").forEach((b,k)=>{b.classList.toggle("active",i===k);b.setAttribute("aria-selected",String(i===k))})}renderAgenda(0);document.querySelectorAll(".day-tab").forEach(btn=>btn.addEventListener("click",()=>renderAgenda(Number(btn.dataset.day))));document.getElementById("copy-pix").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(C.pixKey);document.getElementById("copy-pix").textContent="CHAVE PIX COPIADA ✓"}catch{prompt("Copie a chave PIX:",C.pixKey)}});
const form=document.getElementById("registration-form"),msg=document.getElementById("form-message"),submit=document.getElementById("register-btn");
const ready=Boolean(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
const db=ready?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
function showMessage(value){msg.textContent=value;msg.classList.add("error")}
form.addEventListener("submit",async event=>{
 event.preventDefault();msg.textContent="";msg.classList.remove("error");
 if(!ready){showMessage("As inscrições não estão disponíveis neste momento.");return}
 const fields=new FormData(form);
 const name=String(fields.get("full_name")||"").trim(),phone=String(fields.get("phone")||"").replace(/\D/g,""),email=String(fields.get("email")||"").trim().toLowerCase();
 const receipt=fields.get("receipt");
 if(name.length<3||phone.length<10||!/^\S+@\S+\.\S+$/.test(email)||!fields.get("consent")){showMessage("Confira seus dados e aceite a declaração de privacidade.");return}
 const kinds={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
 if(!(receipt instanceof File)||!kinds[receipt.type]||receipt.size<1||receipt.size>5*1024*1024){showMessage("Anexe um comprovante JPG, PNG, WEBP ou PDF de até 5 MB.");return}
 submit.disabled=true;
 const filePath=C.eventSlug+"/"+crypto.randomUUID()+"."+kinds[receipt.type];
 try{
  submit.textContent="ENVIANDO COMPROVANTE…";
  const {error:uploadError}=await db.storage.from("escatologia-comprovantes").upload(filePath,receipt,{upsert:false,contentType:receipt.type});
  if(uploadError){showMessage("Não foi possível enviar o comprovante. Tente novamente.");return}
  submit.textContent="FINALIZANDO…";
  const code="ESC-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
  const {error}=await db.from("event_registrations").insert({registration_code:code,event_slug:C.eventSlug,full_name:name,phone,email,consent:true,receipt_path:filePath});
  if(error){showMessage(error.code==="23505"?"E-mail ou telefone já cadastrado. Contate a organização.":"Não foi possível finalizar o cadastro. Contate a organização informando seus dados.");return}
  form.classList.add("hidden");
  document.getElementById("registration-reference").textContent="Código de inscrição: "+code;
  document.getElementById("registration-success").classList.remove("hidden");
 }catch(err){showMessage("Erro de conexão. Verifique sua internet e tente novamente.")}
 finally{submit.disabled=false;submit.textContent="ENVIAR COMPROVANTE E FINALIZAR ↗"}
});
