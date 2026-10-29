# TuristAí · Hack Turismo Costa do Cacau (Desafio 3)

Plataforma que liga serviços públicos, trade e turista na Costa do Cacau, no idioma do turista (PT/ES/EN).
Contexto completo do produto em [`CLAUDE.md`](CLAUDE.md). **Antes de mexer, leia [`AGENTS.md`](AGENTS.md)** (quem cuida de quê e como não quebrar a parte do outro).

## Rodar

```bash
cd web
npm install
npm run dev
```

- Tela do turista: <http://localhost:3000/?origem=pousada-mare&lang=es>
- WhatsApp simulado: <http://localhost:3000/chat?lang=es&origem=pousada-mare>
- Ensaio da demo (publica o alerta da Concha em outra aba): <http://localhost:3000/ensaio>

Todos os dados são fictícios e marcados `[DEMO]`.
