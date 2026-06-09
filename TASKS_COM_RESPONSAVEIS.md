# Tasks com responsaveis

Baseado no `TASKS.md`, no guia colado para **Backend Dev #1** e na divisao de devs informada.

## Mapa de responsaveis

| Papel | Responsavel | Foco |
| --- | --- | --- |
| Backend Dev #1 | Nicolas | Auth middleware / proteger rotas autenticadas |
| Backend Dev #2 | Domareski | Proxima task backend dependente do auth |
| Backend Dev #5 | Gabriel Luis | Melhorias backend / tarefa backend posterior |
| Frontend Dev #1 | Leonardo | Primeira task frontend pendente |
| Frontend Dev #2 | Joao B | Segunda task frontend pendente |
| Frontend Dev #3 | Morozini | Terceira task frontend pendente |
| Frontend Dev #4 | A definir | Vitest + unit tests |

## Ja entregue na branch atual

## Controle de merge para `main`

| Branch | Assignee | Reviewer | Status |
| --- | --- | --- | --- |
| `feature/frontend-tests-xss-clean` | Frontend Dev #4 - A definir | licori12 | Mergeado na `main`; testes/build validados |
| `feature-add-eslint-and-prettier-configuration-with-documentation` | Frontend Dev #1 - Leonardo | licori12 | Mergeado na `main`; lint/test/build validados |
| `backend-dev-2-auth-router` | Backend Dev #2 - Domareski | licori12 | Mergeado na `main`; backend/auth, lint/test/build validados |

### Frontend Dev #4 - A definir

- [x] **Vitest + unit tests**
  - Branch: `feature/frontend-tests-xss-clean`.
  - Foram adicionados Vitest, jsdom, config e testes unitarios.
  - Testes atuais:
    - `frontend/assets/js/api.test.js`
    - `frontend/assets/js/ui.test.js`
    - `frontend/assets/js/sanitize.test.js`
  - Validacao:
    - `npm run test --workspace frontend -- --run`: 31 testes passaram.
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

## Backend

### Backend Dev #1 - Nicolas

- [ ] **Proteger rotas autenticadas com middleware**
  - Branch sugerida: `feature/backend-auth-middleware`.
  - Arquivos principais:
    - `backend/routes/api.php`
    - `backend/src/Core/Router.php`
    - `backend/src/Core/Request.php`
    - `backend/src/Core/Response.php`
    - novo arquivo sugerido: `backend/src/Core/Middleware/AuthMiddleware.php`
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

- [ ] **Rate limiting / protecao contra brute-force no login**
  - Branch sugerida: `feature/login-rate-limit`.
  - Arquivos:
    - `backend/src/Controllers/AuthController.php`
    - `backend/src/Services/AuthService.php`
  - Objetivo:
    - limitar tentativas por IP/email.
    - responder 429 ao estourar limite.

- [ ] **Logging estruturado de erros**
  - Branch sugerida: `feature/backend-error-logging`.
  - Arquivo:
    - `backend/src/Core/App.php`
  - Objetivo:
    - registrar excecoes 500 com mensagem, exception e trace.

- [ ] **Restringir CORS por configuracao**
  - Branch sugerida: `feature/configurable-cors`.
  - Arquivo:
    - `backend/src/Core/App.php`
  - Objetivo:
    - trocar `Access-Control-Allow-Origin: *` por allowlist via env.

- [ ] **Suite de testes automatizados no backend**
  - Branch sugerida: `feature/backend-tests`.
  - Arquivos:
    - `backend/composer.json`
    - `backend/tests/`
  - Objetivo:
    - adicionar PHPUnit.
    - cobrir `AuthService`, `MedicationService` e `Validator`.

## Frontend

### Frontend Dev #1 - Leonardo

- [ ] **Adicionar ESLint + Prettier**
  - Branch sugerida: `feature/frontend-lint-format`.
  - Arquivo:
    - `frontend/package.json`
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

- [ ] **Extrair helper reutilizavel de render de tabela**
  - Responsavel sugerido: Frontend Dev #4.
  - Branch sugerida: `feature/table-render-helper`.
  - Pode ser feito depois de paginacao para evitar retrabalho.

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

1. Nicolas: `feature/backend-auth-middleware`
2. Leonardo: `feature/frontend-lint-format`
3. Gabriel Luis: `feature/backend-error-logging` ou `feature/login-rate-limit`
4. Domareski: `feature/stock-adjustment-audit`
5. Joao B: `feature/frontend-token-expiry`
6. Morozini: `feature/topbar-global-search`
7. Frontend Dev #4: `feature/modal-focus-trap` + `feature/ui-aria-live`
8. Backend Dev #2 / Frontend Dev #2: paginacao backend e depois frontend
