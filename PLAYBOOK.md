# Playbook do dev novo — CA Pharmacy

Objetivo: depois de ler isto e fazer os exercícios, você consegue pegar uma task de
**frontend** ou de **backend** e resolver sozinho. Aqui só tem o que é específico **deste
projeto**: o domínio, as telas, o caminho que um clique percorre e onde você mexe. Conceito
de linguagem, sigla de segurança, teoria de HTTP etc. é com você — procure por fora.

> Leitura de apoio (já existem, não duplicam este playbook):
> - `PROJECT_CONTEXT.md` — referência viva da arquitetura, endpoints e regras de design.
> - `BUSINESS_RULES.md` — as regras de negócio implementadas, no detalhe.
> - `backend/README.md` — referência completa dos endpoints.

---

## 1. O que é o produto (visão do cliente)

CA Pharmacy é um software de farmácia. O cliente (a farmácia) usa para **vender remédio** e
**controlar estoque**. Tudo gira em torno de uma ideia central: **o número de unidades em
estoque (`on_hand`) tem que ser sempre verdadeiro**. Toda operação importante mexe nesse número.

As pessoas que usam o sistema fazem 6 coisas, e cada uma é uma tela:

| Tela | Para que o cliente usa | O que acontece no estoque |
|---|---|---|
| **Dashboard** | Visão do dia: vendas de hoje, fila de receitas, alertas de estoque baixo | só lê |
| **Inventory** (estoque) | Cadastrar remédio, ver quantidade, dar entrada/baixa manual | ajuste manual (`+`/`-`) |
| **POS** (ponto de venda) | Bater uma venda no balcão | **diminui** o estoque |
| **Prescriptions** (receitas) | Acompanhar a receita do paciente até a dispensa | dispensar **diminui** o estoque |
| **Orders** (pedidos de compra) | Pedir mercadoria ao fornecedor e receber | receber **aumenta** o estoque |
| **Patients** (pacientes) | Cadastro de paciente (com alergias) | não mexe |

Repare que estoque sobe e desce por **vários caminhos diferentes**: venda tira, dispensa de
receita tira, recebimento de pedido põe, ajuste manual põe ou tira. Cada caminho tem suas
regras, e é por isso que o sistema existe — para que esses caminhos nunca briguem entre si.

### Os "estados" que o cliente vê

Duas coisas dominam o vocabulário das telas:

**Estado do estoque de um remédio** (calculado, nunca digitado): `In stock`, `Low stock`,
`Out of stock`, `Expiring soon`, `Expired`, `Recalled`. Um remédio também pode ser
**Controlled** (controlado — aparece sempre com cor/ícone diferente).

**Estados de processo** (a "vida" de um documento):
- Receita: `new → verifying → ready → dispensed` (ou `voided`).
- Pedido de compra: `draft → submitted → transit → received` (ou `cancelled`).
- Venda: `completed` (ou `voided`).

Boa parte das tasks vai ser "quando estiver no estado X, deixar/impedir ir pro estado Y", ou
"mostrar o estado de um jeito diferente". Tenha esses fluxos na cabeça.

---

## 2. Veja funcionando antes de ler código

Não tente entender o código no abstrato. Suba o sistema e clique.

```bash
docker compose up -d --build      # sobe banco + API + frontend
```

- Frontend: http://localhost:4173
- API: http://localhost:8080 (responde JSON puro)
- Login de teste: `jade@capharmacy.com` / senha `password123`

Roteiro de 10 minutos para sentir o produto:
1. Faça login. Olhe o Dashboard.
2. Vá em **Inventory**, escolha um remédio, dê entrada de estoque ("Receive"). Veja o número subir.
3. Vá no **POS**, monte um carrinho com esse remédio, finalize a venda. Volte no Inventory: o número desceu.
4. No POS/histórico, **anule (void)** a venda. O estoque volta.
5. Em **Orders**, crie um pedido e mude o estado até `received`. O estoque sobe.
6. Em **Prescriptions**, leve uma receita até `dispensed` e veja o estoque cair.

Enquanto faz isso, abra o DevTools → aba Network. Cada ação dispara uma chamada pra API
(`/api/...`). **Essa chamada é a costura entre frontend e backend** — é por ela que você vai
se guiar para descobrir onde mexer em quase toda task.

> Para conferir as regras sem clicar: `./backend/tests/smoke.sh` (com o stack no ar) exercita
> baixa de estoque em venda, restauração no void, rejeição de venda sem estoque, recebimento
> de pedido e dispensa.

---

## 3. As três partes do repositório

```
frontend/   telas que o cliente vê (HTML + Bootstrap CSS + JS vanilla, montado com Vite)
backend/    a API que faz o trabalho de verdade e fala com o banco (PHP puro + PostgreSQL)
design-system/   fonte da verdade visual (cores, tipos, regras de marca) — referência, não roda
```

Mentalmente: **frontend mostra e coleta; backend decide e guarda.** Nenhuma regra de negócio
de verdade mora no frontend — se o estoque pode ou não cair, quem decide é o backend.

---

## 4. O caminho de um clique (de ponta a ponta)

Vamos seguir UMA ação real: **dar entrada de estoque num remédio** (o "Receive stock" do
Inventory). Esse é o exemplo que vale a pena decorar, porque todo o resto é variação dele.

### 4a. No frontend

Toda tela do app segue o mesmo esqueleto. Quando a página carrega, `main.js` roda:

```
main.js  →  confere se tem login (auth.token); senão, manda pro login
         →  monta a casca (renderShell: menu lateral + topo)   [shell.js]
         →  chama bindPageBehaviors(pageId)                     [page-behaviors.js]
```

`pageId` vem do HTML: cada página tem `<body data-page="inventory">`. O `bindPageBehaviors`
olha esse id e chama a função certa (`bindInventory`, `bindPos`, ...). **Cada tela = uma
função `bindX` em `frontend/assets/js/page-behaviors.js`.** É o arquivo onde você vai passar a
maior parte do tempo no frontend.

Dentro de `bindInventory` o padrão é sempre o mesmo:
1. Pega elementos do HTML por atributo `data-...` (ex.: `[data-inventory-body]`).
2. `load()` chama a API (`api.medications()`), guarda o resultado numa variável local.
3. `render()` transforma esses dados em HTML (template string) e joga na tela.
4. Liga os eventos (clique na linha, no botão "Receive", etc.).
5. Uma ação do usuário → chama a API de novo → recarrega → re-renderiza.

O HTML (`frontend/pages/inventory.html`) é "burro": é só a estrutura com marcadores
`data-...` e `id="appSidebar"` vazios que o JS preenche. **Você liga JS ao HTML pelos atributos
`data-...`, não por classe de estilo.**

### 4b. A ponte: `api.js`

`frontend/assets/js/api.js` é o **único** lugar que fala com o backend. Ele tem o objeto `api`
com um método por endpoint:

```js
adjustStock: (id, delta, reason) =>
  request(`/api/medications/${id}/stock`, { method: "POST", body: { delta, reason } }),
```

Esse arquivo também: anexa o token de login em toda requisição, desembrulha o `{ data: ... }`
que o backend devolve, e se a resposta for erro joga um `ApiError` com a mensagem do servidor.
Se você precisa de um endpoint que ainda não existe aqui, **adicione um método neste objeto** —
não saia chamando `fetch` espalhado.

### 4c. No backend

A requisição `POST /api/medications/7/stock` entra por um ponto só e desce por camadas:

```
public/index.php  (porta de entrada: toda requisição passa aqui)
      ↓
routes/api.php    (tabela de rotas: casa URL+método com um [Controller, método])
      ↓
Controller        (fino: valida a entrada, devolve a resposta. NÃO decide regra)
      ↓
Service           (o cérebro: aqui mora a regra de negócio)
      ↓
Repository        (só SQL: lê e grava no PostgreSQL)
      ↓
PostgreSQL
```

Seguindo o nosso exemplo:

- **`routes/api.php`**: a linha
  `$r->post('/api/medications/{id}/stock', [MedicationController::class, 'adjustStock']);`
  diz qual método roda.
- **`MedicationController::adjustStock`**: valida que veio um `delta` inteiro e um `reason`
  opcional, e repassa pro service. Nada além disso.
- **`MedicationService::adjustStock`**: confere se o remédio existe e pede o ajuste. **É aqui
  que decisões de negócio acontecem.** Exemplo de regra deste service: o estoque nunca pode
  ficar negativo — se o ajuste empurraria pra baixo de zero, ele recusa com erro.
- **`MedicationRepository::adjustStock`**: roda o `UPDATE ... SET on_hand = on_hand + :delta
  WHERE ... AND on_hand + :delta >= 0`. Só SQL.

Uma regra deste projeto que aparece muito: **o "status" do estoque (In/Low/Out/Expiring...)
não é guardado no banco.** Ele é *calculado na hora da leitura*, em
`MedicationService::deriveStatus`, a partir de quantidade, ponto de reposição, validade e flag
de recall. Por isso nunca fica desatualizado — e por isso você nunca grava `status` no banco.

### 4d. O formato das respostas (combine com isso)

- Sucesso: `{ "data": ... }`. Criou algo → `201`. Apagou → `204` (sem corpo).
- Erro: `{ "error": { "status", "message", "fields?" } }`. Erro de validação/regra → `422`;
  não achou → `404`; método errado → `405`; sem/má autenticação → `401`.
- Dinheiro e quantidade são números; data é texto `YYYY-MM-DD`.

O `api.js` já entende esse contrato. Se você mudar o formato no backend, lembra que o frontend
conta com ele.

---

## 5. As regras que você NÃO pode quebrar

Estas são o coração do produto. Quase toda regressão grave é quebrar uma delas. (Detalhe em
`BUSINESS_RULES.md`.)

1. **Estoque nunca fica negativo.** Vender ou dispensar mais do que tem é recusado.
2. **Venda é tudo-ou-nada.** Uma venda com 3 itens onde 1 não tem estoque **falha inteira** —
   não baixa nada. Isso é feito dentro de uma transação (`Database::transaction`), veja
   `SaleService::create`.
3. **Preço vem do servidor, não do cliente.** Numa venda, o preço de cada item é lido do
   cadastro do remédio no backend (`SaleService::priceItems`). O frontend só calcula uma
   prévia; quem cobra é o servidor.
4. **Anular venda devolve o estoque** (`SaleService::void`), e não dá pra anular duas vezes.
5. **Receber pedido soma estoque uma vez só** — tem guarda contra receber em dobro.
6. **Dispensar receita baixa estoque** e segue o fluxo `new → verifying → ready → dispensed`.
7. **A prévia de imposto no POS** (`POS_TAX_RATE` em `page-behaviors.js`) tem que bater com o
   `TAX_RATE` do backend. Se mudar um, mude o outro.

---

## 6. Resolvendo uma task de BACKEND

Receita de bolo. Suponha a task: *"adicionar um campo `manufacturer` (fabricante) no remédio"*.

1. **Comece pela rota.** Abra `backend/routes/api.php` e ache o endpoint envolvido. Ele te dá
   o `[Controller, método]` exato. Se for um endpoint novo, registre a rota aqui.
2. **Controller** (`src/Controllers/...`): ajuste a validação da entrada
   (no `store`/`update` do `MedicationController`, adicione `'manufacturer' => 'nullable|string|max:120'`).
   O controller continua fino — não bote regra aqui.
3. **Service** (`src/Services/...`): se a task tem *decisão* ("só pode se...", "calcula a
   partir de...", "rejeita quando..."), é aqui. Para um campo simples, inclua-o no array que o
   service monta e no `present()` (a função que transforma a linha do banco na resposta da API).
4. **Repository** (`src/Repositories/...`): é onde o SQL vive. Adicione a coluna nas listas de
   colunas (`COLUMNS`), no `INSERT` e no `UPDATE`.
5. **Banco** (`backend/database/schema.sql`): adicione a coluna na tabela. ⚠️ Os scripts de
   `schema.sql`/`seed.sql` só rodam em **volume novo**. Depois de mexer no schema:
   `docker compose down -v && docker compose up -d --build` para recriar o banco.
6. **Teste pela API.** `curl http://localhost:8080/api/medications/1` ou rode
   `./backend/tests/smoke.sh`. Confira o formato `{ "data": ... }`.

Onde fica a lógica, em uma frase: **Controller = porta e tradução; Service = decisão;
Repository = SQL.** Errar a camada é o erro nº 1 de quem chega. Regra no controller ou SQL no
service vão passar no teste hoje e quebrar o projeto amanhã.

---

## 7. Resolvendo uma task de FRONTEND

Suponha: *"mostrar o fabricante na ficha do remédio no Inventory"*.

1. **Ache a tela** em `frontend/pages/` (`inventory.html`) e a função dela em
   `page-behaviors.js` (`bindInventory`). O `data-page` do `<body>` liga os dois.
2. **Dado já vem da API?** Olhe no DevTools → Network o JSON que `api.medications()` devolve.
   Se o campo não está lá, a task é (também) de backend — volte pra seção 6 primeiro.
3. **HTML**: adicione o marcador onde o valor vai aparecer, ex.: `<span data-detail="manufacturer"></span>`.
4. **JS**: na `bindInventory`, pegue o elemento por `data-...` e, no `renderDetail`, preencha
   com o campo do objeto (`m.manufacturer`). Siga o padrão das linhas vizinhas.
5. **Precisa de um endpoint novo?** Adicione um método no objeto `api` em `api.js` — não chame
   `fetch` direto na página.
6. **Visual**: respeite o design system. Os mais pegadinha:
   - Número, SKU, preço, data, quantidade → fonte **mono** (classe `.mono`), sempre.
   - Cor de marca (verde) só em área grande; o resto é neutro + cor de status.
   - Use `statusBadge`/`toneClass` (de `ui.js`/`api.js`) para os selinhos de estado — não
     invente cor na mão.
   - Datas pra humano via `formatDate` ("12 Aug 2026"). Sem emoji, sem gradiente.
7. **Atenção a duas pegadinhas deste projeto:**
   - Carrega só o **CSS** do Bootstrap, não o JS. Modal, toast, etc. são feitos à mão em
     `ui.js` (`openForm`, `toast`, `placeholder`). Não conte com componente JS do Bootstrap.
   - Página nova precisa ser registrada como entrada do Vite em `frontend/vite.config.mjs`,
     senão o build ignora.

Para rodar só o frontend em dev: `npm install` e `npm run dev` na raiz (sobe o backend antes:
`docker compose up -d api db`).

---

## 8. O mapa dos arquivos que você mais vai abrir

**Frontend** (`frontend/assets/js/`):
- `page-behaviors.js` — a lógica de cada tela (`bindDashboard`, `bindInventory`, `bindPos`...). **Seu lugar nº 1.**
- `api.js` — toda conversa com o backend + helpers (`currency`, `formatDate`, `toneClass`) + sessão/login.
- `shell.js` — menu lateral, topo, contadores, usuário logado e logout.
- `ui.js` — toast, modal de formulário, badge de status, placeholder (feitos à mão).
- `main.js` — o arranque (guarda de login + monta tudo). Raramente se mexe.
- `frontend/pages/*.html` — a estrutura de cada tela (marcadores `data-...`).

**Backend** (`backend/src/`):
- `routes/api.php` — o índice de "URL → código". **Comece sempre por aqui.**
- `Controllers/` — um por recurso. Validação + resposta.
- `Services/` — a regra de negócio. **Onde as decisões moram.**
- `Repositories/` — o SQL.
- `Core/` — encanamento (Router, Request, Response, Database, Validator). Você usa, raramente edita.
- `database/schema.sql` + `seed.sql` — tabelas e dados iniciais.

---

## 9. Antes de dizer "terminei"

- [ ] Subi o stack e **cliquei** no fluxo que mexi (não só "compila").
- [ ] Se mexi no estoque: testei o caminho feliz **e** o caso de falta de estoque.
- [ ] Não pus regra de negócio no controller nem no frontend.
- [ ] Se mudei schema, recriei o banco com `docker compose down -v`.
- [ ] Se mudei endpoint/rota/regra/tela/token/tabela: **atualizei `PROJECT_CONTEXT.md`** (e
      `BUSINESS_RULES.md` se a regra mudou) e a data no topo. Isto não é opcional neste repo.
- [ ] Visual segue o design system (mono para números, cores de status, sem emoji/gradiente).

Quando esses itens estão verdes, a task está pronta de verdade.
```
