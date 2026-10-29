# Selo é booleano; o plano vem da categoria

O rascunho do modelo de dados (CLAUDE.md §12) previa uma entidade `selo` com plano, status, início, fim e `validado_cadastur_em`. Para o MVP decidimos manter só `Estabelecimento.temSelo: boolean`: nenhum passo do roteiro da demo muda o estado de um Selo, e uma entidade nova exigiria seed e telas para estados (vencido, pendente) que ninguém mostra. O Plano do Selo é derivado da `categoria` pela tabela de preços do CLAUDE.md §4, sem campo próprio. Selo e Cadastur são independentes: um Estabelecimento pode ter Selo sem Cadastur ("em formalização"), como já acontece no seed.

O comentário "provisório" em `tipos.ts` fica como está (contrato só aceita acréscimos); este ADR é a decisão.

## Consequences

- Status, validade e renovação do Selo ficam para a fase 2 do pitch.
- O indicador do CLAUDE.md §8 sai como dois números cruzados: Estabelecimentos com Selo e, entre eles, quantos têm Cadastur.
