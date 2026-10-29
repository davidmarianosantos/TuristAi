# Tela do turista (`/`) · Design

Hack Turismo Costa do Cacau · Desafio 3. Aprovado com a equipe em 28/10/2026, seção por seção, com mockups em `.superpowers/brainstorm/`.

## 1. Objetivo

O turista (persona: Valentina, argentina, entende pouco português) escaneia um QR no hotel ou na praia e, sem instalar nada, vê no idioma dele: os alertas oficiais de hoje, a situação das praias, lugares com Selo e preços traduzidos, um assistente e um SOS.

**Sucesso na demo** (passos do turista no roteiro do CLAUDE.md):
1. Celular em espanhol abre a tela já em espanhol, com o hotel de origem.
2. O alerta "bandeira vermelha – Praia da Concha" aparece em espanhol.
3. "¿Dónde puedo comer?" responde com lugares com Selo.
4. SOS "Me robaron" é enviado como urgente; a tela acompanha o status.
5. SOS "Perdí mis documentos" é resolvido na hora, sem entrar na fila urgente.

## 2. Decisões já tomadas

| Tema | Decisão |
|---|---|
| Stack | Next.js (App Router) + Tailwind + Leaflet/OpenStreetMap; deploy na Vercel |
| Dados | Mocados no código por ora, atrás de uma camada de dados trocável (§6). Supabase entra depois |
| Navegação | Página única que rola (sem abas) |
| SOS | Rodapé claro fixo: "¿Necesitas ayuda?" + botão SOS contornado em vermelho |
| Envio do SOS | Tocar numa frase envia, com 5 s para cancelar |
| Direção visual | C3 · Faixa índigo, com a paleta da equipe (§4) |
| Paletas | Azul (Frame 5), índigo (Group 1), âmbar (Frame 4), amarelo (Frame 8). Turquesa (Frame 2) e laranja (Frame 3) ficam para os painéis |
| Cores de situação | Seguem as bandeiras de salva-vidas: verde, amarelo, vermelho. Fixas, fora da paleta de marca |

**Consequência aceita dos dados mocados:** sem banco, o alerta ao vivo e o SOS não cruzam aparelhos. Entre abas do mesmo navegador funcionam via `BroadcastChannel` (§6.3), o que permite ensaiar a demo num computador.

## 3. Estrutura da página

De cima para baixo:

1. **Cabeçalho índigo** (campo cheio `#1328a0`): marca (bandeira + nome provisório "Costa do Cacau"), seletor de idioma amarelo, título `h1` "Hoy en Itacaré" (município de origem do QR), linha com data, temperatura e maré `[DEMO]`, e "Te damos la bienvenida · {estabelecimento}" (forma neutra, sem gênero).
2. **Alertas de hoje.** Cartão vermelho-claro com bandeira desenhada, tipo e tempo ("Bandera roja · hace 2 min"), título, texto, fonte oficial e "traducido del portugués". Vários alertas empilham por severidade. **Sem alertas:** uma linha discreta "Sin alertas hoy" com bandeira verde.
3. **Playas hoy.** Uma foto real da região (Wikimedia, com crédito) e a lista de praias do município: bandeira na cor do dia, nome, linha de detalhe, situação (Apta / Precaución / No apta).
4. **Assistente** ("¿Qué quieres saber?"): campo de pergunta e 3 sugestões. Abre a folha do assistente (§5.1).
5. **Lugares con Sello.** Cartões que rolam para o lado: selo, distância, nome, categoria, Cadastur verificado, 2 preços traduzidos. Botão "Ver todos en el mapa" (§5.2).
6. **Teléfonos útiles.** 190 Policía, 192 SAMU, 193 Bomberos, como links `tel:`.
7. **Crédito da foto** no fim da rolagem.

**Fixo no rodapé:** a barra do SOS (§5.3).

**Pílula "↑ Nueva alerta":** quando chega um alerta com a seção 2 fora da tela, uma pílula aparece no topo e, ao tocar, rola até ela.

### 3.1 Responsividade

| Largura | Layout |
|---|---|
| até 767px | Uma coluna, margens de 20px. Mapa só como botão para tela cheia |
| 768–1023px | Uma coluna com até 640px, centralizada; praias em 2 colunas |
| a partir de 1024px | Duas colunas: conteúdo à esquerda (seções 2 a 6), mapa fixo à direita (`position: sticky; height: 100svh`). Cabeçalho ocupa a largura toda |

Regras de celular (skill `mobile-native`):
- Altura com `svh`/`dvh`, nunca `100vh`.
- Rodapé e cabeçalho respeitam `env(safe-area-inset-*)`.
- Inputs com 16px ou mais, para não dar zoom no iOS.
- Sem realce de toque padrão; estados de hover só em `@media (hover: hover)`.
- `overscroll-behavior` contido na folha do assistente e no mapa.
- `theme-color` igual ao índigo do cabeçalho.

## 4. Sistema visual (C3)

**Fonte:** Archivo (400, 500, 600, 800), via `next/font/google`.

**Tamanhos (5, no máximo):** 38px título da página · 22px títulos de seção · 17px nome de praia e destaque · 15px texto · 13px detalhe. Nada funcional abaixo de 12px. Títulos com `letter-spacing` de -0.02 a -0.035em.

**Cores (tokens CSS, mapeados no Tailwind):**

| Token | Valor | Uso |
|---|---|---|
| `--ground` | `#ffffff` | Fundo |
| `--ink` | `#0e2087` | Texto e títulos (Group 1, 900) |
| `--ink-2` | `#3a4a8f` | Texto secundário |
| `--field` | `#1328a0` | Cabeçalho (Group 1, 800) |
| `--surface` | `#f5f6ff` | Superfícies (Group 1, 50) |
| `--surface-2` | `#eceffd` | Sugestões, estado pressionado |
| `--accent` | `#ddac38` | Seletor de idioma, selo (Frame 8) |
| `--blue` | `#1b5ab8` | Links (Frame 5, 700) |
| `--ok` / `--ok-ink` | `#1a8a42` / `#146c33` | Própria, bandeira verde |
| `--warn` / `--warn-ink` | `#ddac38` / `#87630e` | Precaução, bandeira amarela |
| `--danger` / `--danger-ink` / `--danger-bg` | `#c8201a` / `#a8180f` / `#fdeceb` | Imprópria, bandeira vermelha, SOS |

**Regras:**
- Cantos retos nas superfícies.
- Pílula só em botões, no seletor de idioma e nas sugestões.
- Sem gradientes, sem sombras em repouso (só na folha e no cartão do mapa, que flutuam), sem emoji, sem bordas laterais coloridas.
- Superfícies separadas por tom, com 2px de espaço entre linhas.

**A bandeira é o motivo:** um único componente SVG `<Bandeira cor>` serve para a marca, as praias, os alertas e o mapa.

## 5. Componentes interativos

### 5.1 Assistente

- **Folha:** sobe de baixo, em tela cheia no celular e como painel no desktop. Funciona com o teclado aberto (`visualViewport`), e a pergunta inicial vem da sugestão tocada.
- **Respostas:** em texto e, quando cabe, com cartões (lugares, praias).
- **Motor no MVP:** uma função `responder(pergunta, idioma) → Resposta`, que casa palavras-chave nos 3 idiomas com uma das intenções:

  | Intenção | O que responde |
  |---|---|
  | `comer` | Lugares com Selo de comida |
  | `praia_segura` | Situação das praias de hoje |
  | `mare_clima` | Maré e clima [DEMO] |
  | `transporte` | Transportes com Selo |
  | `saude` | Local mais próximo e o 192 |
  | `emergencia` | Oferece abrir o SOS |
  | `nao_entendi` | Mostra as sugestões |

- **Troca futura:** a função é a única porta. Um LLM entra no lugar dela sem mexer na interface.

### 5.2 Mapa

- Leaflet + tiles do OpenStreetMap, carregado só no cliente (`dynamic(..., { ssr: false })`).
- **Pinos por categoria:** comer, hospedagem, transporte e praia; a praia aparece como bandeira da cor do dia. Filtros em pílulas no topo.
- **Tocar num pino** sobe um cartão com nome, categoria, preços traduzidos e distância.
- **No celular** o mapa abre em tela cheia, com botão de voltar e a tecla Esc. **No desktop** fica fixo na coluna da direita.
- **Distância:** em linha reta, a partir da localização do estabelecimento de origem do QR; sem origem, a partir do centro do município. Não pede a localização do turista.

### 5.3 SOS

1. **Rodapé:** "¿Necesitas ayuda?" + botão "SOS".
2. **Folha do SOS, de cima para baixo:**
   - os 3 botões de ligar (190, 192, 193, como `tel:`);
   - as frases prontas: Me robaron · Emergencia médica · Estoy perdido · Perdí mis documentos · Otra cosa (texto livre);
   - o interruptor "Enviar mi ubicación", ligado por padrão.
3. **Envio:** tocar numa frase mostra "Enviando en 5 s… Cancelar" e envia ao fim da contagem. A localização é pedida só agora; se o turista negar, envia sem ela e avisa.
4. **Triagem** com a função `triarSOS(tipo, texto, idioma)`, que devolve a urgência, o texto em português e, quando existe, a resposta automática:
   - **Urgente:** tela "La Central recibió tu aviso", com a linha do tempo Enviado → Esperando atención → En atención, a mensagem original e a traduzida, a localização e o hotel de origem, e o botão "Llamar al 190".
   - **Não urgente** (documentos, informação): tela "Resuelto aquí" com os passos, mais o botão "Hablar con una persona", que reenvia como pedido para a fila normal.
5. **Falha de envio:** a tela mostra o erro e os botões de ligar em destaque. A ligação direta nunca depende do envio.

### 5.4 Idioma

- **Ordem de escolha:** `?lang=` → escolha salva (`localStorage`, com try/catch) → `navigator.languages` → `pt`. Só aceita `pt`, `es` e `en`.
- **Troca** sem recarregar, por um contexto React, e atualiza `<html lang>`.
- **Textos da interface** em `src/i18n/{pt,es,en}.ts`. **Conteúdo** com campos `{ pt, es, en }` nos dados.
- **Datas e números** com `Intl` no idioma ativo. Preços sempre em R$.

### 5.5 Origem do QR

- **URL:** `/?origem=<slug-do-estabelecimento>&lang=es` (o `lang` é opcional).
- **Sessão:** no primeiro acesso cria uma sessão anônima `{ id, idioma, canal: 'qr', origem }`, sem dado pessoal. A origem define o município da página e o hotel que aparece no SOS.
- **Sem `origem`:** abre em Itacaré, sem a linha de boas-vindas.

## 6. Dados

### 6.1 Tipos (provisórios, alinhados ao rascunho do CLAUDE.md §12)

```ts
type Idioma = 'pt' | 'es' | 'en';
type Categoria = 'hotel' | 'pousada' | 'receptivo' | 'condutor' | 'restaurante' | 'barraca' | 'comercio' | 'vida_noturna' | 'transporte';
type TipoSOS = 'roubo' | 'medica' | 'perdido' | 'documentos' | 'outro';
type Traduzido = Record<Idioma, string>;
type Municipio = { id: string; nome: string; lat: number; lng: number };   // centro
type Local = { id: string; municipioId: string; tipo: 'praia' | 'trilha' | 'ponto'; nome: string; lat: number; lng: number };
type Condicao = { localId: string; situacao: 'propria' | 'precaucao' | 'impropria'; bandeira: 'verde' | 'amarela' | 'vermelha'; detalhe: Traduzido; fonte: string; data: string };
type Alerta = { id: string; tipo: string; severidade: 'info' | 'atencao' | 'perigo'; municipioId: string; localId?: string; titulo: Traduzido; texto: Traduzido; origem: string; criadoEm: string; validoAte?: string };
type Estabelecimento = { id: string; slug: string; nome: string; categoria: Categoria; municipioId: string; lat: number; lng: number; cadastur: boolean; temSelo: boolean; descricao: Traduzido; precos: { item: Traduzido; valor: number }[] };
type Sessao = { id: string; idioma: Idioma; canal: 'qr' | 'whatsapp'; origemId?: string };
type ChamadoSOS = { id: string; sessaoId: string; tipo: TipoSOS; urgencia: 'urgente' | 'nao_urgente'; mensagemOriginal: string; mensagemPt: string; idiomaOriginal: Idioma; lat?: number; lng?: number; origemId?: string; status: 'enviado' | 'em_atendimento' | 'resolvido_ia' | 'encerrado'; criadoEm: string };
```

`temSelo: boolean` é provisório, só na camada mock. A decisão "Selo booleano ou com plano, validade e status" continua em aberto no modelo de dados.

### 6.2 Camada de dados

Interface única em `src/data/repositorio.ts`, hoje com implementação mock e, depois, Supabase:

```ts
interface Repositorio {
  municipio(id): Promise<Municipio>;
  alertasAtivos(municipioId): Promise<Alerta[]>;
  condicoesHoje(municipioId): Promise<(Local & { condicao: Condicao })[]>;
  estabelecimentosComSelo(municipioId): Promise<Estabelecimento[]>;
  estabelecimentoPorSlug(slug): Promise<Estabelecimento | null>;
  criarSessao(dados): Promise<Sessao>;
  enviarSOS(dados): Promise<ChamadoSOS>;
  aoNovoAlerta(municipioId, cb): () => void;              // retorna unsubscribe
  aoMudarChamado(chamadoId, cb): () => void;
}
```

As telas só falam com o `Repositorio`, nunca com os arquivos mock diretamente.

### 6.3 Mock

- **Seed** em `src/data/mock/seed.ts`: 8 municípios, praias de Itacaré e Ilhéus, cerca de 8 estabelecimentos fictícios `[DEMO]` em várias categorias, 1 alerta inicial opcional.
- **Coerência:** o seed segue o rascunho do modelo de dados, para migrar ao Supabase sem reescrever as telas. Nenhum estabelecimento real.
- **Tempo real entre abas:** `aoNovoAlerta` e `aoMudarChamado` usam `BroadcastChannel('costa-cacau')`. Assim, uma aba de ensaio publica um alerta e a aba do turista recebe. As telas `/gestao` e `/central` usam o mesmo canal quando existirem.

## 7. Estados

| Situação | O que aparece |
|---|---|
| Sem alertas | "Sin alertas hoy", com bandeira verde |
| Praia sem dado do dia | Situação "Sin datos hoy", em cinza |
| Origem inválida | Abre sem boas-vindas, em Itacaré |
| Sem lugares com Selo | A seção fica, com a frase "Pronto habrá lugares verificados aquí" |
| Mapa não carrega | Lista dos lugares no lugar do mapa |
| Localização negada no SOS | Envia sem ela, com o aviso "Enviado sin ubicación" |
| Envio do SOS falha | Mensagem de erro e botões de ligar em destaque |
| Carregando | Esqueletos no tom de superfície, sem spinner na página |

## 8. Acessibilidade

- **Estrutura:** um `h1` e um `h2`/`h3` por seção; landmarks `header`, `main` e `footer`.
- **Contraste AA** em todo o texto. Cores de situação nunca sozinhas: há sempre palavra e bandeira.
- **Folhas:** são `dialog` com foco preso, Esc para fechar e foco devolvido ao botão de origem.
- **Alerta novo:** anunciado por `aria-live="polite"`.
- **Movimento:** `prefers-reduced-motion` remove deslocamentos e mantém os conteúdos.
- **Toque:** alvos de pelo menos 44 × 44px.

## 9. Movimento

Movimento pequeno e com propósito (skills `emil-design-eng` e `animate` na implementação):
- folhas sobem com mola curta e podem ser interrompidas;
- o cartão de alerta novo entra deslizando de cima;
- a pílula "↑ Nueva alerta" aparece com fade e escala;
- a contagem de 5 s do SOS é uma barra que esvazia;
- os botões têm resposta ao toque (`scale` 0.97).

Só `transform` e `opacity`.

## 10. Estrutura de arquivos

```
src/
  app/
    layout.tsx            fonte, <html lang>, provedor de idioma
    page.tsx              tela do turista (composição das seções)
    globals.css           tokens CSS
  components/turista/
    Cabecalho.tsx  Alertas.tsx  Praias.tsx  AssistenteCampo.tsx
    LugaresSelo.tsx  Telefones.tsx  RodapeSOS.tsx  PilulaNovoAlerta.tsx
    FolhaAssistente.tsx  FolhaSOS.tsx  StatusSOS.tsx  MapaTelaCheia.tsx
  components/ui/
    Bandeira.tsx  Folha.tsx  SeletorIdioma.tsx
  lib/
    assistente.ts         responder()
    triagem.ts            triarSOS()
    idioma.ts             detecção e persistência
    sessao.ts
  i18n/  pt.ts  es.ts  en.ts
  data/
    tipos.ts  repositorio.ts
    mock/  seed.ts  repositorioMock.ts
public/
  img/itacarezinho.jpg    (baixada, com crédito)
```

## 11. Verificação

- **Testes unitários** (Vitest) para `responder`, `triarSOS` e a detecção de idioma, incluindo os casos da demo ("¿Dónde puedo comer?", "Me robaron", "Perdí mis documentos").
- **Roteiro da demo** rodado à mão em 390px com o navegador em espanhol, e em 1440px.
- **Inspeção visual** em 390, 768 e 1440px: `design-taste-frontend` (`inspect.mjs`) e os avisos da `impeccable`.
- **`break-ui`:** nomes longos em espanhol, nenhum alerta, 5 alertas e praia sem dado.
- **Celular de verdade:** teste num aparelho real via deploy na Vercel (a regra da `mobile-native`).

## 12. Fora do escopo desta tela

- Push com o app fechado, modo offline, login e cadastro do turista.
- WhatsApp e Supabase.
- As telas `/gestao`, `/hotel` e `/central`, além do plano de passeio.

## 13. Pendências que não bloqueiam

- Nome da plataforma: "Costa do Cacau" é provisório.
- Selo booleano ou com plano (modelo de dados).
- Formato real do boletim do INEMA (não afeta esta tela, que usa mock).
- Preço do Selo para transporte (não afeta esta tela).
