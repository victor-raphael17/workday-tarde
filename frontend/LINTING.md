# 📑 Documentação de Linting e Formatação (Frontend)

Esta documentação descreve a arquitetura de qualidade de código aplicada no diretório `frontend`, utilizando as versões e padrões mais recentes de mercado.

---

## 🛠️ Decisões de Arquitetura e Adaptações

- **ESLint v10 (Flat Config):** Devido às atualizações da versão instalada, o arquivo legado `.eslintrc.json` foi substituído pela nova estrutura oficial `eslint.config.js`, garantindo suporte a módulos nativos do JavaScript (ESM) e melhor performance de checagem.
- **Resolução de Escopo em Monorepo:** Como os binários estão localizados na raiz do projeto, as dependências core (`@eslint/js` e `globals`) foram mapeadas estrategicamente para garantir que o linter consiga validar a pasta isolada do frontend sem misturar escopos com o backend.

---

## ⚙️ Regras Estritas Aplicadas

As seguintes regras foram configuradas no objeto de inspeção para mitigar bugs em tempo de desenvolvimento:

- **`eslint:recommended`:** Ativa a base de regras recomendada pelo time do ESLint para capturar erros de sintaxe graves e comportamentos inesperados.
- **`plugin:prettier/recommended`:** Integra o Prettier diretamente ao fluxo do ESLint. Isso faz com que erros de estilização visual (espaçamentos, quebras de linha incorretas) apareçam como erros de linter, forçando a consistência visual.
- **`eqeqeq` (`error`):** Obriga o uso de comparação estrita (`===` e `!==`). Isso evita bugs silenciosos causados pela coerção de tipos implícita do JavaScript (ex: `5 == "5"` resulta em verdadeiro, o que pode quebrar lógicas de negócio).
- **`curly` (`error`):** Exige o uso obrigatório de chaves `{}` em todas as estruturas de controle (`if`, `else`, `for`, `while`). Isso impede falhas de escopo quando novas linhas são adicionadas ao bloco de código.
- **`no-unused-vars` (`error`):** Proíbe variáveis que foram declaradas mas nunca utilizadas.
  - _Customização:_ Configuramos as propriedades `argsIgnorePattern: '^_'` e `caughtErrorsIgnorePattern: '^_'`. Isso permite que variáveis obrigatórias por arquitetura (como no parâmetro de um bloco `catch (_error)`) sejam mantidas no código desde que comecem com underline, limpando o escopo sem quebrar a segurança da aplicação.
- **`no-console` (`warn`):** Alerta o desenvolvedor sobre `console.log` esquecidos no código de produção, permitindo de forma limpa apenas `console.warn` e `console.error` para logs críticos.

---

## 🚀 Ambientes Injetados (Globals)

Para evitar falsos positivos de variáveis globais não declaradas (`no-undef`), o arquivo de configuração injeta explicitamente os ambientes:

- **`globals.browser`:** Libera variáveis nativas do navegador como `fetch`, `URLSearchParams`, `HTMLElement`, `requestAnimationFrame` e `setTimeout`.
- **`globals.node`:** Libera variáveis do ecossistema Node.js necessárias para os scripts de build do Vite (ex: `__dirname`).

---

## 📌 Comandos de Utilização (Executados a partir da raiz)

Para rodar a checagem que valida o critério de aceitação, utilize o atalho de binários locais através do terminal Git Bash:

### Para formatar e corrigir problemas automaticamente:

```bash
./node_modules/.bin/eslint.cmd frontend/ --fix
```

Para apenas checar o status (Modo CI/CD - Deve rodar limpo):

```bash
./node_modules/.bin/eslint.cmd frontend/
```
