# CA Pharmacy — Regras de Negócio

> **Propósito:** referência única das regras de negócio do sistema. A primeira parte
> documenta as regras **efetivamente implementadas** no código (extraídas de
> `backend/src/Services/*` e `backend/database/schema.sql`). A segunda parte reúne
> **regras adicionais recomendadas** para um software de farmácia, ainda não implementadas.
>
> ⚠️ Mantenha este arquivo sincronizado com o código, junto de
> [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md). Ao mudar uma regra de negócio, atualize aqui
> e marque o item como implementado/removido conforme o caso.
>
> Última atualização: 2026-06-08 (extração inicial das regras a partir do código).

---

## Parte 1 — Regras implementadas

### 1. Autenticação e acesso

- **RN-AUTH-01** — Login exige `email` válido e `password`; credenciais inválidas retornam
  401 com mensagem genérica (`Invalid email or password.`). A verificação roda um
  `password_verify` mesmo quando o usuário não existe, para **não vazar** quais e-mails estão
  cadastrados (proteção contra enumeração por tempo de resposta).
- **RN-AUTH-02** — A senha é guardada apenas como hash **bcrypt**; nunca em texto puro.
- **RN-AUTH-03** — O login emite um **bearer token** opaco (32 bytes aleatórios). No banco
  guarda-se somente o **SHA-256** do token, nunca o token em si.
- **RN-AUTH-04** — Cada requisição autenticada envia `Authorization: Bearer <token>`. A
  sessão é válida enquanto não expirar; sessão inexistente ou expirada retorna 401.
- **RN-AUTH-05** — A sessão expira após `AUTH_SESSION_TTL` segundos (padrão **12 horas**,
  mínimo de 60s). Logout apaga a linha da sessão e é idempotente.
- **RN-AUTH-06** — Papéis de usuário permitidos: `pharmacist`, `technician`, `admin`
  (constraint no banco). O e-mail é único.

> ⚠️ Observação: hoje o papel (`role`) é **armazenado mas não usado** para autorização —
> qualquer usuário autenticado acessa qualquer endpoint. Ver RN-PROP-01.

### 2. Medicamentos e controle de estoque

- **RN-MED-01** — O **SKU** é único. Criar ou atualizar um medicamento com SKU já existente
  é rejeitado (`A medication with SKU ... already exists.`).
- **RN-MED-02** — O **status de estoque nunca é armazenado** — é sempre derivado em tempo
  real a partir de `on_hand`, `reorder_point`, `expiry` e `recalled`, nesta ordem de
  prioridade:
  1. `recalled = true` → **Recalled** (recolhido)
  2. `expiry` no passado → **Expired** (vencido)
  3. `on_hand = 0` → **Out of stock** (sem estoque)
  4. `on_hand <= reorder_point` → **Low stock** (estoque baixo)
  5. `expiry` dentro de **90 dias** → **Expiring soon** (vencendo)
  6. caso contrário → **In stock**
- **RN-MED-03** — "Vencendo em breve" usa uma janela fixa de **90 dias** (`EXPIRY_SOON_DAYS`).
- **RN-MED-04** — O estoque (`on_hand`) **nunca pode ficar negativo** (constraint no banco +
  guarda na aplicação). Qualquer ajuste que levaria abaixo de zero é rejeitado.
- **RN-MED-05** — Ajuste manual de estoque aceita um **delta com sinal**: positivo entra
  (recebimento, correção), negativo sai (baixa, perda). Aceita um `reason` opcional.
- **RN-MED-06** — `price`, `on_hand` e `reorder_point` não podem ser negativos.
- **RN-MED-07** — Um medicamento pode ser marcado como **controlado** (`controlled`) e/ou
  **recolhido** (`recalled`).

### 3. Pacientes

- **RN-PAT-01** — O **código** do paciente (`code`) é único; gerado automaticamente como
  `PT-####` quando não informado.
- **RN-PAT-02** — As **medicações ativas** do paciente são derivadas das prescrições em
  estado `new`, `verifying` ou `ready` — nunca armazenadas, sempre refletem a realidade.
- **RN-PAT-03** — Alergias são uma lista (`allergies`), podendo estar vazia.
- **RN-PAT-04** — Um paciente referenciado por uma prescrição **não pode ser apagado**
  (`ON DELETE RESTRICT`).

### 4. Prescrições (pipeline de dispensação)

- **RN-RX-01** — Máquina de estados com transições restritas:
  - `new` → `verifying` ou `voided`
  - `verifying` → `ready` ou `voided`
  - `ready` → `dispensed` ou `voided`
  - `dispensed` e `voided` são **terminais** (nenhuma transição possível)

  Qualquer transição fora dessas é rejeitada (`Cannot move a prescription from 'X' to 'Y'.`).
- **RN-RX-02** — Criar prescrição exige paciente **e** medicamento existentes; a quantidade
  deve ser **> 0**. Toda prescrição nasce em `new`.
- **RN-RX-03** — Se o medicamento é **controlado** e nenhum `flag` foi informado, a prescrição
  é automaticamente marcada com `flag = controlled`. Flags possíveis: `controlled`,
  `interaction`, `allergy`.
- **RN-RX-04** — **Dispensar é o único passo que mexe no estoque.** Ao mover para `dispensed`,
  a quantidade é **subtraída** do `on_hand` do medicamento, **dentro de uma transação**. Se
  não há estoque suficiente, a dispensação é abortada e o estado **não** muda
  (`Cannot dispense N units — only M on hand.`). Estoque e estado nunca divergem.

### 5. Fornecedores e pedidos de compra (reposição)

- **RN-PO-01** — Máquina de estados do pedido de compra:
  - `draft` → `submitted` ou `cancelled`
  - `submitted` → `transit`, `received` ou `cancelled`
  - `transit` → `received` ou `cancelled`
  - `received` e `cancelled` são **terminais**
- **RN-PO-02** — Um pedido precisa de **ao menos 1 item**; cada item exige `medication_id`
  existente e `units > 0`.
- **RN-PO-03** — O **custo unitário** do item, se não informado, assume o `price` atual do
  medicamento.
- **RN-PO-04** — **Receber o pedido (`received`) é o que entra estoque:** soma as `units` de
  cada item ao `on_hand` do medicamento correspondente, dentro de uma transação. A operação é
  protegida para **não inflar o estoque duas vezes** (idempotente — `received` é terminal).
- **RN-PO-05** — O fornecedor de um pedido não pode ser apagado (`ON DELETE RESTRICT`).
- **RN-PO-06** — Códigos gerados automaticamente: `PO-####` por sequência.

### 6. Vendas (ponto de venda / PDV)

- **RN-SALE-01** — Uma venda precisa de **ao menos 1 item**; cada item exige medicamento
  existente e `quantity > 0`.
- **RN-SALE-02** — **O preço é sempre definido no servidor**, a partir do `price` do
  medicamento. O cliente **não** dita o valor cobrado (proteção contra adulteração).
- **RN-SALE-03** — Completar a venda **dá baixa no estoque** de cada item, **atomicamente**.
  Se qualquer linha vender mais do que há em estoque, **a venda inteira é rejeitada**
  (`insufficient stock`) — não há baixa parcial.
- **RN-SALE-04** — Imposto: `tax = subtotal × TAX_RATE` (padrão `TAX_RATE=0`, configurado
  como `0.05` no `compose.yaml`). `total = subtotal + tax`.
- **RN-SALE-05** — O paciente é **opcional** numa venda (venda de balcão sem cadastro).
- **RN-SALE-06** — Formas de pagamento permitidas: `cash`, `card`, `insurance`.
- **RN-SALE-07** — **Estornar (`void`) uma venda devolve o estoque** de cada item, dentro de
  uma transação. Estornar uma venda já estornada é rejeitado (`already been voided.`).

### 7. Dashboard (indicadores)

- **RN-DASH-01** — Agrega, em tempo real: vendas de hoje (total e contagem), fila de
  dispensação (`new` + `verifying` + `ready` = `open`), alertas de estoque baixo e de
  vencimento próximo, e a tendência de vendas dos últimos **7 dias**. Reaproveita a mesma
  lógica de status de estoque (não duplica regra).

### 8. Regras transversais

- **RN-GEN-01** — Toda operação que afeta estoque (dispensação, recebimento de PO, venda,
  estorno) roda em **transação** — ou tudo acontece, ou nada.
- **RN-GEN-02** — Dados derivados (status de estoque, medicações ativas do paciente) **nunca
  são persistidos**, evitando divergência com os números base.
- **RN-GEN-03** — `updated_at` é mantido automaticamente por trigger em todas as tabelas
  principais.

---

## Parte 2 — Regras adicionais recomendadas (não implementadas)

> Sugestões que fazem sentido para um software de farmácia real, em especial pela presença de
> **substâncias controladas** e exigências regulatórias. Priorizadas por relevância.

### Segurança e governança

- **RN-PROP-01 — Autorização por papel (RBAC).** Hoje o `role` existe mas não restringe nada.
  Recomendado: só `pharmacist`/`admin` dispensam e verificam prescrições; `technician` faz
  PDV e recebe pedidos; só `admin` cria/apaga usuários e ajusta estoque manualmente.
- **RN-PROP-02 — Trilha de auditoria (audit log).** Registrar quem fez cada ação sensível
  (dispensação, ajuste manual de estoque, estorno, recebimento de PO, alteração de preço),
  com usuário, timestamp e valores antes/depois. Hoje `adjustStock` recebe um `reason` mas
  **não o grava**.
- **RN-PROP-03 — Bloqueio após tentativas de login.** Limitar tentativas por IP/e-mail e
  aplicar rate limiting para frear ataques de força bruta.

### Substâncias controladas

- **RN-PROP-04 — Registro especial de controlados.** Dispensação de medicamento `controlled`
  deveria exigir dados extras (nº da receita, validade da prescrição, identificação do
  comprador) e gerar livro de registro, conforme a regulação local (ex.: Portaria 344/SVS no
  Brasil).
- **RN-PROP-05 — Validade da prescrição.** Receitas têm prazo de validade legal; recusar
  dispensação de prescrição vencida.
- **RN-PROP-06 — Limite de quantidade por dispensação** para controlados, conforme a classe
  da substância.

### Segurança do paciente

- **RN-PROP-07 — Checagem de alergia.** Ao criar/dispensar uma prescrição, cruzar o
  medicamento com a lista de `allergies` do paciente e bloquear/alertar. O flag `allergy` já
  existe no schema mas não é preenchido automaticamente.
- **RN-PROP-08 — Checagem de interação medicamentosa.** Cruzar com as outras medicações ativas
  do paciente. O flag `interaction` existe mas não é calculado.
- **RN-PROP-09 — Bloqueio de venda/dispensação de itens vencidos ou recolhidos.** Hoje o
  status `expired`/`recalled` é apenas exibido; nada impede vender um lote vencido. Recomendado
  rejeitar a baixa de estoque desses itens.

### Estoque e operação

- **RN-PROP-10 — Controle por lote e validade (FEFO).** Rastrear estoque por **lote**, com sua
  própria validade, e dispensar sempre o que **vence primeiro** (First-Expired-First-Out). Hoje
  há uma única `expiry` por medicamento.
- **RN-PROP-11 — Sugestão automática de reposição.** Gerar rascunho de pedido de compra quando
  `on_hand <= reorder_point`, agrupando por fornecedor.
- **RN-PROP-12 — Recebimento parcial de pedido.** Permitir receber só parte das unidades de um
  PO (entregas fracionadas), em vez do tudo-ou-nada atual.
- **RN-PROP-13 — Descarte/baixa rastreável.** Fluxo dedicado para baixa de vencidos/avariados
  com motivo obrigatório e registro (relacionado a RN-PROP-02).

### Financeiro e fiscal

- **RN-PROP-14 — Imposto por categoria/medicamento.** Hoje a alíquota é única e global; muitos
  medicamentos têm tratamento fiscal diferenciado (isentos, etc.).
- **RN-PROP-15 — Cobertura por plano/convênio.** O paciente tem `plan`, mas ele não afeta o
  preço. Recomendado aplicar copagamento/cobertura quando `payment_method = insurance`.
- **RN-PROP-16 — Fechamento de caixa.** Conciliação diária de vendas por forma de pagamento.

---

## Configurações que afetam regras

| Variável | Padrão | Efeito |
|---|---|---|
| `TAX_RATE` | `0` (compose: `0.05`) | Alíquota aplicada ao subtotal das vendas (RN-SALE-04) |
| `AUTH_SESSION_TTL` | `43200` (12h) | Tempo de vida da sessão/token (RN-AUTH-05) |
| `EXPIRY_SOON_DAYS` | `90` (constante no código) | Janela de "vencendo em breve" (RN-MED-03) |
