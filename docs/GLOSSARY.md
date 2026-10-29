# TuristAí

A camada que liga serviços públicos, trade e turista na Costa do Cacau, no idioma do turista.

## Language

### Trade

**Estabelecimento**:
Negócio do trade turístico (hotel, pousada, receptivo, condutor, restaurante, barraca, comércio, vida noturna ou transporte) que atende o turista na região.
_Avoid_: parceiro, empresa, comércio (como termo geral)

**Selo**:
Assinatura mensal paga por um Estabelecimento para ser divulgado ao turista: destaque no mapa e nas recomendações do assistente. Um Estabelecimento tem ou não tem Selo; não há estados intermediários.
_Avoid_: selo verificado, certificação, plano ativo

**Plano do Selo**:
O valor mensal do Selo, determinado pela categoria do Estabelecimento (por exemplo, barraca R$ 29, pousada R$ 149, hotel R$ 299).
_Avoid_: pacote, tier

**Cadastur**:
A regularidade do Estabelecimento no cadastro do Ministério do Turismo. Independe do Selo.
_Avoid_: verificado, formalizado (como sinônimos de Selo)

**Em formalização**:
Estabelecimento com Selo e sem Cadastur.

### Turista e alertas

**Alerta**:
Aviso oficial sobre um município ou local, publicado nos 3 idiomas, com severidade e validade.
_Avoid_: aviso, notificação, comunicado

**Modelo de alerta**:
Texto de alerta pronto e já traduzido (por exemplo, "bandeira vermelha"), que a gestão aplica a um local para publicar.
_Avoid_: template, rascunho

**Repassar**:
O que o Estabelecimento faz com um Alerta: entregar o texto oficial ao seu cliente, no idioma dele.
_Avoid_: encaminhar, compartilhar

**Sessão**:
Um acesso anônimo de um turista à plataforma, com idioma, canal e Estabelecimento de origem (o QR escaneado). Não identifica a pessoa.
_Avoid_: usuário, cadastro, visitante

**Município da sessão**:
O município do Estabelecimento de origem da Sessão; sem origem, o município padrão.

**Entrega**:
O registro de que um alerta apareceu na tela de uma Sessão aberta, em um idioma e em um momento.
_Avoid_: envio, notificação, visualização

**Alcance**:
De um alerta: a fração das Sessões do município abertas no dia que tiveram Entrega daquele alerta, quebrada por idioma.
_Avoid_: engajamento, audiência, impacto

**Tempo até chegar**:
O intervalo entre a publicação de um alerta e as suas Entregas (primeira e mediana).
_Avoid_: latência, tempo de resposta (este é do SOS)
