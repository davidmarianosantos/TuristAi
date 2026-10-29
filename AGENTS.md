# Regras de trabalho em equipe (para pessoas e para IAs)

Duas pessoas mexem neste repositório, cada uma no seu PC e com sua própria IA (Claude, Cursor, Copilot…).
O objetivo destas regras é simples: **o que uma pessoa muda não pode quebrar a parte da outra.**
Toda IA que trabalhar aqui deve ler este arquivo inteiro antes de editar qualquer coisa.

O contexto do produto (problema, solução, personas, roteiro da demo) está em `CLAUDE.md`.

## 1. Quem cuida de quê

Cada área tem dona. Mexa só na sua área; na área da outra pessoa, peça antes.

| Área | Dono | Pastas |
|---|---|---|
| Tela do turista (`/`) | David | `web/src/components/turista/`, `web/src/app/page.tsx` |
| WhatsApp simulado (`/chat`) | David | `web/src/components/chat/`, `web/src/app/chat/`, `web/src/lib/chatbot/` |
| Lógica do turista | David | `web/src/lib/assistente.ts`, `triagem.ts`, `idioma.tsx`, `localizacao.ts`, `mapa.ts`, `rotas.ts` |
| Ensaio da demo (`/ensaio`) | David | `web/src/app/ensaio/` |
| Painéis novos (`/gestao`, `/hotel`, `/central`) | colega (preencher o nome) | criar `web/src/app/<painel>/` e `web/src/components/<painel>/` |

**Funcionalidade nova = pasta nova.** Um painel novo vive em `web/src/app/gestao/` + `web/src/components/gestao/` (ou `hotel`, `central`), e nunca dentro de `components/turista/`. Se precisar de um componente da outra área, **importe**, não copie nem altere.

## 2. Arquivos compartilhados (contratos)

Estes arquivos são usados pelas duas partes. Neles, **só acrescente; não renomeie, não apague, não mude o significado** do que já existe:

| Arquivo | O que pode | O que não pode |
|---|---|---|
| `web/src/data/tipos.ts` | novos tipos; novos campos **opcionais** | renomear/remover campos, tornar opcional em obrigatório |
| `web/src/data/repositorio.ts` | novos métodos na interface e no mock | mudar a assinatura ou o comportamento dos métodos existentes |
| `web/src/data/seed.ts` | novos registros `[DEMO]` | apagar ou alterar ids, slugs e dados usados na demo (`pousada-mare`, praia `concha`, alerta da Concha) |
| `web/src/i18n/textos.ts` | chaves novas, **sempre nos 3 idiomas**, com prefixo da área (ex.: `gestaoTitulo`, `centralFila`) | mudar ou remover chaves existentes |
| `web/src/app/globals.css` | tokens novos; estilos novos com escopo de classe (ex.: `.painel-gestao …`, como `html.pagina-chat`) | alterar tokens de `:root`, estilos globais de `body`, `button`, `a` |
| `web/src/app/layout.tsx`, `next.config.ts`, `package.json` | só com combinado entre os dois | trocar fontes, atualizar/remover dependências por conta própria |
| `web/src/components/ui/*` (Folha, Bandeira) | usar à vontade | mudar props ou comportamento sem combinar |

Se uma mudança num contrato for inevitável, ela vai **num PR separado e pequeno**, com o título começando por `contrato:`, e a outra pessoa aprova antes do merge.

## 3. Git

- **Ninguém commita direto na `main`.** Cada um trabalha numa branch própria: `david/<assunto>` ou `<nome>/<assunto>` (ex.: `ana/painel-gestao`).
- Commits pequenos, com mensagem dizendo o que mudou.
- Antes de começar o dia e antes de abrir PR: `git pull --rebase origin main` na sua branch.
- Tudo entra na `main` por Pull Request. Quem não escreveu o PR dá uma olhada antes do merge (2 minutos bastam: a tela da outra pessoa ainda abre?).
- Conflito num arquivo da outra área: **não resolva sozinho apagando o que é do outro.** Chame a pessoa.

## 4. Antes de abrir um PR (checklist)

Rode na pasta `web/`:

```bash
npx tsc --noEmit
npm run build
```

Os dois precisam passar. Depois abra no navegador e confira que **continuam funcionando**:

- `/?origem=pousada-mare&lang=es`: tela do turista, convite do WhatsApp, SOS (triagem + confirmação), assistente, mapa
- `/chat?lang=es&origem=pousada-mare`: boas-vindas e resposta mocada
- `/ensaio`: publicar o alerta da Concha chega na tela do turista em outra aba
- o seu próprio painel

## 5. Regras para IAs (Claude, Cursor, Copilot etc.)

Cole isto no início da conversa se a sua ferramenta não ler `AGENTS.md` sozinha:

1. Leia `AGENTS.md` e `CLAUDE.md` antes de editar.
2. Edite **apenas** arquivos da área da pessoa que está pedindo (seção 1). Para arquivos de contrato (seção 2), só acréscimos; se precisar mudar algo existente, **pare e pergunte**.
3. **Não faça refatorações amplas**, não renomeie arquivos/pastas, não rode formatadores no repositório inteiro, não "limpe" código de outra área.
4. Não atualize, troque nem remova dependências sem pedido explícito.
5. Siga os padrões que já existem: textos sempre por `useIdioma().t(...)` e nos 3 idiomas; dados sempre pelo `Repositorio` (nunca importar `seed.ts` numa tela); cores pelos tokens de `globals.css`; dados de exemplo fictícios e marcados `[DEMO]`.
6. Ao terminar, rode a checklist da seção 4 e diga o que mudou e o que não conseguiu verificar.

## 6. Coisas que já se sabe deste projeto

- **Cache do Next no OneDrive:** se uma mudança de CSS não aparece, pare o servidor, apague `web/.next` e rode `npm run dev` de novo.
- **Teste no celular:** o IP do PC precisa estar em `allowedDevOrigins` (`web/next.config.ts`), senão a página fica azul e não carrega.
- **Dados mocados:** o "tempo real" entre telas é só entre abas do mesmo navegador (`BroadcastChannel`); entre aparelhos diferentes, só quando houver Supabase.
- **Pasta `.superpowers/` e `.claude/`** são locais de cada um e não vão para o Git.
