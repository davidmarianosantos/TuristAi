// O que o atendente pode fazer com um chamado. Cada ação vira um evento no histórico,
// que o turista também acompanha na tela do SOS.
import type { Repositorio } from "@/data/repositorio";
import type { ChamadoSOS, Servico, Traduzido } from "@/data/tipos";
import { nomePosto, servicoDe, type Posto } from "./servicos";

const agora = () => new Date().toISOString();

export function assumir(repo: Repositorio, c: ChamadoSOS, posto: Posto) {
  const servico = servicoDe(c) ?? (posto !== "coordenacao" ? posto : undefined);
  return repo.atualizarChamado(
    c.id,
    { status: "em_atendimento", atendidoEm: c.atendidoEm ?? agora(), atendente: nomePosto(posto), servico },
    { tipo: "assumido", servico, texto: nomePosto(posto) },
  );
}

/** Passa para outro serviço: volta para a fila de espera dele, mantendo o histórico. */
export function encaminhar(repo: Repositorio, c: ChamadoSOS, servico: Servico, posto: Posto) {
  return repo.atualizarChamado(
    c.id,
    { status: "enviado", servico, atendente: undefined },
    { tipo: "encaminhado", servico, texto: nomePosto(posto) },
  );
}

export function responderTurista(repo: Repositorio, c: ChamadoSOS, texto: Traduzido) {
  return repo.atualizarChamado(
    c.id,
    { respostas: [...(c.respostas ?? []), { em: agora(), texto }] },
    { tipo: "mensagem", texto: texto.pt },
  );
}

export function encerrar(repo: Repositorio, c: ChamadoSOS, posto: Posto) {
  return repo.atualizarChamado(c.id, { status: "encerrado", encerradoEm: agora() }, { tipo: "encerrado", texto: nomePosto(posto) });
}
