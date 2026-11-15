# XIV Seminário de Escatologia e Batalha Espiritual 2026

**O Palco Está Pronto** — site público e painel administrativo responsivos, com identidade azul-marinho e dourado.

## Estado da implementação

- Página pública com programação por dia, cadastro e instruções de pagamento PIX de **R$ 100,00**
- Chave PIX CNPJ: **05.208.172/0001-79**, banco **Bradesco**
- Link opcional de comprovante para **(11) 99176-6716** e **(11) 91511-7067** (duas conversas separadas, sem envio automático de mídia)
- Painel em `admin.html`: login Supabase Auth, lista de inscritos, pesquisa, filtros, exportação CSV e confirmação manual de pagamentos
- Regras RLS: visitantes só podem inserir cadastros; lista e atualizações apenas para contas autorizadas
- A conta bancária deve ser conferida **fora do site** antes de marcar qualquer pagamento como confirmado

## 1. Banco de dados (obrigatório para receber inscrições)

1. Crie ou selecione um projeto Supabase administrado pela organização.
2. Abra **SQL Editor** e execute o arquivo `supabase.sql`.
3. Em **Authentication > Users**, crie/convid[e] o usuário administrador.
4. Copie o UUID desse usuário e execute em SQL Editor, com o UUID real:

```sql
insert into public.event_admins(user_id)
values ('UUID_REAL_DO_USUARIO');
```

5. Copie a **Project URL** e a **anon/publishable key** do Supabase em `config.js`. Não publique `service_role`, certificados, tokens privados ou senhas.
6. Teste cadastro com um visitante e login pelo `admin.html`; confira que visitantes não podem consultar nomes ou estados de pagamentos.

**Atenção:** antes de configurar o Supabase, o formulário exibe uma mensagem informando que inscrições ainda não estão habilitadas. A interface não finge salvar dados.

## 2. Publicar pelo GitHub Pages

Acesse `Settings > Pages > Build and deployment`, selecione **Deploy from a branch**, branch **main**, pasta **/(root)**, e salve.

URL esperada após habilitar Pages:
- Site: https://mlkcollegeformation.github.io/escatologia-2026/
- Admin: https://mlkcollegeformation.github.io/escatologia-2026/admin.html

Apenas criar o repositório não ativa automaticamente o GitHub Pages.

## 3. Vídeo e folder

Coloque os arquivos com estes nomes:
- `assets/abertura.mp4` — vídeo oficial do topo, reprodução mediante ação do visitante
- `assets/folder.jpg` — imagem de capa do player

O repositório criado nesta etapa **ainda não recebeu os arquivos binários**. É necessário enviá-los pelo GitHub (Add file > Upload files) ou Git LFS/armazenamento de vídeo, dependendo do tamanho. Vídeos grandes são mais adequados a um serviço externo de mídia.

## 4. Pagamento

O PIX é uma **transferência manual** usando a chave CNPJ. **Não há geração automática de cobrança, QR Code dinâmico ou confirmação bancária.** Administradores verificam crédito na conta Bradesco e clicam em **CONFIRMAR PIX**. Comprovante pelo WhatsApp é opcional. Os dois links não encaminham o arquivo automaticamente.

## 5. Programação

A programação implementada está no arquivo `app.js`. Revisar horários e dados com a organização antes de divulgar. Os seis temas do folder podem não estar todos incluídos na grade recebida; não se atribuiu horário inventado a temas sem horário confirmado.

## Privacidade e segurança

Cadastros contêm dados pessoais; evite coletar mais do que o necessário, configure retenção e restringa administradores. O painel não possui senhas embutidas no código. O login usa Supabase Auth e a autorização usa `event_admins` com RLS.

O front-end está preparado; **não libere inscrições ao público antes de concluir o Supabase e testar o fluxo**.
