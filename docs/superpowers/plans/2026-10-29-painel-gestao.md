# Painel da gestão (/gestao) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um painel regional em `/gestao` onde a gestão publica Alertas a partir de Modelos de alerta já traduzidos, encerra Alertas ativos, vê o Alcance e o Tempo até chegar de cada Alerta e o número de Estabelecimentos com Selo e Cadastur, além de zerar a demo.

**Architecture:** Acréscimos no contrato de dados (`tipos.ts` e `repositorio.ts`): Sessões abertas e Entregas passam a viver no mesmo estado `costa-cacau:estado` do localStorage, sincronizado por BroadcastChannel. O painel é um client component que lê tudo pelo repositório, recalcula a cada mudança e faz as contas do Alcance numa função pura em `components/gestao/alcance.ts`. A tela do turista grava as Entregas chamando `registrarPresenca`, numa tarefa separada que é do David.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, Tailwind com os tokens de `globals.css`, `lucide-react` para ícones (já instalado).

**Spec:** `docs/adr/0001-selo-booleano.md`, `docs/adr/0002-alcance-por-entrega-registrada.md`, `docs/adr/0003-alertas-da-gestao-por-modelos-traduzidos.md` e `docs/GLOSSARY.md`. Contexto em `CLAUDE.md` §8 e §11; regras da dupla em `AGENTS.md`.

## Global Constraints

- Dados mocados, decisão fechada: estado em localStorage + BroadcastChannel, via `web/src/data/repositorio.ts`. Sem Supabase, sem backend, sem dependência nova no `package.json`.
- Contratos compartilhados (AGENTS.md §2), que são `tipos.ts`, `repositorio.ts`, `seed.ts`, `i18n/textos.ts` e `globals.css`, aceitam SÓ ACRÉSCIMOS. Não renomeie, não remova, não mude assinatura nem comportamento do que já existe. O tipo `Entrega`, o método `registrarPresenca` e o `limparSessoes()` são acréscimos e estão liberados pelos ADRs.
- O /gestao é painel de operador: textos só em português, guardados no próprio componente, igual à Central. NÃO use `useIdioma().t(...)`, que é só para o que o turista lê.
- Estilos novos com escopo de classe (ex.: `.painel-gestao ...`), como já faz o `html.pagina-chat`. Não toque nos tokens de `:root`.
- Cores pelos tokens de `globals.css`. Dados de exemplo fictícios, nomes inventados.
- Nenhuma tela importa `seed.ts`; dados sempre pelo `Repositorio` (AGENTS.md §5).
- Vocabulário do `docs/GLOSSARY.md` em nomes e textos de tela (Estabelecimento, Selo, Alerta, Modelo de alerta, Sessão, Entrega, Alcance, Tempo até chegar), respeitando os _Avoid_: nada de "notificação", "template", "usuário", "engajamento", "latência".
- Não editar `components/turista/`, `components/central/`, `components/chat/`, `lib/agente/` nem `app/ensaio/` (área do David).
- Sem framework de teste: cada tarefa se verifica com `cd web && npx tsc --noEmit` e um passo concreto no navegador. Não instale runner de teste.
- Todos os passos de navegador usam abas do **mesmo** navegador, com `npm run dev` rodando em `web/`, porque o mock só sincroniza entre abas (AGENTS.md §6).

## Review Focus

1. **Laço entre abas:** `registrarPresenca` é chamado de dentro do `aoMudarAlertas` da tela do turista, e qualquer gravação notifica todas as abas. Se ele gravar sem ter mudado nada, as abas entram em laço infinito de BroadcastChannel. Esperado: chamada repetida com os mesmos dados não grava nem notifica. O teste fica na Task 2, passo 4.
2. **Abas que se sobrescrevem:** quando um Alerta é publicado, todas as abas de turista gravam a sua Entrega ao mesmo tempo. Cada aba guarda uma cópia do estado, então uma pode apagar a Entrega da outra. Esperado: com 3 abas, o painel mostra 3 Entregas, não 1. `registrarPresenca` relê o localStorage antes de gravar. O teste fica na Task 6, passo 3.
3. **Zero Sessões:** antes da integração do David, ou depois de "Zerar demo", não existe nenhuma Sessão. Esperado: o Alerta mostra "Nenhuma Sessão aberta hoje em Itacaré" e o Tempo até chegar "—", sem `NaN`, `Infinity` ou "0%". O teste fica na Task 4, passo 3.
4. **Sessão aberta depois da publicação:** uma aba aberta 10 minutos depois do Alerta recebe a Entrega na hora em que carrega. Esperado: ela conta para o Alcance, mas não para o Tempo até chegar, que senão mostraria "10 min" para uma entrega instantânea. O teste fica na Task 4, passo 3.
5. **Estado antigo no localStorage:** quem já usou a demo tem um `costa-cacau:estado` sem `sessoes` e sem `entregas`. Esperado: `/gestao`, `/` e `/ensaio` abrem normalmente, sem erro no console. O teste fica na Task 1, passo 3.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `web/src/data/tipos.ts` (acréscimo) | tipos `Entrega`, `SessaoAberta`, `SessoesEEntregas` |
| `web/src/data/repositorio.ts` (acréscimo) | estado com `sessoes` e `entregas`; `registrarPresenca`, `sessoesEEntregas`, `aoMudarSessoesEEntregas`, `encerrarAlerta`, `limparSessoes` |
| `web/src/app/gestao/page.tsx` (novo) | rota e `metadata` |
| `web/src/components/gestao/AppGestao.tsx` (novo) | segura o repositório, carrega e assina os dados, monta as seções |
| `web/src/components/gestao/modelos.ts` (novo) | catálogo de Modelos de alerta e `criarAlerta` |
| `web/src/components/gestao/PublicarAlerta.tsx` (novo) | formulário de praia + Modelo de alerta |
| `web/src/components/gestao/AlertasAtivos.tsx` (novo) | lista de Alertas ativos, encerrar, Alcance de cada um |
| `web/src/components/gestao/alcance.ts` (novo) | contas puras do Alcance e do Tempo até chegar |
| `web/src/components/gestao/Trade.tsx` (novo) | Estabelecimentos com Selo, com Cadastur, em formalização |

Não há mudança em `globals.css`: os tokens já estão expostos como cores do Tailwind (`bg-danger`, `text-ink-2`, `bg-surface`…). O contêiner raiz leva a classe `painel-gestao` para servir de escopo, caso algum estilo próprio venha a ser necessário.

---

### Task 1: Contrato de dados (Sessões abertas, Entregas, encerrar Alerta)

**Files:**
- Modify: `web/src/data/tipos.ts` (acrescentar ao fim do arquivo)
- Modify: `web/src/data/repositorio.ts` (acrescentar na interface `Repositorio`, na interface `Ensaio`, no tipo `Estado` e no objeto do mock)

**Interfaces:**
- Produces (em `tipos.ts`):
  ```ts
  /** Registro de que um Alerta apareceu na tela de uma Sessão aberta. */
  export type Entrega = { alertaId: string; sessaoId: string; idioma: Idioma; em: string };
  /** Sessão gravada pela tela do turista, com o município dela e quando abriu. */
  export type SessaoAberta = Sessao & { municipioId: string; abertaEm: string };
  export type SessoesEEntregas = { sessoes: SessaoAberta[]; entregas: Entrega[] };
  ```
- Produces (em `Repositorio`):
  ```ts
  /** grava a Sessão (se nova) e uma Entrega por Alerta ainda não entregue a ela; sem novidade, não grava nem avisa */
  registrarPresenca(sessao: Sessao, municipioId: string, alertaIds: string[], idioma: Idioma): Promise<void>;
  sessoesEEntregas(): Promise<SessoesEEntregas>;
  aoMudarSessoesEEntregas(cb: (d: SessoesEEntregas) => void): () => void;
  /** tira o Alerta dos ativos agora (validoAte = agora); ele continua no estado */
  encerrarAlerta(id: string): Promise<void>;
  ```
- Produces (em `Ensaio`): `limparSessoes(): void`, que zera `sessoes` e `entregas` e não mexe em alertas nem chamados.

- [ ] **Step 1: Criar a branch e implementar**

  `git switch -c cibelle/painel-gestao` a partir da `plataformaWeb` atualizada.

  Em `repositorio.ts`, o tipo interno vira `type Estado = { alertas: Alerta[]; chamados: ChamadoSOS[]; sessoes?: SessaoAberta[]; entregas?: Entrega[] }`. Os dois campos são opcionais porque o estado gravado antes desta mudança não os tem; leia sempre com `?? []`. `lerEstado`, `gravarEstado` e os métodos que já existem ficam intocados.

  Regras de `registrarPresenca`, nesta ordem:
  1. `estado = lerEstado()` antes de tudo, para não sobrescrever a Entrega que outra aba acabou de gravar (Review Focus 2).
  2. Se não existe Sessão com `sessao.id`, acrescenta `{ ...sessao, municipioId, abertaEm: agora }`. `abertaEm` nunca é reescrito.
  3. Para cada `alertaId` sem Entrega com o mesmo par (`sessaoId`, `alertaId`), acrescenta `{ alertaId, sessaoId: sessao.id, idioma, em: agora }`. A primeira Entrega vale e nunca é reescrita.
  4. Só chama `mudou()` se o passo 2 ou o 3 acrescentou algo (Review Focus 1).

  `aoMudarSessoesEEntregas` segue o padrão de `aoMudarChamados`: `assinar(() => cb({ sessoes: estado.sessoes ?? [], entregas: estado.entregas ?? [] }))`.

  `encerrarAlerta(id)` troca o `validoAte` do Alerta por `new Date().toISOString()` e chama `mudou()`. Não remove o Alerta: `ativos()` já o filtra pelo `validoAte`. Se o id não existir, não faz nada.

- [ ] **Step 2: Verificar tipos**

  Run: `cd web && npx tsc --noEmit`
  Expected: sem erro.

- [ ] **Step 3: Verificar no navegador que o estado antigo continua abrindo (Review Focus 5)**

  1. Com o servidor parado, abra `http://localhost:3000/ensaio` numa aba que já tenha estado antigo. Se não houver, publique o alerta da Concha antes de puxar a mudança.
  2. Suba `npm run dev`.
  3. Abra `/?origem=pousada-mare&lang=es` em outra aba e clique em "Publicar bandeira vermelha – Praia da Concha" no `/ensaio`.

  Expected: o alerta aparece em espanhol na aba do turista, o cartão da praia Concha fica vermelho e o console das duas abas não tem erro.

  O teste de que repetir `registrarPresenca` não grava nem avisa (Review Focus 1) fica na Task 2, passo 4, porque é lá que o repositório aparece no console.

- [ ] **Step 4: Commit e push**

  ```bash
  git add web/src/data/tipos.ts web/src/data/repositorio.ts
  git commit -m "contrato: Entrega, SessaoAberta, registrarPresenca, encerrarAlerta e limparSessoes (só acréscimos)"
  git push -u origin cibelle/painel-gestao
  ```
  Logo depois do push, mande ao David o pedido da Task 6, passo 1. Ele pode encaixar o pedido enquanto as Tasks 2 a 5 andam.

---

### Task 2: Rota /gestao e publicar Alerta a partir de Modelo de alerta

**Files:**
- Create: `web/src/app/gestao/page.tsx`
- Create: `web/src/components/gestao/AppGestao.tsx`
- Create: `web/src/components/gestao/modelos.ts`
- Create: `web/src/components/gestao/PublicarAlerta.tsx`

**Interfaces:**
- Consumes: `repositorio(): Repositorio & Ensaio`, já existente, com `municipios()`, `praiasHoje(municipioId)` e `publicarAlerta(a)` da interface `Ensaio`.
- Produces (em `modelos.ts`):
  ```ts
  export type ModeloAlerta = {
    id: "bandeira-vermelha" | "impropria-banho" | "mar-agitado";
    nome: string;                 // rótulo na tela da gestão, em português
    tipo: string;                 // Alerta.tipo
    severidade: Severidade;
    titulo: (praia: string) => Traduzido;
    texto: Traduzido;
    condicao: { situacao: Situacao; bandeira: CorBandeira; detalhe: Traduzido };
  };
  export const MODELOS_ALERTA: ModeloAlerta[];
  /** monta o Alerta pronto para publicar: id novo, criadoEm agora, validoAte no fim do dia local */
  export function criarAlerta(modelo: ModeloAlerta, praia: PraiaHoje, municipio: Municipio): Alerta;
  ```
- Produces (em `AppGestao.tsx`): `export function AppGestao()`. Ele guarda `repo` em estado, criado num `useEffect` (`setRepo(repositorio())`), porque o mock lê o localStorage e não pode nascer no servidor. Até lá, renderiza `<div className="painel-gestao" aria-busy />`. No mesmo efeito, só quando `process.env.NODE_ENV === "development"`, faz `window.repoGestao = repo` para os passos de verificação pelo console.
- Produces (em `PublicarAlerta.tsx`): `export function PublicarAlerta(props: { praias: { municipio: Municipio; praia: PraiaHoje }[]; aoPublicar: (a: Alerta) => void })`.

- [ ] **Step 1: Implementar o catálogo em `modelos.ts`, com estes textos exatos**

  | id | nome | tipo | severidade | condicao (situacao / bandeira / detalhe PT · ES · EN) |
  |---|---|---|---|---|
  | `bandeira-vermelha` | Bandeira vermelha | `bandeira_vermelha` | `perigo` | `impropria` / `vermelha` / Bandeira vermelha · Bandera roja · Red flag |
  | `impropria-banho` | Imprópria para banho | `impropria_banho` | `atencao` | `impropria` / `vermelha` / Água imprópria para banho · Agua no apta para baño · Water unsafe for swimming |
  | `mar-agitado` | Mar agitado | `mar_agitado` | `atencao` | `precaucao` / `amarela` / Mar agitado · Mar agitado · Rough sea |

  | id | titulo(praia) PT · ES · EN | texto PT · ES · EN |
  |---|---|---|
  | `bandeira-vermelha` | Não entre no mar na {praia} · No entres al mar en {praia} · Do not enter the sea at {praia} | Mar agitado e correntes fortes até novo aviso. · Mar agitado y corrientes fuertes hasta nuevo aviso. · Rough sea and strong currents until further notice. |
  | `impropria-banho` | Água imprópria para banho em {praia} · Agua no apta para baño en {praia} · Water unsafe for swimming at {praia} | Evite entrar na água até o próximo boletim. · Evita entrar al agua hasta el próximo boletín. · Avoid going in the water until the next bulletin. |
  | `mar-agitado` | Mar agitado em {praia} · Mar agitado en {praia} · Rough sea at {praia} | Entre no mar só até a cintura e perto do salva-vidas. · Entra al mar solo hasta la cintura y cerca del socorrista. · Only go in up to your waist and near the lifeguard. |

  `{praia}` é `praia.nome` como vem do repositório ("Concha", "Praia do Cristo"). `criarAlerta` preenche:
  - `id: \`a-${modelo.id}-${praia.id}-${Date.now()}\``;
  - `municipioId: praia.municipioId`, `localId: praia.id`;
  - `origem: \`Prefeitura de ${municipio.nome}\``;
  - `criadoEm` agora e `validoAte` às 23:59:59.999 do dia local.

- [ ] **Step 2: Implementar a página, o `AppGestao` e o `PublicarAlerta`**

  `page.tsx` segue o modelo de `app/central/page.tsx`: `export const metadata: Metadata = { title: "Gestão · TuristAí" }` e renderiza `<AppGestao />`.

  `AppGestao` monta a lista de praias da região percorrendo `municipios()` e chamando `praiasHoje(m.id)` em cada um, o que dá só Itacaré e Ilhéus. Depois renderiza, dentro de `<main className="painel-gestao mx-auto max-w-[960px] px-4 py-6 ...">`:
  - um cabeçalho "Painel da gestão" com o subtítulo "Costa do Cacau";
  - a seção "Publicar alerta".

  O `PublicarAlerta` tem:
  - um `<select>` de praia, agrupado por município com `<optgroup label="Itacaré">`;
  - um botão por Modelo de alerta, para escolher um;
  - uma prévia do título e do texto nos 3 idiomas (PT, ES, EN, um abaixo do outro);
  - o botão "Publicar alerta".

  O botão "Publicar alerta" fica desabilitado até haver praia e Modelo escolhidos, e de novo por 2 s depois de publicar, para um clique duplo não publicar dois Alertas. O botão chama `aoPublicar(criarAlerta(...))`, e o `AppGestao` repassa para `repo.publicarAlerta`. Depois de publicar, aparece a linha "Publicado às HH:MM em PT, ES e EN.".

- [ ] **Step 3: Verificar tipos**

  Run: `cd web && npx tsc --noEmit`
  Expected: sem erro.

- [ ] **Step 4: Verificar no navegador**

  1. Abra `/?origem=pousada-mare&lang=es` numa aba e `/gestao` em outra.
  2. No /gestao, escolha a praia "Concha" (grupo Itacaré) e o Modelo "Bandeira vermelha". A prévia mostra "No entres al mar en Concha" na linha ES.
  3. Clique em "Publicar alerta".

  Expected:
  - na aba do turista, o alerta "No entres al mar en Concha" aparece e o cartão da praia Concha fica com a bandeira vermelha ("Bandera roja");
  - o botão fica desabilitado por 2 s;
  - no console do /gestao, `window.repoGestao` existe.

  Ainda no console do /gestao, teste que repetir `registrarPresenca` não grava nem avisa (Review Focus 1):
  ```js
  const r = window.repoGestao, s = { id: "s-teste-es", idioma: "es", canal: "qr" };
  const id = (await r.alertasAtivos("itacare"))[0].id;
  const n = () => (JSON.parse(localStorage.getItem("costa-cacau:estado")).entregas ?? []).length;
  await r.registrarPresenca(s, "itacare", [id], "es"); const a = n();
  await r.registrarPresenca(s, "itacare", [id], "es"); console.log(a, n());
  ```
  Expected: os dois números são iguais (`1 1` num estado zerado); a segunda chamada não acrescentou Entrega. Limpe com `r.limparSessoes()`.

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/app/gestao web/src/components/gestao
  git commit -m "gestao: rota /gestao e publicar Alerta a partir de Modelo de alerta"
  ```

---

### Task 3: Alertas ativos com encerrar

**Files:**
- Create: `web/src/components/gestao/AlertasAtivos.tsx`
- Modify: `web/src/components/gestao/AppGestao.tsx`

**Interfaces:**
- Consumes: `alertasAtivos(municipioId)`, `aoMudarAlertas(municipioId, cb)` (já existentes) e `encerrarAlerta(id)` (Task 1).
- Produces: `export function AlertasAtivos(props: { alertas: Alerta[]; municipios: Municipio[]; aoEncerrar: (id: string) => void; alcance?: (a: Alerta) => React.ReactNode })`. A prop `alcance` é o espaço que a Task 4 preenche em cada linha.

- [ ] **Step 1: Implementar**

  O `AppGestao` carrega os Alertas ativos de todos os municípios (`Promise.all` sobre `municipios()`) e assina `aoMudarAlertas` para cada município, recarregando a lista e as praias a cada aviso. Cancela as assinaturas ao desmontar.

  Cada linha da seção "Alertas ativos" mostra:
  - a severidade, por cor de token: `danger` para perigo, `warn` para atencao, `blue` para info;
  - o título em PT;
  - o nome do município e a origem;
  - "publicado às HH:MM";
  - o botão "Encerrar".

  "Encerrar" pede confirmação na própria linha: o botão vira "Confirmar encerramento" por 4 s. Na confirmação, chama `aoEncerrar(id)` → `repo.encerrarAlerta(id)`. Sem Alertas, a seção mostra "Nenhum Alerta ativo na Costa do Cacau.".

- [ ] **Step 2: Verificar tipos**

  Run: `cd web && npx tsc --noEmit`
  Expected: sem erro.

- [ ] **Step 3: Verificar no navegador**

  Com as duas abas da Task 2 e a bandeira vermelha na Concha publicada:
  1. Publique também "Mar agitado" na "Praia do Cristo" (Ilhéus).
  2. Confira: a lista mostra os 2 Alertas, o da Concha primeiro (perigo).
  3. Clique em "Encerrar" e depois em "Confirmar encerramento" no Alerta da Concha.

  Expected:
  - o Alerta some da lista do /gestao;
  - na aba do turista, o alerta sai e o cartão da Concha volta para a bandeira verde ("Agua apta para baño").

  Encerre o outro também. A lista mostra "Nenhum Alerta ativo na Costa do Cacau.".

- [ ] **Step 4: Commit**

  ```bash
  git add web/src/components/gestao
  git commit -m "gestao: lista de Alertas ativos com encerrar"
  ```

---

### Task 4: Alcance e Tempo até chegar de cada Alerta

**Files:**
- Create: `web/src/components/gestao/alcance.ts`
- Modify: `web/src/components/gestao/AppGestao.tsx`
- Modify: `web/src/components/gestao/AlertasAtivos.tsx` (só se precisar de ajuste no espaço da prop `alcance`)

**Interfaces:**
- Consumes: `sessoesEEntregas()` e `aoMudarSessoesEEntregas(cb)` (Task 1); a prop `alcance` de `AlertasAtivos` (Task 3).
- Produces (em `alcance.ts`):
  ```ts
  export type AlcanceDoAlerta = {
    abertas: number;                    // Sessões do município do Alerta abertas hoje
    alcancadas: number;                 // dessas, quantas têm Entrega deste Alerta
    porIdioma: Record<Idioma, number>;  // alcançadas, pelo idioma da Entrega
    primeiraMs: number | null;          // Tempo até chegar: a mais rápida
    medianaMs: number | null;           // Tempo até chegar: a mediana
  };
  export function calcularAlcance(alerta: Alerta, d: SessoesEEntregas, agora: Date): AlcanceDoAlerta;
  /** null → "—"; < 60 s → "2 s"; senão "1 min 5 s" */
  export function formatarTempo(ms: number | null): string;
  ```

- [ ] **Step 1: Implementar `calcularAlcance` com estas regras**

  - **Abertas hoje:** são as Sessões com `municipioId === alerta.municipioId` cuja `abertaEm` cai no mesmo dia local de `agora`.
  - **Alcançadas:** são as Sessões abertas hoje que têm Entrega com `alertaId === alerta.id`. Conte uma por Sessão, mesmo que haja Entrega repetida.
  - **`porIdioma`:** conta as alcançadas pelo `idioma` da Entrega delas.
  - **Tempo até chegar:** usa só as alcançadas cuja `abertaEm <= alerta.criadoEm`, ou seja, que já estavam abertas quando o Alerta saiu. Para cada uma, `ms = em − criadoEm`, com mínimo 0. `primeiraMs` é o menor valor e `medianaMs` é a mediana (média dos dois do meio se a quantidade for par). Sem nenhuma, os dois ficam `null` (Review Focus 4).
  - Nunca divida aqui: o percentual é calculado na tela, e só quando `abertas > 0`.

- [ ] **Step 2: Implementar a exibição em cada linha de Alerta ativo**

  O `AppGestao` carrega `sessoesEEntregas()`, assina `aoMudarSessoesEEntregas` e passa para `AlertasAtivos` a prop `alcance={(a) => ...}`, que chama `calcularAlcance(a, dados, new Date())`. Recalcula também a cada 30 s, para a virada do dia.

  Com `abertas > 0`, cada linha mostra:
  - "Alcance: 3 de 3 Sessões abertas hoje (100%)", com o percentual por `Math.round`;
  - "ES 1 · EN 1 · PT 1", omitindo os idiomas com 0;
  - "Tempo até chegar: primeira 1 s · mediana 2 s".

  Com `abertas === 0`, mostra "Nenhuma Sessão aberta hoje em {município}" e "Tempo até chegar: —" (Review Focus 3).

- [ ] **Step 3: Verificar tipos e navegador**

  Run: `cd web && npx tsc --noEmit`
  Expected: sem erro.

  Navegador, só com o /gestao aberto e nenhuma Sessão gravada (se precisar, rode `window.repoGestao.limparSessoes()` no console):
  1. Publique "Bandeira vermelha" na Concha.
     - Expected: a linha mostra "Nenhuma Sessão aberta hoje em Itacaré" e "Tempo até chegar: —". Não aparece `NaN`, `Infinity` nem "0%".
  2. No console do /gestao, simule uma Sessão que já estava aberta e outra que abre depois:
     ```js
     const r = window.repoGestao;
     await r.registrarPresenca({ id: "s-es", idioma: "es", canal: "qr" }, "itacare", [], "es");
     ```
     Depois **publique de novo** "Mar agitado" na Concha (a Sessão `s-es` agora é anterior a ele), espere uns 3 s e rode:
     ```js
     const novo = (await r.alertasAtivos("itacare")).find(a => a.tipo === "mar_agitado").id;
     await r.registrarPresenca({ id: "s-es", idioma: "es", canal: "qr" }, "itacare", [novo], "es");
     await r.registrarPresenca({ id: "s-en", idioma: "en", canal: "qr" }, "itacare", [novo], "en");
     ```
     - Expected, na linha do "Mar agitado": "Alcance: 2 de 2 Sessões abertas hoje (100%)", "ES 1 · EN 1" e "Tempo até chegar: primeira 3 s · mediana 3 s". A `s-en` abriu depois do Alerta e por isso não entra no tempo.
     - Expected, na linha da "Bandeira vermelha": "0 de 2 Sessões abertas hoje (0%)" e "Tempo até chegar: —".

- [ ] **Step 4: Commit**

  ```bash
  git add web/src/components/gestao
  git commit -m "gestao: Alcance por idioma e Tempo até chegar de cada Alerta"
  ```

---

### Task 5: Trade (Selo e Cadastur), Zerar demo e verificação da entrega sem o David

**Files:**
- Create: `web/src/components/gestao/Trade.tsx`
- Modify: `web/src/components/gestao/AppGestao.tsx`

**Interfaces:**
- Consumes: `estabelecimentosComSelo(municipioId)` (já existente) e `limparSessoes()` (Task 1).
- Produces: `export function Trade(props: { comSelo: Estabelecimento[] })`.

- [ ] **Step 1: Implementar**

  O `AppGestao` junta `estabelecimentosComSelo(m.id)` de todos os municípios. A seção "Trade" mostra três números (ADR 0001):
  - "Estabelecimentos com Selo": o total;
  - "com Cadastur": quantos têm `cadastur`;
  - "em formalização": quantos têm Selo sem Cadastur.

  No rodapé fica um botão discreto (`bg-surface`), "Zerar demo", com a legenda "Apaga as Sessões e Entregas gravadas neste navegador.". Ele chama `repo.limparSessoes()`. Não mexe em Alertas nem chamados.

- [ ] **Step 2: Verificar tipos**

  Run: `cd web && npx tsc --noEmit`
  Expected: sem erro.

- [ ] **Step 3: Verificar no navegador**

  1. Abra `/gestao`.
     - Expected, na seção Trade: **9** Estabelecimentos com Selo, **7** com Cadastur, **2** em formalização (seed atual).
  2. Com o estado da Task 4 ainda gravado, clique em "Zerar demo".
     - Expected: o Alerta "Mar agitado" continua na lista, mas passa a mostrar "Nenhuma Sessão aberta hoje em Itacaré" e "Tempo até chegar: —".

- [ ] **Step 4: Build e checklist do AGENTS.md §4**

  Run: `cd web && npx tsc --noEmit && npm run build`
  Expected: os dois sem erro, e `/gestao` aparece na lista de rotas do build.

  Com `npm run dev`, confira que continuam funcionando:
  - `/?origem=pousada-mare&lang=es`: tela do turista, convite do WhatsApp, SOS (triagem + confirmação), assistente, mapa;
  - `/chat?lang=es&origem=pousada-mare`: boas-vindas e resposta mocada;
  - `/ensaio`: publicar o alerta da Concha chega na tela do turista em outra aba;
  - `/gestao`: tasks 2 a 5 de novo, numa passada rápida.

- [ ] **Step 5: Commit e PR**

  ```bash
  git add web/src/components/gestao
  git commit -m "gestao: Estabelecimentos com Selo e Cadastur, e Zerar demo"
  git push
  ```
  Abra o PR de `cibelle/painel-gestao` para `main`. Na descrição, diga que `tipos.ts` e `repositorio.ts` só receberam acréscimos e que o Alcance fica vazio até a Task 6 (David).

---

### Task 6: Integração com a tela do turista (David)

Esta tarefa é do David: `web/src/components/turista/TelaTurista.tsx` é área dele (AGENTS.md §1), e a Cibelle não edita esse arquivo.

**Enquanto o David não fizer:** o /gestao sobe e funciona inteiro. Publicar, encerrar, Trade e Zerar demo não dependem dele. Nenhuma Sessão é gravada, então cada Alerta ativo mostra "Nenhuma Sessão aberta hoje em {município}" e "Tempo até chegar: —" (Task 4, passo 3). Na demo, o Alcance não tem número.

**Files:**
- Modify (David): `web/src/components/turista/TelaTurista.tsx`, perto da linha 75 (carga inicial) e dentro do `aoMudarAlertas`, perto da linha 103-114.

**Interfaces:**
- Consumes: `registrarPresenca(sessao, municipioId, alertaIds, idioma)` (Task 1).

- [ ] **Step 1: Mandar o pedido ao David (logo depois do push da Task 1)**

  Texto para enviar:

  > David, subi na `cibelle/painel-gestao` um método novo no repositório (só acréscimo): `registrarPresenca(sessao, municipioId, alertaIds, idioma)`. É ele que alimenta o Alcance do /gestao (ADR `docs/adr/0002-alcance-por-entrega-registrada.md`). Preciso de duas chamadas na `TelaTurista.tsx`:
  >
  > 1. **Na carga** (perto da linha 75, depois do `if (!vivo) return;`):
  >    `void repo.registrarPresenca(sessao, municipio.id, ativos.map((a) => a.id), idioma);`
  > 2. **Quando chega alerta** (no callback do `repo.aoMudarAlertas`, perto da linha 106):
  >    `void repo.registrarPresenca(sessao, municipioId, lista.map((a) => a.id), idioma);`
  >    Para ter a `sessao` e o `idioma` atuais no callback, dá para pôr `dados?.sessao` e `idioma` nas dependências do efeito ou usar refs, como você preferir.
  >
  > O `idioma` é o da tela **agora** (o do `useIdioma()`), não o do primeiro acesso. O método é idempotente: chamar de novo com os mesmos dados não grava nem avisa as outras abas, então não cria laço. Se der para encaixar hoje cedo, consigo testar o Alcance antes do ensaio.

- [ ] **Step 2: Depois do merge do David, puxar e verificar tipos**

  Run: `git pull --rebase origin main && cd web && npx tsc --noEmit`
  Expected: sem erro.

- [ ] **Step 3: Verificar no navegador o roteiro da demo (Review Focus 2)**

  1. Abra `/gestao` e clique em "Zerar demo"; encerre os Alertas que estiverem ativos.
  2. Abra três abas e não as recarregue mais: `/?origem=pousada-mare&lang=pt`, `/?origem=pousada-mare&lang=es` e `/?origem=pousada-mare&lang=en`.
  3. No /gestao, publique "Bandeira vermelha" na Concha.

  Expected:
  - o alerta aparece nas três abas, cada uma no seu idioma;
  - o /gestao mostra "Alcance: 3 de 3 Sessões abertas hoje (100%)", "PT 1 · ES 1 · EN 1" e um Tempo até chegar de poucos segundos;
  - "3 de 3" confirma que nenhuma aba apagou a Entrega da outra;
  - o console das quatro abas não mostra mensagens se repetindo sem parar, o que confirma que não há laço.

  Depois, na aba `lang=es`, troque o idioma para EN pelo seletor e publique "Mar agitado" na Concha. Expected: no Alerta novo, a quebra mostra "PT 1 · EN 2".

- [ ] **Step 4: Build e checklist do AGENTS.md §4**

  Run: `cd web && npx tsc --noEmit && npm run build`
  Expected: sem erro. Repita a checklist da Task 5, passo 4.
