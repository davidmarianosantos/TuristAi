# Hack Turismo Costa do Cacau · Desafio 3

Contexto do projeto para o Claude Code. Atualizado em 28/10/2026.

## Como trabalhar neste projeto

- **Trabalho em dupla:** antes de editar, leia `AGENTS.md`. Ele define quem cuida de cada pasta, quais arquivos são contratos compartilhados (só acréscimos) e a checklist antes de PR. Edite só a área de quem está pedindo.
- O código está em `web/` (Next.js + Tailwind + Leaflet, dados mocados atrás de `web/src/data/repositorio.ts`).

- Responda em português.
- Avance **um passo por vez** e confirme com a equipe antes de seguir. Não pule etapas (por exemplo, não escreva plano de implementação antes de o modelo de dados estar fechado).
- Ao propor decisões, dê 2 ou 3 opções com uma recomendação.
- Dados de exemplo: estabelecimentos fictícios com nomes inventados (sem marcação `[DEMO]`) e fotos ilustrativas de licença livre; atrativos são lugares públicos reais da região. Não use nomes de estabelecimentos reais nem invente números de pesquisa.
- Hackathon presencial na UESC, 28 e 29/10/2026, com submissão em 29/10 até 12h: prefira o mais simples que funcione na demo.

---

## 1. O problema

**Desafio 3 do Hack Turismo: Plataforma Integrada de Serviços, Segurança e Experiência do Visitante.**

A Costa do Cacau reúne 8 municípios: Canavieiras, Ilhéus, Itabuna, Itacaré, Pau Brasil, Santa Luzia, Una e Uruçuca. A oferta turística da região é fragmentada:

- **Serviços públicos isolados.** Saúde, polícia, bombeiros e balneabilidade não conversam com hotéis, pousadas, receptivos e condutores.
- **Informação de risco sem canal.** Alertas de praia, mar e clima chegam ao turista por placa, PDF ou boca a boca. Hoje não existe um fluxo do órgão público para o hotel nem do hotel para o hóspede.
- **Sem idioma.** A Bahia recebeu 202.335 estrangeiros em 2025, quase o dobro de Pernambuco. Mesmo assim, quase nada atende o turista em espanhol ou inglês, e os hispanofalantes são o maior grupo estrangeiro no Nordeste.
- **Sem dados.** Sistematizar dados da demanda turística é meta da região desde o plano do APL de 2008 e nunca foi cumprida. O PDITS 2015 cita "Serviços de Atenção ao Turista desativados", "baixa cooperação empresarial e entre os municípios" e "informalidade das empresas de turismo".
- **Trade pouco profissionalizado.** Dos 388 meios de hospedagem ativos da região, 77,6% são microempresas, com pouca presença digital (estudo da UESC, 2025).

**Referência regional (benchmark de Recife).** Recife integrou os órgãos públicos entre si e tem WhatsApp oficial com escala (o Conecta Zap tem 410 mil cadastrados). Mas o serviço é feito para o morador, só em português, e os alertas não passam pelo trade até o hóspede. Pernambuco publica boletim de balneabilidade desde 1986, e nenhum hotel o recebe de forma estruturada. A Costa do Cacau pode liderar exatamente onde Recife parou.

Critérios da banca (nota de 1 a 5 em cada): aderência ao problema regional; inovação; maturidade do MVP (técnica, design, UX); viabilidade econômica e escalabilidade; pitch e respostas à banca.

## 2. A solução

**Em uma frase:** a camada que liga serviços públicos, trade e turista na Costa do Cacau, no idioma do turista (PT/ES/EN), com IA.

**Como funciona:**
1. Um órgão público publica um alerta, ou a plataforma o puxa sozinha de fontes oficiais.
2. A IA traduz o alerta para PT/ES/EN e identifica as praias, os locais e o trade afetados.
3. Hotéis e demais estabelecimentos recebem o alerta pronto para repassar.
4. O turista recebe o alerta no celular, no idioma dele, sem instalar nada (abre por QR Code).
5. Se algo der errado, o turista aciona o SOS. A mensagem chega traduzida à Central Integrada, com localização e hotel de origem.
6. O painel da gestão mede quantos turistas foram alcançados e em quanto tempo.

**Por que é diferente do que existe:**

| Referência | O que faz | O que falta |
|---|---|---|
| Conecta Recife | Super-app e WhatsApp com escala | Feito para o morador, só em português; alertas não passam pelo trade |
| MarIA (Porto de Galinhas) | Assistente no WhatsApp, resolve 96,4% sem humano | Comercial; sem serviço público nem SOS |
| Apps de turismo e OTAs | Vendem hospedagem e passeios | Sem segurança nem integração com o poder público |

Nenhuma delas liga o dado oficial, o trade verificado e o turista estrangeiro no idioma dele. Esse é o espaço da proposta.

## 3. Os atores e o valor para cada um

É uma **plataforma multilateral**: o poder público e o trade pagam, e o turista usa de graça.

### Turista (centro da experiência, não paga)
- **Quem é:** visitante nacional ou estrangeiro, com foco nos hispanofalantes.
- **Dor:** não sabe se a praia está própria, em quem confiar nem como pedir socorro em outro idioma.
- **Recebe:**
  - alertas oficiais em minutos, no idioma dele, em vez de um PDF semanal em português;
  - assistente que responde 24h;
  - mapa de estabelecimentos verificados com preços traduzidos;
  - SOS com tradução e localização.
- **Acesso:** QR Code no hotel, nas barracas, nas praias, no aeroporto e no porto de Ilhéus. O QR abre um web app no idioma do celular, sem instalar nada. Também funciona pelo WhatsApp.

### Poder público (cliente pagante principal)
- **Quem é:** as prefeituras dos 8 municípios, contratando juntas via consórcio intermunicipal ou Setur-BA.
- **Dor:** é cobrado quando algo acontece com um turista, mas não tem canal com o trade, nem dados, nem atendimento em outros idiomas.
- **Recebe:**
  - canal oficial de alertas automatizado com IA;
  - Central Integrada que recebe os SOS dos turistas;
  - painel de indicadores;
  - cobertura de todo o trade do município, que recebe os alertas de graça.
- **Relação:** consultiva, com implantação acompanhada, treinamento das equipes e relatório de indicadores a cada temporada para sustentar a renovação.

### Trade (paga pelo Selo)
- **Quem é:** hotéis, pousadas, receptivos, condutores, restaurantes, barracas de praia, comércio, vida noturna e **empresas de transporte** (táxis, transfers, vans, ônibus intermunicipais, locadoras, travessias de barco).
- **Dor:** disputa a confiança do turista com o informal, não tem preço traduzido e não recebe informação oficial para repassar.
- **Recebe de graça** (coberto pelo contrato público): os alertas oficiais, prontos para repassar ao cliente.
- **Recebe com o Selo, que é pago:**
  - **divulgação ao turista**, com destaque no mapa e nas recomendações do assistente;
  - validação pelo Cadastur;
  - QR Code verificável;
  - tabela de preços em 3 idiomas;
  - relatório de quantos turistas viram o estabelecimento.
- **Papel duplo do hotel:** é o principal canal de distribuição do QR e dos alertas (grátis) e também anunciante quando assina o Selo.
- **Contribui com dados:** quem tem Selo pode reportar condições do local (bandeira vermelha, mar agitado), validadas pela IA.

**Ciclo que se reforça:** a prefeitura paga a infraestrutura; os hotéis espalham o QR; os turistas chegam; os negócios com Selo ganham clientes; e o painel prova o resultado na hora de renovar o contrato.

## 4. Como o negócio ganha dinheiro

| Fonte | Como funciona | Valor (hipótese a validar) |
|---|---|---|
| **Contrato regional** (motor) | Assinatura anual única para os 8 municípios, rateada por porte (Ilhéus e Itabuna maiores; Itacaré médio; os outros 5 menores). Inclui Central, alertas com IA, painel e alertas grátis para todo o trade | R$ 25 a 40 mil por mês para a região (R$ 300 a 480 mil por ano) |
| **Selo do trade** | Assinatura mensal por categoria, com promoções pontuais de meses grátis em campanhas com o Sebrae | R$ 29 condutores e barracas · R$ 79 restaurantes e comércio · R$ 149 receptivos e pousadas · R$ 299 hotéis · transporte: a definir |
| **Turista** | Grátis, subsidiado pelo contrato e pelo Selo | — |

- **Sem comissão por transação:** decisão da equipe, porque rastrear valores de venda é difícil. A receita fica previsível.
- **Projeção para o 2º ano:** cerca de R$ 650 mil por ano na Costa do Cacau (contrato de R$ 360 mil + 300 Selos a uma média de R$ 80 por mês). A média tende a subir com os hotéis a R$ 299.
- **Expansão:** o mesmo pacote vendido para outras zonas turísticas da Bahia (Costa do Dendê, Costa do Descobrimento) e do Nordeste.
- **Fomento até o primeiro contrato:** Destino Turístico Inteligente (DTI, do Ministério do Turismo), Prodetur, Destino Futuro (Sudene, Embratur e Porto Digital; aceita projetos da Bahia) e Sebrae.

**Custos (cerca de 75% fixos):**
- equipe de produto, desenvolvimento e operação (o maior custo);
- vendas institucionais e implantação nos 8 municípios;
- nuvem, IA e WhatsApp Business, cobrados por volume;
- placas e displays de QR, com reposição por desgaste e vandalismo;
- jurídico e LGPD.

## 5. Como os dados se mantêm vivos

Lição de Recife: o app de praias seguras de lá atrasou 4 anos por falta de quem alimentasse o dado. Aqui, o modelo é híbrido:

- **Automático (o grosso):** balneabilidade do INEMA, clima e chuva do INMET, avisos da Marinha e marés, lidos, estruturados e traduzidos pela IA.
- **Órgãos públicos:** publicam só o extraordinário (interdição, evento, ocorrência), em poucos cliques.
- **Trade com Selo:** reporta o que vê no local; a IA cruza com as fontes oficiais antes de publicar.

A plataforma nunca fica vazia, mesmo que ninguém poste nada.

## 6. Onde entra a IA

| Ponto | O que a IA faz |
|---|---|
| Extração | Lê boletins (PDF ou tabela) e transforma em "praia X: própria ou imprópria" |
| Tradução | Publica cada alerta em PT/ES/EN em linguagem de turista |
| Validação | Cruza relatos do trade com fontes oficiais; casos duvidosos vão para revisão humana |
| Assistente | Responde ao turista no idioma dele, com dados oficiais e estabelecimentos com Selo |
| **Triagem do SOS** | Classifica antes do humano: o urgente vai direto ao atendente, já traduzido e classificado; o não urgente (documento perdido, informação) a IA resolve na hora. Nenhum caso urgente fica retido. Precedente: a IA "Mike" do 190 de São Paulo |
| Painel | Resumos automáticos da semana para a gestão |

A IA **apoia** o atendente humano e não decide sozinha em emergência. A ligação direta para 190/192/193 está sempre disponível.

**No MVP não há chave de API de LLM.** Essas funções são simuladas por regras e respostas prontas, atrás de interfaces que podem ser trocadas por um LLM depois. No pitch, isso vira "arquitetura pronta para IA".

## 7. Parceiros-chave

| Parceiro | Papel |
|---|---|
| **Cadastur (Ministério do Turismo)** | Base de validação automática do Selo; incentiva a formalização do trade; ponte para o programa DTI |
| Consórcio intermunicipal e Setur-BA | Compradores do contrato regional |
| Sebrae Bahia | Leva o Selo ao trade; campanhas de meses grátis |
| Bombeiros, SAMU e PM | Recebem o SOS pelo 190, 192 e 193 |
| INEMA, INMET e Marinha | Fontes de dados dos alertas |
| UESC, PCTSul e CEPEDI | Pesquisa, validação e incubação |
| ABIH e associações de barraqueiros e condutores | Adesão do trade e distribuição dos QR Codes |

## 8. Indicadores (painel da gestão)

- **Alcance (destaque do pitch):** % de turistas que receberam o alerta oficial no próprio idioma. Mede exatamente a integração que Recife não tem.
- **Segurança:** tempo entre o SOS e o atendimento.
- **Economia:** número de estabelecimentos com Selo ativo e regulares no Cadastur.

## 9. Premissas mais arriscadas

| Premissa | Evidência | Risco | Como testar |
|---|---|---|---|
| Consórcio ou Setur-BA paga R$ 300 a 480 mil por ano | Baixa | Alto | Apresentar a um secretário de turismo ou mentor e pedir carta de intenção |
| Hotéis exibem o QR na recepção e nos quartos | Baixa | Alto | 5 pousadas em Ilhéus e Itacaré por 2 semanas, contando escaneamentos |
| Turista estrangeiro escaneia o QR e usa durante a estadia | Média | Alto | Mesmo teste acima, por idioma |
| Dados do INEMA, INMET e Marinha permitem automatizar | Média | Alto | Confirmar o formato do boletim do INEMA |
| Trade paga R$ 29 a 299 por mês pelo Selo | Baixa | Médio | Pré-venda com 20 estabelecimentos |
| Bombeiros, SAMU e PM aceitam chamados e confiam na triagem da IA | Baixa | Alto | Conversa com os órgãos |

Riscos e respostas:
- **Venda pública lenta:** implantação em ondas e fomento para o início.
- **Dados públicos atrasados:** várias fontes e relatos do trade.
- **Erro em emergência:** a IA só apoia, e a ligação direta está sempre disponível.
- **LGPD:** coleta mínima, consentimento e localização só no SOS.
- **Baixa adesão ao Selo:** meses grátis e a demanda do turista por estabelecimentos verificados.

## 10. Personas (fictícias, baseadas na pesquisa)

- **Valentina, 34, turista argentina.** Está 7 dias em Itacaré com o marido e o filho de 5 anos e entende pouco português. Quer praia segura e preço claro; tem medo de não ser entendida numa emergência. "Quiero disfrutar sin miedo de no entender nada si algo pasa."
- **Marta, 52, dona de pousada de 12 quartos em Itacaré.** Não tem ninguém que fale espanhol na recepção e responde as mesmas perguntas o dia todo. Fica sabendo de praia imprópria pelo hóspede. Selo: R$ 149.
- **Edvaldo, 45, barraqueiro na orla de Ilhéus, sem Cadastur.** Perde cliente porque o turista desconfia do preço, e vê o mar agitado antes de qualquer órgão. Selo: R$ 29. Mostra que o Selo empurra o trade para a formalização.
- **Cláudia, 47, secretária de turismo.** É cobrada quando algo acontece com um turista, mas não tem dados nem canal com o trade. Quer um destino seguro e resultado para mostrar. Decide pelo contrato regional.

---

## 11. Produto (MVP para a demo)

- **Canais:** web app (PWA) responsivo aberto por QR Code, que é o principal, e WhatsApp via sandbox do Twilio, secundário.
- **Telas:** `/` turista · `/gestao` painel da gestão · `/hotel` painel do trade · `/central` Central Integrada simulada.
- **Tela do turista:**
  - seletor PT/ES/EN, que detecta o idioma do celular;
  - alertas de hoje;
  - praias com a situação do dia;
  - mapa de estabelecimentos com Selo;
  - assistente;
  - botão SOS fixo, com os números 190/192/193 para ligar, frases prontas traduzidas e envio à Central com localização e hotel de origem.
- **Fora do MVP** (vira "próximos passos" no pitch): plano de passeio com alerta de não retorno, push com o app fechado, offline, relatos do trade, login, cadastro do turista.

**Roteiro da demo (menos de 3 min):**
1. Celular em espanhol escaneia o QR do hotel.
2. Gestão publica "bandeira vermelha – Praia da Concha".
3. O alerta aparece no celular em espanhol e no painel do hotel.
4. O turista pergunta ao assistente: "¿Dónde puedo comer?".
5. SOS "Me robaron": a Central recebe "Fui roubado", urgente, com o hotel de origem.
6. SOS "Perdí mis documentos": a IA resolve, e o chamado não entra na fila urgente.
7. O atendente clica em "Em atendimento", e os indicadores mudam no painel.

**Decisões técnicas:**
- **Stack:** ponto de partida ainda não confirmado pela equipe. Next.js 14 + Supabase (Postgres + Realtime) + Tailwind + Leaflet/OpenStreetMap, com deploy na Vercel.
- **Banco real com dados mocados.** O conteúdo de exemplo é mocado; as interações (alerta chegar, SOS aparecer na Central) são reais entre aparelhos.
- **Sem login no MVP.** Risco aceito; no pitch, "fase 2: autenticação".
- **Turista anônimo.** Cada acesso cria uma sessão sem dado pessoal (só idioma, canal e origem).

## 12. Modelo de dados: EM DEFINIÇÃO (próximo passo)

Rascunho (✅ = MVP):

| Entidade | Campos principais | MVP |
|---|---|---|
| municipio | nome, porte | ✅ |
| local (praia, trilha, ponto turístico) | municipio, tipo, nome, lat/lng | ✅ |
| condicao_local | local, propria, bandeira, fonte, data | ✅ |
| estabelecimento | nome, categoria, municipio, lat/lng, cadastur, descricao e precos PT/ES/EN | ✅ |
| selo | estabelecimento, categoria de preço, status, inicio, fim, validado_cadastur_em | simplificado |
| usuario | nome, papel (gestao, central, trade), municipio ou estabelecimento | ❌ |
| alerta | tipo, severidade, municipio, local?, texto PT/ES/EN, origem, validade | ✅ |
| relato_trade | estabelecimento, local, tipo, status da validação, confiança | ❌ |
| sessao_turista | idioma, canal, estabelecimento de origem (QR) | ✅ |
| entrega_alerta | alerta, sessao, idioma, canal | ✅ |
| chamado_sos | sessao, tipo, urgencia, mensagem original e em PT, lat/lng, estabelecimento de origem, status, horários | ✅ |
| conversa_assistente | sessao, pergunta, intencao, resposta | ❌ |

Categorias do trade: hotel, pousada, receptivo, condutor, restaurante, barraca, comercio, vida_noturna, transporte.

- **Já decidido:** banco real com seed mocado; turista anônimo.
- **Próxima decisão:** o Selo é só "tem ou não tem" (booleano), ou já modelamos plano, validade e status?
- **Depois:** confirmar as demais entidades e campos, um bloco por vez.

## Pendências em aberto

- **Nome da plataforma: decidido, TuristAí** (logo com mascote do cacau em web/public/img/logo-turistai.png). Um canvas antigo usava "Olá Cacau", com um modelo de negócio desatualizado: não use aquele modelo.
- **Preço do Selo para transporte.** Sugestão: R$ 79, ou R$ 149 para transfers e locadoras.
- **Formato real do boletim de balneabilidade do INEMA** (CSV ou PDF).
- **Pesquisa sobre IA em centrais de emergência (docx do Gemini).** Ela perdeu todos os números na exportação: não cite números dela sem conferir a fonte.

## Artefatos

- Design do negócio (documento): https://claude.ai/artifact/FXPjRKG4YrKR5kLv1Qc92B
- Business Model Canvas, premissas e personas (canvas visual): https://claude.ai/artifact/CArdazrBtD7zq25j4V1xbf
