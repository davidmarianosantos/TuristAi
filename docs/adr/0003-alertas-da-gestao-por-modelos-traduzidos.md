# A gestão publica alertas a partir de modelos já traduzidos, não de texto livre

O produto promete que a IA traduz cada alerta para PT/ES/EN (CLAUDE.md §6), mas no MVP só os agentes do guia e do SOS estão construídos, e a demo roda sem chave da Gemini. Por isso o /gestao publica alertas escolhendo a praia e um Modelo de alerta com texto pronto nos 3 idiomas, guardado em `components/gestao/`, e usa o `publicarAlerta` que já existe na interface `Ensaio`, com id novo a cada publicação. Texto livre traduzido por IA exigiria uma rota nova e, sem chave, publicaria só em português na frente da banca.

## Consequences

- Cada modelo traz também a condição que impõe à praia (bandeira e situação), como o alerta do `/ensaio`, para o cartão da praia mudar na tela do turista.
- Tradução de alerta por IA continua como "pronta para ligar" no pitch, no mesmo caminho dos agentes já construídos.
