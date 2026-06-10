# Tasks com responsaveis

Baseado no `TASKS.md`, no guia colado para **Backend Dev #1** e na divisao de devs informada.

Atualizado conforme `main` em 2026-06-10.

## Mapa de responsaveis

| Papel | Responsavel | Foco |
| --- | --- | --- |
| Backend Dev #1 | Nicolas | Auth middleware / proteger rotas autenticadas |
| Backend Dev #2 | Domareski | Proxima task backend dependente do auth |
| Backend Dev #5 | Gabriel Luis | Rate limiting concluido / melhorias backend restantes |
| Frontend Dev #1 | Leonardo | Primeira task frontend pendente |
| Frontend Dev #2 | Joao B | Segunda task frontend pendente |
| Frontend Dev #3 | Morozini | Terceira task frontend pendente |
| Frontend Dev #4 | A definir | Focus trap / aria-live / form loading |

## Ja entregue na branch atual

## Controle de merge para `main`

| Branch | Assignee | Reviewer | Status |
| --- | --- | --- | --- |
| `feature/frontend-tests-xss-clean` | Frontend Dev #4 - A definir | licori12 | Mergeado na `main`; testes/build validados |
| `feature-add-eslint-and-prettier-configuration-with-documentation` | Frontend Dev #1 - Leonardo | licori12 | Mergeado na `main`; lint/test/build validados |
| `backend-dev-2-auth-router` | Backend Dev #2 - Domareski | licori12 | Mergeado na `main`; backend/auth, lint/test/build validados |
| `feature-rate-limit` | Backend Dev #5 - Gabriel Luis | licori12 | Mergeado na `main`; rate limiting implementado e smoke 20/20 com 429 validado |

### Backend Dev #1 - Nicolas

- [x] **Proteger rotas autenticadas com middleware**
  - Branch integrada: `backend-dev-2-auth-router`.
  - Arquivos principais:
    - `backend/routes/api.php`
    - `backend/src/Core/Middleware/AuthMiddleware.php`
    - `backend/src/Core/Router.php`
    - `backend/src/Core/Request.php`
    - `backend/src/Core/RequestInterface.php`
    - `backend/src/Core/Response.php`
    - `backend/src/Services/AuthServiceInterface.php`
    - `backend/tests/Middleware/AuthMiddlewareTest.php`
  - Resultado:
    - rotas protegidas usam `AuthMiddleware`.
    - login permanece publico.
    - token ausente/invalido retorna 401.

### Backend Dev #5 - Gabriel Luis

- [x] **Rate limiting / protecao contra brute-force no login**
  - Branch integrada: `feature-rate-limit`.
  - Arquivos principais:
    - `backend/src/Support/RateLimit.php`
    - `backend/src/Controllers/AuthController.php`
    - `backend/src/Core/Response.php`
    - `backend/tests/smoke.sh`
  - Resultado:
    - login limitado a 5 tentativas falhadas por 5 minutos por email.
    - 6a tentativa falhada retorna 429.
    - tentativas bloqueadas geram log.
    - `Response::tooManyRequests()` foi adicionado.
    - `backend/tests/smoke.sh` cobre 5 tentativas invalidas com 401 e a 6a com 429.

### Frontend Dev #4 - A definir

- [x] **Vitest + unit tests**
  - Branch: `feature/frontend-tests-xss-clean`.
  - Foram adicionados Vitest, jsdom, config e testes unitarios.
  - Testes atuais:
    - `frontend/assets/js/api.test.js`
    - `frontend/assets/js/ui.test.js`
    - `frontend/assets/js/sanitize.test.js`
  - Validacao:
    - `npm run test --workspace frontend -- --run`: 34 testes passaram.
    - `npm run build`: passou.
  - Pendencia pequena:
    - adicionar testes diretos para parsing do envelope de sucesso/erro em `api.js`.

- [x] **XSS sanitizer aplicado**
  - Branch: `feature/frontend-tests-xss-clean`.
  - Arquivo novo: `frontend/assets/js/sanitize.js`.
  - Aplicado em:
    - `frontend/assets/js/page-behaviors.js`
    - `frontend/assets/js/shell.js`
    - `frontend/assets/js/ui.js`

### Frontend Dev #1 - Leonardo

- [x] **Adicionar ESLint + Prettier**
  - Branch integrada: `feature-add-eslint-and-prettier-configuration-with-documentation`.
  - Arquivos principais:
    - `frontend/eslint.config.js`
    - `frontend/.prettierrc`
    - `frontend/LINTING.md`
    - `frontend/package.json`
    - `package.json`
    - `package-lock.json`
  - Resultado:
    - scripts de lint, formatacao e checagem foram adicionados.
    - documentacao de lint foi adicionada em `frontend/LINTING.md`.

## Backend

### Backend Dev #1 - Nicolas

- [x] **Proteger rotas autenticadas com middleware**
  - Branch integrada: `backend-dev-2-auth-router`.
  - Arquivos principais:
    - `backend/routes/api.php`
    - `backend/src/Core/Router.php`
    - `backend/src/Core/Request.php`
    - `backend/src/Core/Response.php`
    - `backend/src/Core/Middleware/AuthMiddleware.php`
  - Objetivo:
    - exigir bearer token em endpoints protegidos.
    - manter login publico.
    - retornar 401 quando token estiver ausente ou invalido.
  - Observacao:
    - esta task desbloqueia varias tarefas backend futuras.

### Backend Dev #2 - Domareski

- [ ] **Resolver o parametro `reason` do ajuste de estoque**
  - Branch sugerida: `feature/stock-adjustment-audit`.
  - Arquivos envolvidos:
    - `frontend/assets/js/page-behaviors.js`
    - `frontend/assets/js/api.js`
    - `backend/src/Controllers/MedicationController.php`
    - `backend/src/Services/MedicationService.php`
  - Decisao tecnica:
    - implementar audit log de movimentacao de estoque; ou
    - remover `reason` de ponta a ponta.
  - Recomendacao:
    - implementar audit log, porque o motivo do ajuste e informacao util para farmacia.

- [ ] **Paginacao nos endpoints de listagem**
  - Branch sugerida: `feature/backend-pagination`.
  - Arquivos:
    - `backend/src/Repositories/MedicationRepository.php`
    - `backend/src/Repositories/PatientRepository.php`
    - `backend/src/Repositories/SaleRepository.php`
    - outros repositories com listagem.
  - Objetivo:
    - aceitar `?page=&per_page=`.
    - devolver metadados de paginacao.

### Backend Dev #5 - Gabriel Luis

- [x] **Rate limiting / protecao contra brute-force no login**
  - Branch integrada: `feature-rate-limit`.
  - Arquivos:
    - `backend/src/Controllers/AuthController.php`
    - `backend/src/Support/RateLimit.php`
    - `backend/src/Core/Response.php`
    - `backend/tests/smoke.sh`
  - Objetivo:
    - limitar tentativas por email.
    - responder 429 ao estourar limite.
    - manter cobertura no smoke test para 5 falhas seguidas de 429 na 6a tentativa.
  - Validacao:
    - `API=http://localhost:8080 bash backend/tests/smoke.sh`: 20 passed, 0 failed.

- [ ] **Logging estruturado de erros**
  - Branch sugerida: `feature/backend-error-logging`.
  - Arquivo:
    - `backend/src/Core/App.php`
  - Objetivo:
    - registrar excecoes 500 com mensagem, exception e trace.

- [x] **Restringir CORS por configuracao**
  - Branch: `feature/configurable-cors`.
  - Arquivos:
    - `backend/config/config.php`
    - `backend/src/Core/App.php`
    - `backend/.env.example`
    - `compose.yaml`
  - Objetivo:
    - trocar `Access-Control-Allow-Origin: *` por allowlist via env.
    - usar `CORS_ALLOWED_ORIGINS` como configuracao documentada.
  - Resultado:
    - origens permitidas recebem `Access-Control-Allow-Origin`.
    - origens nao permitidas nao recebem o header de liberacao.
  - Validacao:
    - origem permitida `http://localhost:4173`: header CORS retornado.
    - origem nao permitida `http://evil.test`: header CORS omitido.
    - preflight `OPTIONS`: 204 com header para origem permitida.
    - `API=http://localhost:8080 bash backend/tests/smoke.sh`: 20 passed, 0 failed.

- [ ] **Suite de testes automatizados no backend**
  - Branch sugerida: `feature/backend-tests`.
  - Arquivos:
    - `backend/composer.json`
    - `backend/tests/`
  - Objetivo:
    - expandir a suite PHPUnit ja configurada no `composer.json`.
    - cobrir `AuthService`, `MedicationService` e `Validator`.
    - documentar a execucao dos testes backend.

## Frontend

### Frontend Dev #1 - Leonardo

- [x] **Adicionar ESLint + Prettier**
  - Branch integrada: `feature-add-eslint-and-prettier-configuration-with-documentation`.
  - Arquivo:
    - `frontend/package.json`
    - `frontend/eslint.config.js`
    - `frontend/.prettierrc`
    - `frontend/LINTING.md`
  - Objetivo:
    - padronizar JS.
    - preparar o projeto para CI.

- [ ] **Completar cobertura de testes do frontend**
  - Branch sugerida: `feature/frontend-api-tests`.
  - Arquivo:
    - `frontend/assets/js/api.test.js`
  - Objetivo:
    - testar parsing do envelope de sucesso.
    - testar parsing de erro da API.

### Frontend Dev #2 - Joao B

- [ ] **Checar expiracao do token proativamente**
  - Branch sugerida: `feature/frontend-token-expiry`.
  - Arquivos:
    - `frontend/assets/js/api.js`
    - `frontend/assets/js/main.js`
  - Objetivo:
    - usar `expires_at`.
    - chamar `api.me()` quando fizer sentido.
    - redirecionar antes de uma requisicao falhar.

- [ ] **Feedback de offline / retry de rede**
  - Branch sugerida: `feature/frontend-network-retry`.
  - Arquivo:
    - `frontend/assets/js/api.js`
  - Objetivo:
    - melhorar tratamento de `ApiError(0)`.
    - adicionar retry ou indicador global de API indisponivel.

### Frontend Dev #3 - Morozini

- [ ] **Implementar busca global da topbar**
  - Branch sugerida: `feature/topbar-global-search`.
  - Arquivo:
    - `frontend/assets/js/shell.js`
  - Objetivo:
    - fazer o input da topbar buscar medicamentos, pacientes ou prescricoes.

- [ ] **Ligar ou remover botoes decorativos da topbar**
  - Branch sugerida: `feature/topbar-actions`.
  - Arquivo:
    - `frontend/assets/js/shell.js`
  - Botoes:
    - Notifications.
    - Help.

- [ ] **Externalizar identidade da filial**
  - Branch sugerida: `feature/branch-identity-api`.
  - Arquivos:
    - `frontend/assets/js/data.js`
    - `frontend/assets/js/shell.js`
  - Objetivo:
    - remover dados hardcoded da filial do bundle.

### Frontend Dev #4 - A definir

- [ ] **Focus trap nos modais**
  - Branch sugerida: `feature/modal-focus-trap`.
  - Arquivo:
    - `frontend/assets/js/ui.js`
  - Objetivo:
    - impedir Tab de sair da `.modal-card`.
  - Deve incluir teste unitario.

- [ ] **`aria-live` nos toasts e estados**
  - Branch sugerida: `feature/ui-aria-live`.
  - Arquivo:
    - `frontend/assets/js/ui.js`
  - Objetivo:
    - adicionar `role="status"` e `aria-live="polite"`.
  - Deve incluir teste unitario.

- [ ] **Loading state e prevencao de duplo-submit nos forms**
  - Branch sugerida: `feature/form-loading-state`.
  - Arquivo:
    - `frontend/assets/js/page-behaviors.js`
  - Objetivo:
    - desabilitar botoes enquanto a acao async roda.
  - Deve incluir teste unitario quando viavel.

## Tasks compartilhadas ou para decidir depois

- [ ] **Pipeline de CI**
  - Responsavel sugerido: Tech lead ou dupla Frontend Dev #1 + Backend Dev #5.
  - Branch sugerida: `feature/ci-pipeline`.
  - Depende de:
    - ESLint/Prettier.
    - testes frontend.
    - decisao sobre testes backend.

- [ ] **Paginar listagens no frontend**
  - Responsavel sugerido: Frontend Dev #2 ou Frontend Dev #3.
  - Branch sugerida: `feature/frontend-pagination`.
  - Depende idealmente de:
    - `feature/backend-pagination`.

- [x] **Extrair helper reutilizavel de render de tabela**
  - Responsavel sugerido: Frontend Dev #4.
  - Branch: `feature/table-render-helper`.
  - Arquivos:
    - `frontend/assets/js/ui.js`
    - `frontend/assets/js/page-behaviors.js`
    - `frontend/assets/js/ui.test.js`
  - Resultado:
    - `renderTableState` centraliza loading/erro em tabelas.
    - `renderTableRows` centraliza renderizacao de linhas e estado vazio.
    - Inventario, pacientes e pedidos passaram a usar o helper.

- [ ] **Limpeza de wrappers sem uso em `api.js`**
  - Responsavel sugerido: Frontend Dev #1.
  - Branch sugerida: `chore/frontend-api-cleanup`.
  - Wrappers:
    - `api.medication`
    - `api.categories`
    - `api.sales`
    - `api.voidSale`
  - Observacao:
    - nao remover `api.me`.

- [ ] **CSS potencialmente nao usado**
  - Responsavel sugerido: Frontend Dev #1.
  - Branch sugerida: `chore/frontend-css-coverage`.
  - Primeiro rodar PurgeCSS dry-run ou DevTools Coverage.

- [ ] **Endpoints sem consumidor de UI**
  - Responsavel sugerido: Tech lead decide escopo antes de atribuir.
  - Decidir para cada endpoint:
    - construir UI; ou
    - marcar como adiado.

## Ordem sugerida de execucao

1. Gabriel Luis: `feature/backend-error-logging`
2. Domareski: `feature/stock-adjustment-audit`
3. Joao B: `feature/frontend-token-expiry`
4. Morozini: `feature/topbar-global-search`
5. Frontend Dev #4: `feature/modal-focus-trap` + `feature/ui-aria-live`
6. Backend Dev #2 / Frontend Dev #2: paginacao backend e depois frontend
7. Frontend Dev #1: `feature/frontend-api-tests`
8. Tech lead ou dupla Frontend Dev #1 + Backend Dev #5: `feature/ci-pipeline`
