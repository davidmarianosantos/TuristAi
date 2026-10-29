# Tela do turista · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** construir a rota `/` do turista (alertas, praias, assistente, lugares com Selo, mapa e SOS) em PT/ES/EN, responsiva, com dados mocados atrás de um repositório trocável.

**Arquitetura:** Next.js App Router com uma tela cliente `TelaTurista` que recebe um `Repositorio`. A lógica sem interface (idioma, sessão, assistente, triagem, mapa) fica em funções puras testadas com Vitest. O mock guarda o estado em memória e propaga alertas e status de chamados entre abas via `BroadcastChannel('costa-cacau')`.

**Stack:** Next.js (versão estável atual, App Router, TypeScript, `src/`), Tailwind CSS v4, Leaflet + react-leaflet, Vitest + Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-28-tela-turista-design.md`. Leia a spec inteira antes da primeira tarefa. Este plano cita as seções dela (§).

## Restrições globais

- Idiomas aceitos: `pt`, `es`, `en`. Padrão `pt`. Código, nomes de arquivos e funções em português, como na spec §10.
- Fonte Archivo (400, 500, 600, 800) via `next/font/google`. Cinco tamanhos: 38 / 22 / 17 / 15 / 13 px. Nada funcional abaixo de 12px. Inputs com 16px ou mais.
- Cores só pelos tokens da spec §4. Situação sempre com palavra e bandeira, nunca só cor.
- Sem gradientes, sem sombras em repouso (só folha e cartão do mapa), sem emoji, sem bordas laterais coloridas, cantos retos nas superfícies.
- Altura com `svh`/`dvh`, nunca `100vh`. Rodapé e cabeçalho com `env(safe-area-inset-*)`.
- Movimento só com `transform` e `opacity`, com fallback em `prefers-reduced-motion`.
- Todo dado de exemplo é fictício e tem `[DEMO]` no nome. Nenhum estabelecimento real.
- Toda leitura e escrita de `localStorage` dentro de try/catch.
- As telas só falam com o `Repositorio`, nunca com `seed.ts`.
- Alvos de toque com pelo menos 44 × 44px.

## Foco de revisão

1. **SOS de texto livre ("Otra cosa")** com conteúdo de emergência ou desconhecido deve sair como `urgente`. Nenhum caso urgente pode ficar retido (Tarefa 6).
2. **Pergunta sem acento, sem `¿` ou em maiúsculas** ("DONDE PUEDO COMER") deve cair na mesma intenção que a versão correta (Tarefa 5).
3. **`localStorage` que lança erro** (aba anônima, bloqueio) não pode quebrar a página. O idioma cai para o do navegador (Tarefa 3).
4. **Toque duplo ou segunda frase durante a contagem do SOS** gera um único chamado, com a última frase escolhida e a contagem reiniciada (Tarefa 11).
5. **Alerta vencido, de outro município ou recebido duas vezes** pelo canal não aparece, nem aparece em duplicata (Tarefas 2 e 9).

---

### Tarefa 1: Projeto, tokens e ambiente de teste

**Arquivos:**
- Criar: o projeto via `create-next-app` na raiz da pasta `Hackaton`
- Criar: `vitest.config.ts`, `vitest.setup.ts`, `src/smoke.test.ts`
- Modificar: `src/app/globals.css`, `src/app/layout.tsx`, `.gitignore`

**Interfaces:**
- Produz: os tokens CSS e as utilidades Tailwind `bg-field`, `text-ink`, `text-ink-2`, `bg-surface`, `bg-surface-2`, `bg-accent`, `text-blue`, `ok`, `ok-ink`, `warn`, `warn-ink`, `danger`, `danger-ink`, `danger-bg`; a variável de fonte `--font-archivo`; o comando `npm test`.

- [ ] **Passo 1: `git init` e scaffold.** Rode na raiz: `npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm`. Se reclamar de arquivos existentes, gere numa pasta temporária e mova o conteúdo sem apagar `CLAUDE.md`, `docs/`, `.claude/`, `.impeccable/` e `.superpowers/`.
- [ ] **Passo 2: `.gitignore`.** Acrescente `.superpowers/` e `.taste-skill/`.
- [ ] **Passo 3: dependências de teste e mapa.**
  - `npm i leaflet react-leaflet`
  - `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/leaflet`
- [ ] **Passo 4: configuração do Vitest.** `vitest.config.ts` com ambiente `jsdom`, alias `@` para `src`, `setupFiles: ['vitest.setup.ts']` (que importa `@testing-library/jest-dom/vitest`) e `globals: true`. No `package.json`, `"test": "vitest run"`.
- [ ] **Passo 5: teste de fumaça.** `src/smoke.test.ts` com `expect(1 + 1).toBe(2)`. Rode `npm test`. Esperado: 1 passed.
- [ ] **Passo 6: tokens.** Em `globals.css`, troque o conteúdo padrão pelos tokens da spec §4 em `:root` e mapeie cada um num bloco `@theme` do Tailwind v4 (`--color-ink: var(--ink)` etc.). Inclua `body { background: var(--ground); color: var(--ink); -webkit-tap-highlight-color: transparent; }`.
- [ ] **Passo 7: layout.** Em `layout.tsx`, carregue Archivo com `variable: '--font-archivo'`, `<html lang="pt">` e `export const viewport = { themeColor: '#1328a0', viewportFit: 'cover' }`.
- [ ] **Passo 8: verificar.** `npm run dev` abre `http://localhost:3000` sem erro; `npm run build` passa.
- [ ] **Passo 9: commit.** `git add -A && git commit -m "chore: scaffold Next.js, tokens C3 e Vitest"`, incluindo a spec e o plano já existentes em `docs/`.

### Tarefa 2: Tipos, seed e repositório mock

**Arquivos:**
- Criar: `src/data/tipos.ts`, `src/data/repositorio.ts`, `src/data/mock/seed.ts`, `src/data/mock/repositorioMock.ts`
- Teste: `src/data/mock/repositorioMock.test.ts`

**Interfaces:**
- Produz: todos os tipos da spec §6.1, exatamente como escritos lá; a interface `Repositorio` da spec §6.2; `criarRepositorioMock(opcoes?: { agora?: () => Date; canal?: string }): Repositorio & Ensaio`, onde:

```ts
interface Ensaio {
  publicarAlerta(a: Alerta): void;                                  // grava e transmite no canal
  mudarStatusChamado(id: string, status: ChamadoSOS['status']): void; // grava e transmite
  aoQualquerChamado(cb: (c: ChamadoSOS) => void): () => void;        // para /ensaio (e /central depois)
  limparAlertas(): void;
}
```

- Parâmetros: `criarSessao(dados: Omit<Sessao, 'id'>)` e `enviarSOS(dados: Omit<ChamadoSOS, 'id' | 'status' | 'criadoEm'> & { status?: ChamadoSOS['status'] })`. O status padrão é `'enviado'`, ou `'resolvido_ia'` quando a urgência é `nao_urgente` e a chamada não traz status explícito.
- Mensagens do canal: `{ tipo: 'alerta', alerta: Alerta } | { tipo: 'chamado', chamado: ChamadoSOS } | { tipo: 'limpar' }`. `enviarSOS` também transmite `chamado`.

- [ ] **Passo 1: seed.** Crie `seed.ts` com:
  - os 8 municípios do CLAUDE.md §1, com o centro aproximado de cada um;
  - Itacaré com as praias Itacarezinho (própria, verde), Ribeira (precaução, amarela) e Concha (própria, verde, até o alerta da demo mudá-la);
  - Ilhéus com 2 praias;
  - 8 estabelecimentos `[DEMO]` cobrindo restaurante, barraca, pousada (`slug: 'pousada-mare'`, Itacaré), hotel, receptivo, transporte (táxi e transfer) e comércio. Pelo menos 6 com `temSelo: true` e 2 preços traduzidos cada;
  - nenhum alerta ativo.

  Toda string visível tem `{ pt, es, en }`.
- [ ] **Passo 2: testes que falham.** Em `repositorioMock.test.ts`:

```ts
test('alertasAtivos filtra por município e validade', async () => {
  const repo = criarRepositorioMock({ agora: () => new Date('2026-10-29T10:00:00-03:00') });
  repo.publicarAlerta(alerta({ id: 'a1', municipioId: 'itacare' }));
  repo.publicarAlerta(alerta({ id: 'a2', municipioId: 'ilheus' }));
  repo.publicarAlerta(alerta({ id: 'a3', municipioId: 'itacare', validoAte: '2026-10-28T23:00:00-03:00' }));
  expect((await repo.alertasAtivos('itacare')).map(a => a.id)).toEqual(['a1']);
});
test('alertasAtivos ordena perigo > atencao > info e, no empate, mais novo primeiro', ...);
test('estabelecimentosComSelo exclui temSelo=false e outros municípios', ...);
test('estabelecimentoPorSlug devolve null para slug inexistente', ...);
test('condicoesHoje devolve as 3 praias de Itacaré com condição', ...);
test('enviarSOS devolve chamado com id, status "enviado" e criadoEm', ...);
test('aoNovoAlerta recebe alerta publicado por OUTRA instância no mesmo canal', async () => {
  const a = criarRepositorioMock({ canal: 'teste-1' }); const b = criarRepositorioMock({ canal: 'teste-1' });
  const recebidos: Alerta[] = []; b.aoNovoAlerta('itacare', x => recebidos.push(x));
  a.publicarAlerta(alerta({ id: 'x', municipioId: 'itacare' }));
  await vi.waitFor(() => expect(recebidos.map(r => r.id)).toEqual(['x']));
});
test('aoNovoAlerta ignora outro município e não repete o mesmo id', ...);   // Foco de revisão 5
test('unsubscribe de aoNovoAlerta para de receber', ...);
test('aoMudarChamado recebe mudarStatusChamado de outra instância', ...);
test('enviarSOS não urgente sem status explícito nasce "resolvido_ia"; com status "enviado" respeita', ...);
test('aoQualquerChamado recebe chamados enviados por outra instância', ...);
```

  `alerta(parcial)` é um helper local do teste que preenche os campos obrigatórios.
- [ ] **Passo 3: rodar.** `npm test -- repositorioMock`. Esperado: FAIL (módulo não existe).
- [ ] **Passo 4: implementar** `tipos.ts`, `repositorio.ts` (só a interface) e `repositorioMock.ts`. Estado em memória por instância; o canal é um `BroadcastChannel(opcoes.canal ?? 'costa-cacau')`. Instâncias que compartilham o canal também aplicam ao próprio estado o que recebem. `alertasAtivos` considera ativo quem não tem `validoAte` ou tem `validoAte > agora()`.
- [ ] **Passo 5: rodar.** `npm test -- repositorioMock`. Esperado: PASS.
- [ ] **Passo 6: commit.** `feat(dados): tipos, seed [DEMO] e repositório mock com BroadcastChannel`

### Tarefa 3: Idioma e dicionários

**Arquivos:**
- Criar: `src/lib/idioma.ts`, `src/i18n/pt.ts`, `src/i18n/es.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`, `src/components/IdiomaProvider.tsx`
- Teste: `src/lib/idioma.test.ts`, `src/i18n/i18n.test.ts`

**Interfaces:**
- Produz:
  - `detectarIdioma(e: { param?: string | null; salvo?: string | null; navegador?: readonly string[] }): Idioma`
  - `lerIdiomaSalvo(): string | null` e `salvarIdioma(i: Idioma): void`, que nunca lançam erro
  - `type Chave = keyof typeof pt` e `dicionarios: Record<Idioma, Record<Chave, string>>`
  - `<IdiomaProvider inicial?: Idioma>`, que atualiza `document.documentElement.lang`
  - o hook `useIdioma(): { idioma: Idioma; setIdioma(i: Idioma): void; t(c: Chave, vars?: Record<string, string | number>): string; tr(x: Traduzido): string }`

- [ ] **Passo 1: testes que falham.**

```ts
test.each([
  [{ param: 'es' }, 'es'],
  [{ param: 'fr', salvo: 'en' }, 'en'],
  [{ salvo: 'es', navegador: ['en-US'] }, 'es'],
  [{ navegador: ['es-AR', 'en'] }, 'es'],
  [{ navegador: ['fr-FR', 'en-GB'] }, 'en'],
  [{ navegador: ['de-DE'] }, 'pt'],
  [{}, 'pt'],
])('detectarIdioma(%o) = %s', (e, r) => expect(detectarIdioma(e)).toBe(r));

test('lerIdiomaSalvo devolve null quando localStorage lança', () => {     // Foco de revisão 3
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
  expect(lerIdiomaSalvo()).toBeNull();
});
test('salvarIdioma não lança quando localStorage lança', ...);
test('es e en têm exatamente as mesmas chaves que pt, sem valor vazio', ...);
test('t interpola {vars}', ...);   // t('boasVindas', { lugar: 'Pousada Maré [DEMO]' })
```

- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.** Os dicionários trazem todos os textos fixos das spec §3, §5 e §7, nos 3 idiomas, com chaves em camelCase. Exemplos em espanhol: `hojeEm: 'Hoy en {cidade}'`, `boasVindas: 'Te damos la bienvenida · {lugar}'`, `semAlertas: 'Sin alertas hoy'`, `precisaAjuda: '¿Necesitas ayuda?'`, `enviandoEm: 'Enviando en {s} s…'`. As datas usam `Intl.DateTimeFormat(idioma)`.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(i18n): detecção de idioma e dicionários PT/ES/EN`

### Tarefa 4: Sessão e origem do QR

**Arquivos:**
- Criar: `src/lib/sessao.ts`
- Teste: `src/lib/sessao.test.ts`

**Interfaces:**
- Consome: `Repositorio` e `Idioma` (Tarefas 2 e 3)
- Produz: `iniciarSessao(repo: Repositorio, e: { origemSlug?: string | null; idioma: Idioma }): Promise<{ sessao: Sessao; origem: Estabelecimento | null; municipio: Municipio }>`

- [ ] **Passo 1: testes que falham.**
  - `origemSlug: 'pousada-mare'` → `origem.nome` contém "Pousada Maré", `municipio.id === 'itacare'`, `sessao.origemId === origem.id`, `sessao.canal === 'qr'`.
  - `origemSlug: 'nao-existe'` → `origem === null`, `municipio.id === 'itacare'`.
  - sem `origemSlug` → mesmo resultado do slug inválido.
  - o objeto `sessao` só tem as chaves `id`, `idioma`, `canal` e `origemId`.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar** com `repo.estabelecimentoPorSlug` e `repo.criarSessao`.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(sessao): sessão anônima e origem do QR`

### Tarefa 5: Motor do assistente

**Arquivos:**
- Criar: `src/lib/assistente.ts`
- Teste: `src/lib/assistente.test.ts`

**Interfaces:**
- Consome: `Repositorio` (Tarefa 2)
- Produz:

```ts
type Intencao = 'comer' | 'praia_segura' | 'mare_clima' | 'transporte' | 'saude' | 'emergencia' | 'nao_entendi';
type Resposta = { intencao: Intencao; texto: Traduzido; lugares?: Estabelecimento[]; praias?: (Local & { condicao: Condicao })[]; abrirSOS?: boolean };
function classificar(pergunta: string): Intencao;
function responder(pergunta: string, idioma: Idioma, ctx: { repo: Repositorio; municipioId: string }): Promise<Resposta>;
```

- [ ] **Passo 1: testes que falham.**

```ts
test.each([
  ['¿Dónde puedo comer?', 'comer'], ['DONDE PUEDO COMER', 'comer'], ['where can I eat', 'comer'], ['onde comer moqueca', 'comer'],
  ['¿Es segura la playa?', 'praia_segura'], ['is the beach safe', 'praia_segura'], ['posso entrar no mar', 'praia_segura'],
  ['¿A qué hora baja la marea?', 'mare_clima'], ['vai chover?', 'mare_clima'],
  ['Taxi al aeropuerto', 'transporte'], ['transfer to Ilhéus', 'transporte'],
  ['farmacia cerca', 'saude'], ['preciso de um médico', 'saude'],
  ['me robaron', 'emergencia'], ['socorro', 'emergencia'], ['help', 'emergencia'],
  ['qwerty', 'nao_entendi'],
])('classificar(%s) = %s', (p, i) => expect(classificar(p)).toBe(i));   // Foco de revisão 2

test('responder comer devolve só lugares com Selo de comida do município', ...);  // categoria restaurante ou barraca
test('responder praia_segura devolve as praias de hoje', ...);
test('responder emergencia marca abrirSOS', ...);
test('emergencia vence comer em "me robaron en el restaurante"', ...);
```

- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.** Normalize com minúsculas, `normalize('NFD')`, remoção de diacríticos e de `¿?¡!`. Cada intenção tem uma lista de palavras-chave nos 3 idiomas. A prioridade é `emergencia` > `saude` > as demais, na ordem do tipo. Os textos das respostas ficam em `Traduzido` dentro do arquivo.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(assistente): intenções por palavra-chave em 3 idiomas`

### Tarefa 6: Triagem do SOS

**Arquivos:**
- Criar: `src/lib/triagem.ts`
- Teste: `src/lib/triagem.test.ts`

**Interfaces:**
- Produz:

```ts
type Triagem = { urgencia: 'urgente' | 'nao_urgente'; mensagemPt: string; resolucao?: { passos: Traduzido[] } };
function triarSOS(tipo: TipoSOS, texto: string | null, idioma: Idioma): Triagem;
const FRASES_SOS: Record<Exclude<TipoSOS, 'outro'>, Traduzido>;   // "Me robaron", "Emergencia médica"…
```

- [ ] **Passo 1: testes que falham.**
  - `triarSOS('roubo', null, 'es')` → `{ urgencia: 'urgente', mensagemPt: 'Fui roubado' }`, sem `resolucao`.
  - `medica` → urgente, "Emergência médica". `perdido` → urgente, "Estou perdido".
  - `documentos` → `nao_urgente`, "Perdi meus documentos", `resolucao.passos` com 3 itens: delegacia virtual, consulado e recepção do hotel, todos com `[DEMO]` quando citam contato.
  - `outro` com "me robaron el celular" → urgente (Foco de revisão 1).
  - `outro` com "asdf" → urgente (Foco de revisão 1: o que é desconhecido nunca fica retido).
  - `outro` com "perdí mi pasaporte" → `nao_urgente`, com resolução de documentos.
  - `outro` com texto não traduzido → `mensagemPt` = `"[texto original em ES, sem tradução automática] " + texto`.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.** Para `outro`, reaproveite `classificar` da Tarefa 5 e as palavras-chave de documentos. Só documentos e pedidos de informação viram `nao_urgente`.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(sos): triagem com regra "na dúvida, urgente"`

### Tarefa 7: Componentes base (Bandeira, Folha, SeletorIdioma)

**Arquivos:**
- Criar: `src/components/ui/Bandeira.tsx`, `src/components/ui/Folha.tsx`, `src/components/ui/SeletorIdioma.tsx`
- Teste: `src/components/ui/Folha.test.tsx`, `src/components/ui/SeletorIdioma.test.tsx`

**Interfaces:**
- Consome: `useIdioma` (Tarefa 3)
- Produz:
  - `<Bandeira cor: 'verde' | 'amarela' | 'vermelha' | 'marca' | 'cinza'; tamanho?: number; titulo?: string />`: SVG com mastro e pano em ponta. `titulo` gera `<title>`; sem ele, `aria-hidden`.
  - `<Folha aberta: boolean; aoFechar(): void; titulo: string; telaCheia?: boolean; children />`: `role="dialog"`, `aria-modal`, foco preso, Esc fecha, foco volta ao elemento que abriu, `overscroll-behavior: contain`, entra com `translateY` em 320ms `cubic-bezier(.32,.72,0,1)`. Sem movimento em reduced-motion.
  - `<SeletorIdioma />`: pílula amarela que mostra o idioma atual e abre a lista PT/ES/EN; escolher chama `setIdioma` e `salvarIdioma`.
  - Em `globals.css`, uma classe utilitária `.toque` com `transition: transform 120ms` e `:active { transform: scale(.97) }`, aplicada a todos os botões e cartões tocáveis (spec §9).

- [ ] **Passo 1: testes que falham.**
  - Folha: aberta, Esc chama `aoFechar`; ao fechar, o foco volta ao botão que abriu; Tab no último elemento focável volta ao primeiro.
  - SeletorIdioma: escolher "EN" muda o texto de um componente de teste que usa `t('semAlertas')` para "No alerts today" e chama `salvarIdioma('en')`.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.**
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(ui): Bandeira, Folha acessível e seletor de idioma`

### Tarefa 8: Página estática responsiva

**Arquivos:**
- Criar: `src/components/turista/TelaTurista.tsx`, `Cabecalho.tsx`, `Alertas.tsx`, `Praias.tsx`, `AssistenteCampo.tsx` (só o campo e as sugestões, sem a folha), `LugaresSelo.tsx`, `Telefones.tsx` e `RodapeSOS.tsx` (só a barra), todos em `src/components/turista/`; `src/data/RepositorioContext.tsx`
- Modificar: `src/app/page.tsx`
- Baixar: `public/img/itacarezinho.jpg`, de `https://upload.wikimedia.org/wikipedia/commons/7/77/Itacarezinho.jpg` (crédito: "Itacarezinho" por FlaviaC, CC BY 3.0, Wikimedia Commons)
- Teste: `src/components/turista/TelaTurista.test.tsx`

**Interfaces:**
- Consome: as Tarefas 2, 3, 4 e 7
- Produz:
  - `<RepositorioProvider repo>` e `useRepositorio(): Repositorio`
  - `<TelaTurista origemSlug?: string | null; langParam?: string | null />`
  - `page.tsx` lê `searchParams.origem` e `searchParams.lang` e renderiza `<RepositorioProvider repo={repositorioMock}><IdiomaProvider…><TelaTurista…/></…>`, com um singleton do mock no cliente
  - os callbacks `onAbrirAssistente(pergunta?: string)`, `onAbrirSOS()` e `onAbrirMapa()` que `TelaTurista` passa às seções

- [ ] **Passo 1: testes que falham** (com o repositório mock e o navegador em `es-AR`):
  - mostra o `h1` "Hoy en Itacaré" e "Te damos la bienvenida · Pousada Maré [DEMO]" com `origemSlug='pousada-mare'`;
  - sem alertas, mostra "Sin alertas hoy";
  - com um alerta publicado antes de renderizar, mostra o título dele em espanhol e "traducido del portugués";
  - lista Itacarezinho "Apta", Ribeira "Precaución" e Concha;
  - mostra os lugares com Selo com o preço formatado "R$ 89";
  - os links `tel:190`, `tel:192` e `tel:193` existem;
  - o rodapé mostra "¿Necesitas ayuda?" e um botão "SOS";
  - com `langParam='en'`, o `h1` vira "Today in Itacaré".
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar** as seções na ordem da spec §3, com o visual do mockup aprovado (`.superpowers/brainstorm/*/content/c3-alta-fidelidade.html`) e os tokens da Tarefa 1.
  - **Layout:** uma coluna com margens de 20px; `md:` coluna com até 640px; `lg:` grade de 2 colunas com o lado direito vazio, reservado ao mapa da Tarefa 12.
  - **Cabeçalho:** a linha de data usa `Intl`; temperatura e maré vêm de constantes `[DEMO]` em `Cabecalho.tsx`.
  - **Rodapé:** fixo, com `padding-bottom: max(16px, env(safe-area-inset-bottom))`, e `main` com o `padding-bottom` equivalente.
  - **Foto:** com `next/image`, e o crédito no fim da página.
  - **Carregamento:** esqueletos no tom `surface` enquanto as promessas não resolvem.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: verificar no navegador.** `npm run dev`, abra `/?origem=pousada-mare&lang=es` em 390, 768 e 1440px. Nenhuma rolagem horizontal, o rodapé não cobre o último conteúdo e o `h1` tem no máximo 2 linhas.
- [ ] **Passo 6: commit.** `feat(turista): página única responsiva com dados mock`

### Tarefa 9: Alerta ao vivo e pílula "Nueva alerta"

**Arquivos:**
- Criar: `src/components/turista/PilulaNovoAlerta.tsx`
- Modificar: `src/components/turista/Alertas.tsx`, `TelaTurista.tsx`
- Teste: `src/components/turista/AlertaAoVivo.test.tsx`

**Interfaces:**
- Consome: `repo.aoNovoAlerta` (Tarefa 2)
- Produz: `<PilulaNovoAlerta visivel: boolean; aoTocar(): void />`

- [ ] **Passo 1: testes que falham.**
  - Com a tela aberta, outra instância do mock no mesmo canal publica um alerta "Bandera roja" de Itacaré e ele aparece sem recarregar.
  - O mesmo alerta publicado duas vezes aparece uma vez só (Foco de revisão 5).
  - Com um `IntersectionObserver` simulado dizendo que a seção de alertas está fora da tela, a pílula "↑ Nueva alerta" aparece; tocar chama `scrollIntoView` na seção e esconde a pílula.
  - A região de alertas tem `aria-live="polite"`.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.** O alerta novo entra deslizando de cima (`translateY(-8px)` → 0 e `opacity`, 240ms). A pílula usa fade com `scale(.96)` → 1.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(turista): alerta em tempo real e pílula de novo alerta`

### Tarefa 10: Folha do assistente

**Arquivos:**
- Criar: `src/components/turista/FolhaAssistente.tsx`
- Modificar: `AssistenteCampo.tsx`, `TelaTurista.tsx`
- Teste: `src/components/turista/FolhaAssistente.test.tsx`

**Interfaces:**
- Consome: `responder` (Tarefa 5), `Folha` (Tarefa 7), `onAbrirSOS` (Tarefa 8)
- Produz: `<FolhaAssistente aberta: boolean; perguntaInicial?: string; aoFechar(): void; aoPedirSOS(): void />`

- [ ] **Passo 1: testes que falham.**
  - Tocar na sugestão "¿Dónde puedo comer?" abre a folha com a pergunta e uma resposta com pelo menos um cartão de restaurante com Selo.
  - Digitar "me robaron" e enviar mostra um botão que chama `aoPedirSOS`.
  - "qwerty" responde com as sugestões.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar.** A folha fica em tela cheia no celular e como painel de até 480px à direita no `lg:`. O campo fixo no fim da folha acompanha o teclado via `window.visualViewport` (evento `resize`). Os cartões de lugar reaproveitam o cartão de `LugaresSelo`.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(turista): folha do assistente`

### Tarefa 11: Fluxo do SOS

**Arquivos:**
- Criar: `src/components/turista/FolhaSOS.tsx`, `StatusSOS.tsx`, `src/lib/localizacao.ts`
- Modificar: `RodapeSOS.tsx`, `TelaTurista.tsx`
- Teste: `src/components/turista/SOS.test.tsx`

**Interfaces:**
- Consome: `triarSOS` e `FRASES_SOS` (Tarefa 6); `repo.enviarSOS` e `repo.aoMudarChamado` (Tarefa 2); `Folha` (Tarefa 7); a sessão e a origem (Tarefa 4)
- Produz:
  - `pedirLocalizacao(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null>`, que devolve `null` quando o turista nega, dá timeout ou não há suporte
  - `<FolhaSOS aberta; aoFechar(); sessao: Sessao; origemId?: string />`
  - `<StatusSOS chamado: ChamadoSOS; triagem: Triagem />`

- [ ] **Passo 1: testes que falham** (com fake timers):
  - Tocar "Me robaron" mostra "Enviando en 5 s…". Aos 4,9 s, `enviarSOS` ainda não foi chamado; aos 5 s, é chamado uma vez com `tipo: 'roubo'`, `urgencia: 'urgente'`, `mensagemPt: 'Fui roubado'`, `mensagemOriginal: 'Me robaron'`, `idiomaOriginal: 'es'` e `origemId` da pousada.
  - "Cancelar" antes dos 5 s faz `enviarSOS` nunca ser chamado.
  - Tocar "Me robaron" e, aos 2 s, "Emergencia médica" gera um único envio, com `tipo: 'medica'`, 5 s após o segundo toque (Foco de revisão 4).
  - Depois do envio urgente aparece "La Central recibió tu aviso"; quando outra instância roda `mudarStatusChamado(id, 'em_atendimento')`, a linha do tempo mostra "En atención".
  - "Perdí mis documentos" leva à tela "Resuelto aquí" com 3 passos e o botão "Hablar con una persona". Esse botão reenvia com `urgencia: 'nao_urgente'` e `status: 'enviado'`.
  - Localização negada envia sem `lat`/`lng` e mostra "Enviado sin ubicación".
  - Com o interruptor desligado, `pedirLocalizacao` não é chamado.
  - `enviarSOS` rejeitado mostra a mensagem de erro e os 3 links `tel:` em destaque.
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar** conforme a spec §5.3.
  - A contagem é uma barra que esvazia (`scaleX` de 1 para 0, linear, 5 s).
  - A localização é pedida assim que a frase é tocada, em paralelo com a contagem, e o envio espera por ela no máximo até o fim da contagem.
  - Os botões de ligar usam `<a href="tel:…">`.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: commit.** `feat(turista): SOS com contagem, triagem e status ao vivo`

### Tarefa 12: Mapa

**Arquivos:**
- Criar: `src/lib/mapa.ts`, `src/components/turista/Mapa.tsx`, `MapaTelaCheia.tsx`
- Modificar: `LugaresSelo.tsx`, `TelaTurista.tsx`
- Teste: `src/lib/mapa.test.ts`

**Interfaces:**
- Consome: os estabelecimentos e as condições (Tarefa 2); a origem e o município (Tarefa 4)
- Produz:
  - `type Filtro = 'todos' | 'comer' | 'hospedagem' | 'transporte' | 'praias'`
  - `type Pino = { id: string; lat: number; lng: number; tipo: 'lugar' | 'praia'; categoria?: Categoria; bandeira?: Condicao['bandeira'] }`
  - `montarPinos(lugares: Estabelecimento[], praias: (Local & { condicao: Condicao })[], filtro: Filtro): Pino[]`
  - `distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number`, pela fórmula de haversine
  - `formatarDistancia(km: number, idioma: Idioma): string`
  - `<Mapa pinos; centro; aoTocarPino(id) />`, carregado com `dynamic(() => import('./Mapa'), { ssr: false })`

- [ ] **Passo 1: testes que falham.**
  - `montarPinos(..., 'comer')` só tem as categorias restaurante e barraca. `'hospedagem'` tem hotel e pousada. `'praias'` tem só praias, cada uma com `bandeira`. `'todos'` tem tudo.
  - `distanciaKm` entre dois pontos de Itacaré com 1 km de distância fica entre 0,95 e 1,05.
  - `formatarDistancia(0.4, 'es')` = "400 m"; `formatarDistancia(1.234, 'es')` = "1,2 km"; `formatarDistancia(1.234, 'en')` = "1.2 km".
- [ ] **Passo 2: rodar.** Esperado: FAIL.
- [ ] **Passo 3: implementar** conforme a spec §5.2.
  - **Pinos:** `L.divIcon` com o SVG da `Bandeira` para praias e um marcador redondo de marca para lugares.
  - **Tiles:** OpenStreetMap com a atribuição exigida.
  - **Celular:** `MapaTelaCheia` usa `Folha telaCheia`, com filtros em pílulas no topo e um cartão do pino que sobe de baixo (com sombra, porque flutua).
  - **Desktop (`lg:`):** o mapa ocupa a coluna direita com `sticky top-0 h-[100svh]`.
  - **Falha ao carregar:** `onError` dos tiles ou erro de import mostra a lista de lugares (spec §7).
  - **Distâncias:** os cartões de `LugaresSelo` passam a mostrar a distância a partir da origem, ou do centro do município quando não há origem.
- [ ] **Passo 4: rodar.** Esperado: PASS.
- [ ] **Passo 5: verificar no navegador.** No celular, o mapa abre em tela cheia, os filtros funcionam e o pino mostra o cartão. No desktop, o mapa fica fixo enquanto o conteúdo rola.
- [ ] **Passo 6: commit.** `feat(turista): mapa com pinos, filtros e distâncias`

### Tarefa 13: Página de ensaio e verificação final

**Arquivos:**
- Criar: `src/app/ensaio/page.tsx`

**Interfaces:**
- Consome: `publicarAlerta` e `mudarStatusChamado` do mock (Tarefa 2), no mesmo canal `costa-cacau`
- Produz: a rota `/ensaio`, com três botões: "Publicar bandeira vermelha – Concha", "Último chamado: Em atendimento" e "Limpar alertas". É só para ensaiar a demo num computador e será substituída por `/gestao` e `/central`.

- [ ] **Passo 1: implementar `/ensaio`.** Para "Último chamado", a página usa `aoQualquerChamado` e guarda o último id. "Limpar alertas" chama `limparAlertas`. O alerta publicado tem `severidade: 'perigo'`, `localId` da Concha, o texto nos 3 idiomas da spec §3 e `origem: 'Prefeitura de Itacaré'`. Ao publicar, a condição da Concha muda para imprópria, com bandeira vermelha.
- [ ] **Passo 2: roteiro da demo.** Abra `/?origem=pousada-mare` com o navegador em espanhol numa aba e `/ensaio` em outra. Rode os passos 1 a 5 da spec §1 em 390px e depois em 1440px. Todos devem funcionar sem recarregar.
- [ ] **Passo 3: gate da tasteskill.** Rode `npm run build && npm start`, depois `node <skill design-taste-frontend>/scripts/inspect.mjs --app http://localhost:3000/?origem=pousada-mare&lang=es`. Zero FAIL. Abra todas as capturas que ele listar.
- [ ] **Passo 4: `break-ui`.** Rode a skill com: nome de estabelecimento de 60 caracteres, título de alerta longo em espanhol, 5 alertas ativos, praia sem condição ("Sin datos hoy") e município sem lugares com Selo. Corrija o que quebrar e acrescente um teste para cada estado da spec §7 que faltar em `TelaTurista.test.tsx`.
- [ ] **Passo 5: checklist da `mobile-native`.** Verifique: sem `100vh`, safe-area, inputs ≥ 16px, sem realce de toque, hover só em `(hover: hover)`, `theme-color` e alvos ≥ 44px.
- [ ] **Passo 6: rodar tudo.** `npm test && npm run build`. Esperado: tudo verde.
- [ ] **Passo 7: commit.** `feat: página de ensaio e ajustes da verificação`
- [ ] **Passo 8: deploy (pedir confirmação antes).** O deploy na Vercel publica o app na internet e exige a conta da equipe. Peça confirmação, faça o deploy e teste num celular real com o idioma em espanhol.
