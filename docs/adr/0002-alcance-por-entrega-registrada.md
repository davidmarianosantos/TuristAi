# Alcance medido por Entrega registrada pela tela do turista, só com dados reais

O indicador de destaque do pitch (CLAUDE.md §8) precisa de um registro de quem recebeu cada alerta, e o repositório não sabe isso sozinho: quem tem a Sessão e a lista de alertas ao mesmo tempo é a tela do turista. Decidimos acrescentar ao `Repositorio` um método novo, `registrarPresenca`, que grava a Sessão e as Entregas no mesmo estado em localStorage onde já vivem alertas e chamados, e pedir ao David duas chamadas a ele na `TelaTurista` (ao carregar e quando chega alerta). O painel calcula o Alcance só com o que foi gravado: nada de histórico semeado.

## Considered Options

- **Gravar por dentro do mock, sem tocar na tela do turista** (guardar a "sessão desta aba" em `criarSessao` e registrar a Entrega quando `aoMudarAlertas` dispara): rejeitado porque muda o comportamento de métodos existentes, o que o AGENTS.md §2 proíbe, e depende da ordem de execução do `Promise.all`.
- **Estimar pelas sessões abertas, sem registrar Entrega**: rejeitado porque o número seria inventado.
- **Semear um histórico ("1.240 turistas esta semana")**: rejeitado. O painel fica com números pequenos, mas a banca vê o número mudar ao vivo, e nenhum dado é inventado.

## Consequences

- "No próprio idioma" significa "no idioma da Sessão". Como todo alerta já sai em PT/ES/EN, o painel mostra a quebra por idioma; registrar o idioma do celular fica para a fase 2.
- Na demo, cada "turista" é uma aba do mesmo navegador, aberta com `?lang=` para não herdar o idioma salvo da outra aba.
- A Entrega grava o idioma em que o alerta apareceu de fato (o idioma atual da tela), não o do primeiro acesso.
- Só o canal QR (web app) é medido; o WhatsApp simulado fica de fora no MVP.
- Recarregar uma aba cria uma Sessão nova e baixa o Alcance. Regra de ensaio: não recarregar as abas dos turistas. Reaproveitar a Sessão por `sessionStorage` fica como melhoria.
- Zerar Sessões e Entregas entre ensaios é um método novo, `limparSessoes()`, na interface `Ensaio`, chamado por um botão "Zerar demo" no /gestao. `limparAlertas` continua como está; Entregas de alertas que não existem mais saem do cálculo sozinhas.
