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
  /** avaliações de turistas na plataforma [DEMO] */
  avaliacao: { nota: number; total: number };
};

export type Sessao = {
  id: string;
  idioma: Idioma;
  canal: "qr" | "whatsapp";
  origemId?: string;
};

export type TipoSOS = "roubo" | "medica" | "perdido" | "documentos" | "outro";
export type StatusChamado = "enviado" | "em_atendimento" | "resolvido_ia" | "encerrado";

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
};

export type PraiaHoje = Local & { condicao: Condicao };
