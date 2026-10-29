import type { CorBandeira } from "@/data/tipos";

const COR: Record<CorBandeira | "marca" | "branca", string> = {
  verde: "var(--ok)",
  amarela: "var(--warn)",
  vermelha: "var(--danger)",
  branca: "#ffffff",
  cinza: "var(--gray)",
  marca: "var(--accent)",
};

/** A bandeira de praia é o motivo da plataforma: marca, praias, alertas e mapa. */
export function Bandeira({
  cor,
  tamanho = 28,
  mastro = "currentColor",
  titulo,
}: {
  cor: CorBandeira | "marca" | "branca";
  tamanho?: number;
  mastro?: string;
  titulo?: string;
}) {
  return (
    <svg
      width={(tamanho * 28) / 32}
      height={tamanho}
      viewBox="0 0 28 32"
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      className="shrink-0"
    >
      {titulo && <title>{titulo}</title>}
      <rect x="2" width="2.6" height="32" fill={mastro} />
      <path d="M4.6 2h21l-4.2 6.5 4.2 6.5h-21z" fill={COR[cor]} />
    </svg>
  );
}
