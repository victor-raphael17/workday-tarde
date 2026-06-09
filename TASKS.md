# TASKS

> Organizado em três frentes — **Tech lead**, **Frontend**, **Backend**. Dentro de cada uma,
> as tarefas estão agrupadas por natureza: 🔴 **Crítico** (corrigir primeiro), 🧹 **Limpeza**
> (código comprovadamente morto, remoção segura) e ✨ **Melhorias** (evolução/qualidade).
>
> Convenção de confiança: itens em **Limpeza** foram verificados sem call site → remoção segura.
> Itens de endpoint sem consumidor **não** são código morto — são features de UI ainda não
> construídas; decidir entre *construir a tela* ou *adiar*, não apagar por reflexo.

---

## Tech lead

Itens transversais (frontend + backend) e de processo.

- [ ] **Parâmetro `reason` do ajuste de estoque é coletado e descartado** (ponta a ponta)
  Coletado no form (`frontend/assets/js/page-behaviors.js:361`), enviado via
  `adjustStock(id, delta, reason)` (`frontend/assets/js/api.js:146`), validado em
  `backend/src/Controllers/MedicationController.php:88`, mas
  `backend/src/Services/MedicationService.php:112` recebe `?string $reason` e nunca o usa.
  Decidir: remover de ponta a ponta **ou** implementar audit log de movimentação de estoque.

- [ ] **Pipeline de CI (build + lint + testes)** — `.github/workflows/`
  Não há workflow algum (`ls .github/workflows` → inexistente). Adicionar CI que rode
  `npm run build`, o lint e os testes (frontend + backend) em cada push/PR. Depende dos itens
  de teste/lint listados nas seções Frontend e Backend.

---

## Frontend

### 🔴 Crítico

- [ ] **Escapar dados da API antes de injetar via `innerHTML` (XSS)** —
  `frontend/assets/js/page-behaviors.js`, `frontend/assets/js/shell.js`
  Várias telas montam HTML por template literal com `innerHTML` interpolando strings vindas da
  API (nomes de paciente/medicamento etc.) sem escape. Evidência:
  `grep -rn "escapeHtml\|sanitize" assets/js` → nenhum. Criar um `escapeHtml()` e aplicá-lo nos
  valores interpolados (ou usar `textContent`).

### 🧹 Limpeza (remoção segura — sem call site)

- [ ] Remover wrapper `api.medication` — `frontend/assets/js/api.js:140`
  Sem call site (`api.medication(` não aparece; os `rx.medication.*` são acesso a dado, não à
  função). Evidência: `grep -rn "api\.medication(" assets/js pages` → nada.

- [ ] Remover wrapper `api.categories` — `frontend/assets/js/api.js:144`
  Sem call site. Evidência: `grep -rn "\.categories(" assets/js pages` → só a definição.

- [ ] Remover wrapper `api.sales` — `frontend/assets/js/api.js:163`
  Sem call site. Evidência: `grep -rn "api\.sales(" assets/js pages` → só a definição.

- [ ] Remover wrapper `api.voidSale` — `frontend/assets/js/api.js:165`
  Sem call site. Evidência: `grep -rn "voidSale" assets/js pages` → só a definição.

  > ⚠️ **`api.me` NÃO entra aqui.** Apesar de hoje não ter call site, mantê-lo: é o mecanismo
  > natural para o item "Checar expiração do token proativamente" abaixo. Ver também o endpoint
  > `GET /api/auth/me` na seção Backend.

- [ ] **CSS potencialmente não usado** — `frontend/assets/css/app.css`
  Rodar PurgeCSS em dry-run (ou DevTools Coverage) cruzando com HTML + templates de
  `page-behaviors.js`/`shell.js`/`ui.js` **antes** de remover qualquer regra.

### ✨ Melhorias

- [ ] **Checar expiração do token proativamente** — `frontend/assets/js/api.js:36`
  O `auth` guarda `expires_at` mas nunca o verifica; a sessão só é descartada ao receber 401.
  Validar `expires_at` no route guard (`main.js:8`) e redirecionar ao login antes de uma
  requisição falhar. Pode usar `api.me()` para validar o token contra o servidor.

- [ ] **Implementar a busca global da topbar** — `frontend/assets/js/shell.js:64`
  O `<input type="search">` da topbar só recebe foco via tecla `/` (`shell.js:146`); não há
  handler que dispare busca. Evidência: `grep -rn "topbar-search" assets/js` → só markup + foco.
  Ligar a busca a medicamentos/pacientes/scripts ou remover o campo.

- [ ] **Ligar ou remover os botões decorativos da topbar** — `frontend/assets/js/shell.js:74`
  Botões "Notifications" (`bell`) e "Help" (`help-circle`) não têm listener. Evidência:
  `grep -rn "bell\|help-circle" assets/js` → só markup. Implementar a ação ou removê-los.

- [ ] **Paginação nas listagens** — `frontend/assets/js/page-behaviors.js`
  (`bindInventory`, `bindPatients`, vendas/pedidos)
  As tabelas renderizam todas as linhas de uma vez. Converge com a paginação do backend:
  consumir `?page=&per_page=` e adicionar controles de paginação.

- [ ] **Loading state e prevenção de duplo-submit nos forms** —
  `frontend/assets/js/page-behaviors.js`
  Botões "add"/"receive"/"pay" disparam ações assíncronas sem desabilitar o controle durante a
  requisição. Aplicar o padrão que o login já usa (`login.js:73`) para evitar envio duplicado.

- [ ] **Feedback de offline / retry de rede** — `frontend/assets/js/api.js:107`
  Em falha de rede o cliente lança `ApiError(0)` e a tela mostra o erro, mas sem opção de tentar
  de novo. Adicionar retry/botão "tentar novamente" e um indicador global de "API indisponível".

- [ ] **Focus trap nos modais** — `frontend/assets/js/ui.js:46`
  `openForm()` já trata Escape, clique fora e foca o primeiro campo, mas o Tab pode sair do modal
  (sem focus trap). Prender o foco dentro do `.modal-card` enquanto aberto.

- [ ] **`aria-live` nos toasts e estados** — `frontend/assets/js/ui.js:11`
  `toast()` insere mensagens sem região `aria-live`, então leitores de tela podem não anunciá-las.
  Adicionar `role="status"`/`aria-live="polite"` aos toasts e aos placeholders de erro.

- [ ] **Externalizar a identidade da filial** — `frontend/assets/js/data.js`,
  `frontend/assets/js/shell.js:21`
  `branch` (nome, `shiftLead`, `role`) é hardcoded em `data.js` e usado como fallback no shell.
  Buscar do backend (perfil/filial) em vez de constante no bundle.

- [ ] **Extrair helper de render de tabela reutilizável** — `frontend/assets/js/page-behaviors.js`
  O padrão "`tbody.innerHTML = lista.length ? linhas : placeholder`" se repete em
  inventory/patients/orders/sales. Extrair um helper único de render (linhas + estados
  loading/empty/error). Bom momento para centralizar o `escapeHtml()` do item crítico de XSS.

- [ ] **Adicionar testes ao frontend (Vitest)** — `frontend/package.json`
  Sem test runner e sem arquivos `*.test.js`/`*.spec.js`. Adicionar Vitest + jsdom e cobrir os
  helpers de `api.js` (`formatDate`, `initials`, `toneClass`, parsing do envelope/erro).

- [ ] **Adicionar ESLint + Prettier** — `frontend/package.json`
  Sem lint/format configurado. Adicionar para padronizar os ~1700 linhas de JS e pegar erros cedo.

---

## Backend

### 🔴 Crítico

- [ ] **Proteger as rotas autenticadas com middleware** — `backend/routes/api.php`,
  `backend/src/Core/Router.php`
  Hoje só `AuthController::me/logout` chamam `AuthService::authenticate()`; os demais endpoints
  (`/api/medications`, `/api/patients`, `/api/suppliers`, `/api/sales`, `/api/prescriptions`,
  `/api/purchase-orders`, `/api/dashboard`) respondem **sem bearer token** — o guard do frontend
  é apenas cosmético, qualquer um lê os dados via curl. Evidência:
  `grep -rn "authenticate" backend/src/Controllers/` → só `AuthController`. Adicionar checagem de
  auth no dispatch (rotas marcadas como protegidas) e exigir token nelas.

### 🧹 Limpeza (remoção segura — sem call site)

- [ ] Remover `Env::int()` — `backend/src/Support/Env.php:37`
  Método público nunca chamado. A config usa `Env::get()`/`Env::bool()` (`config/config.php`); o
  TTL de sessão é lido via `(int) Env::get(...)`, não via `Env::int()`. Evidência:
  `grep -rn "Env::int\|->int(" backend/` → nenhum call site.

- [ ] Remover `SessionRepository::purgeExpired()` — `backend/src/Repositories/SessionRepository.php:56`
  Nunca chamado; a expiração já é tratada na leitura por `findValid()`. Evidência:
  `grep -rn "purgeExpired" backend/` → só a definição.

### 🧩 Endpoints sem consumidor de UI — construir a tela ou adiar

> **Não são código morto.** São uma superfície REST coerente que o frontend (MVP) ainda não
> consome. Para cada um, decidir: construir a tela correspondente **ou** marcar explicitamente
> como adiado. Evitar apagar só porque a UI está incompleta.

- [ ] `GET /api/medications/{id}` — `backend/routes/api.php`
  Sem consumidor. Tela natural: detalhe de medicamento (espelha o `api.patient(id)` que já existe).

- [ ] `GET /api/medications/categories` — `backend/routes/api.php`
  Sem consumidor. Útil para popular filtros de categoria no inventário.

- [ ] `GET /api/medications/low-stock` e `GET /api/medications/expiring` — `backend/routes/api.php`
  Sem consumidor (o dashboard já devolve essas listas inline). Decidir se viram telas próprias.

- [ ] `PUT/PATCH/DELETE /api/medications/{id}` — `backend/routes/api.php`
  Sem consumidor. Feature natural: edição/remoção de medicamento (tela de admin).

- [ ] `GET /api/auth/me` — `backend/routes/api.php`
  Sem consumidor hoje, mas **manter**: é o mecanismo do item de frontend "Checar expiração do
  token proativamente". Wirar quando esse item for feito.

- [ ] `PUT/PATCH/DELETE /api/patients/{id}` — `backend/routes/api.php`
  Sem consumidor. Feature natural: edição/remoção de paciente.

- [ ] CRUD de fornecedores (store/show/update/delete) — `backend/routes/api.php`
  Apenas `GET /api/suppliers` é usado; o restante não tem wrapper nem tela. Construir gestão de
  fornecedores ou adiar.

- [ ] `GET /api/sales`, `GET /api/sales/{id}`, `POST /api/sales/{id}/void` — `backend/routes/api.php`
  Sem consumidor. Feature natural: histórico de vendas + estorno na tela de POS.

### ✨ Melhorias

- [ ] **Rate limiting / proteção contra brute-force no login** —
  `backend/src/Controllers/AuthController.php`, `backend/src/Services/AuthService.php:33`
  `POST /api/auth/login` não limita tentativas. Adicionar throttle por IP/email (contador em
  tabela ou cache) e responder 429 ao estourar o limite.

- [ ] **Paginação nos endpoints de listagem** — `backend/src/Repositories/` (ex.:
  `MedicationRepository`, `PatientRepository`, `SaleRepository`)
  As queries de `index` retornam todas as linhas (sem `LIMIT`/`OFFSET`). Evidência:
  `grep -rn "LIMIT" backend/src/Repositories/` → nenhum. Adicionar `?page=&per_page=` com limite
  padrão e devolver metadados de paginação. Converge com a paginação do frontend.

- [ ] **Logging estruturado de erros** — `backend/src/Core/App.php:58`
  `serverError()` monta a resposta 500 mas não registra a exceção em lugar nenhum
  (`grep -rn "error_log\|Logger" backend/src/` → nada). Logar `message`/`exception`/`trace`
  (arquivo ou stderr) para depuração em produção, onde `debug=false` oculta o erro.

- [ ] **Suite de testes automatizados** — `backend/tests/`
  Só existe `smoke.sh` (curl end-to-end); sem testes unitários e sem PHPUnit no `composer.json`.
  Adicionar PHPUnit como dev-dependency e cobrir `AuthService`, `MedicationService` (incl.
  `adjustStock`) e o `Validator`.

- [ ] **Restringir CORS por configuração** — `backend/src/Core/App.php:79`
  `Access-Control-Allow-Origin: *` está fixo no código. Ler a origem permitida de env
  (`CORS_ALLOWED_ORIGINS`) e ecoar só origens da allowlist, em vez do curinga.
