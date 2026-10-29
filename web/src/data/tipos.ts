export type Idioma = "pt" | "es" | "en";
export type Traduzido = Record<Idioma, string>;

export type Categoria =
  | "hotel"
  | "pousada"
  | "receptivo"
  | "condutor"
  | "restaurante"
  | "barraca"
  | "comercio"
  | "vida_noturna"
  | "transporte";

export type Municipio = { id: string; nome: string; lat: number; lng: number };

export type Local = {
  id: string;
  municipioId: string;
  tipo: "praia" | "trilha" | "ponto";
  nome: string;
  lat: number;
  lng: number;
};

export type Situacao = "propria" | "precaucao" | "impropria" | "sem_dados";
export type CorBandeira = "verde" | "amarela" | "vermelha" | "cinza";

export type Condicao = {
  localId: string;
  situacao: Situacao;
  bandeira: CorBandeira;
  detalhe: Traduzido;
  fonte: string;
  data: string;
};

export type Severidade = "info" | "atencao" | "perigo";

export type Alerta = {
  id: string;
  tipo: string;
  severidade: Severidade;
  municipioId: string;
  localId?: string;
  titulo: Traduzido;
  texto: Traduzido;
  origem: string;
  criadoEm: string;
  validoAte?: string;
  /** condição que o alerta impõe ao local enquanto estiver ativo */
  condicao?: { situacao: Situacao; bandeira: CorBandeira; detalhe: Traduzido };
};

export type Preco = { item: Traduzido; valor: number };

export type Estabelecimento = {
  id: string;
  slug: string;
  nome: string;
  categoria: Categoria;
  municipioId: string;
  lat: number;
  lng: number;
  cadastur: boolean;
  /** provisório: a modelagem do Selo ainda está em aberto */
  temSelo: boolean;
  descricao: Traduzido;
  precos: Preco[];
  /** onde fica, em poucas palavras (bairro ou praia) */
  local: string;
  /** avaliações de turistas na plataforma (fictícias no protótipo) */
  avaliacao: { nota: number; total: number };
  /** endereço e contato para a folha de detalhes (fictícios no protótipo) */
  endereco?: string;
  telefone?: string;
  horario?: Traduzido;
  /** foto do cartão, caminho em /public; sem foto, o cartão mostra o ícone da categoria */
  foto?: string;
};

export type TipoAtrativo = "trilha" | "mirante" | "passeio" | "aventura" | "cultura" | "cacau";

/** Ponto turístico ou passeio: lugar público, sem Selo nem avaliação. */
export type Atrativo = {
  id: string;
  municipioId: string;
  tipo: TipoAtrativo;
  /** nome oficial do lugar, em português (é o que vai na busca do mapa) */
  nome: string;
  /** o nome para o turista ler, no idioma dele */
  nomes: Traduzido;
  /** sem coordenadas quando não é um ponto só (ex.: visitas a fazendas da região) */
  lat?: number;
  lng?: number;
  /** caminho da foto em /public */
  foto: string;
  /** uma linha para o cartão */
  resumo: Traduzido;
  /** um parágrafo para a folha de detalhes */
  descricao: Traduzido;
  /** o que saber antes de ir */
  dicas: Traduzido[];
  /** duração ou extensão do percurso, quando faz sentido */
  duracao?: Traduzido;
};

export type Sessao = {
  id: string;
  idioma: Idioma;
  canal: "qr" | "whatsapp";
  origemId?: string;
};

export type TipoSOS = "roubo" | "medica" | "perdido" | "documentos" | "outro";
export type StatusChamado = "enviado" | "em_atendimento" | "resolvido_ia" | "encerrado";

/** Serviços que recebem chamados na Central Integrada. */
export type Servico = "policia" | "samu" | "bombeiros" | "turismo";

export type EventoChamado = {
  em: string;
  tipo: "aberto" | "resolvido_ia" | "assumido" | "encaminhado" | "mensagem" | "encerrado";
  servico?: Servico;
  /** quem fez (posto da Central) ou o texto da mensagem, conforme o tipo */
  texto?: string;
};

export type ChamadoSOS = {
  id: string;
  sessaoId: string;
  tipo: TipoSOS;
  urgencia: "urgente" | "nao_urgente";
  mensagemOriginal: string;
  mensagemPt: string;
  idiomaOriginal: Idioma;
  lat?: number;
  lng?: number;
  origemId?: string;
  status: StatusChamado;
  criadoEm: string;
  // ---- preenchidos pela triagem e pela Central (opcionais: chamados antigos não têm) ----
  /** serviço responsável; sem valor = a triagem não soube dizer (triagem humana) */
  servico?: Servico;
  /** por que a triagem decidiu assim, em português, para o atendente */
  motivoTriagem?: string;
  /** primeira vez que alguém da Central assumiu (base do indicador de tempo até atendimento) */
  atendidoEm?: string;
  encerradoEm?: string;
  /** posto que está atendendo agora */
  atendente?: string;
  /** mensagens da Central para o turista, já nos 3 idiomas */
  respostas?: { em: string; texto: Traduzido }[];
  historico?: EventoChamado[];
  /** ficha montada pelo agente de IA a partir do texto livre (ausente nos chamados por frase pronta) */
  ficha?: FichaSOS;
};

/** Classificação do agente de SOS. */
export type TipoOcorrencia = "saude" | "seguranca" | "mar" | "perdido" | "documento" | "informacao";

/** O que o agente de SOS entrega à Central: tudo em português, pronto para o atendente. */
export type FichaSOS = {
  tipo: TipoOcorrencia;
  urgencia: "urgente" | "nao_urgente";
  /** até ~12 palavras, em português */
  resumoPt: string;
  /** a mensagem do turista traduzida para o português */
  mensagemPt: string;
  idioma: Idioma;
  servico?: Servico;
  /** por que classificou assim, em português */
  motivo: string;
  /** orientação imediata dada ao turista, no idioma dele */
  orientacao: string;
  /** passos para o turista resolver sozinho (não urgente), no idioma dele */
  passos: string[];
  local?: { lat: number; lng: number } | null;
  hotel?: string | null;
  /** pistas que a triagem encontrou no texto, em português (ex.: “cuchillo” → faca) */
  sinais: string[];
};

export type PraiaHoje = Local & { condicao: Condicao };

// ---- Alcance dos alertas (painel da gestão; ver docs/adr/0002) ----

/** Registro de que um Alerta apareceu na tela de uma Sessão aberta. */
export type Entrega = { alertaId: string; sessaoId: string; idioma: Idioma; em: string };
/** Sessão gravada pela tela do turista, com o município dela e quando abriu. */
export type SessaoAberta = Sessao & { municipioId: string; abertaEm: string };
export type SessoesEEntregas = { sessoes: SessaoAberta[]; entregas: Entrega[] };
