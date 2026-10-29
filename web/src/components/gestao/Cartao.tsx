/** Cartão Material do painel: título, linha de contexto e, à direita, uma ação ou selo. */
export function Cartao({
  titulo,
  contexto,
  lateral,
  children,
  className = "",
  as: Tag = "section",
}: {
  titulo: string;
  contexto?: React.ReactNode;
  lateral?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article";
}) {
  return (
    <Tag className={`g-cartao flex min-w-0 flex-col p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold leading-snug">{titulo}</h2>
          {contexto && <p className="mt-0.5 text-[13px] text-(--ba-texto-2)">{contexto}</p>}
        </div>
        {lateral && <div className="shrink-0">{lateral}</div>}
      </header>
      <div className="mt-4 flex min-w-0 flex-1 flex-col">{children}</div>
    </Tag>
  );
}

/** Estado vazio digno: diz o que falta e de onde o número vai sair. */
export function Vazio({ titulo, detalhe }: { titulo: string; detalhe?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[4px] border border-(--ba-linha-2) bg-(--ba-fundo) px-4 py-6 text-center">
      <p className="text-[14px] font-medium">{titulo}</p>
      {detalhe && <p className="mt-1 max-w-[34ch] text-[13px] text-(--ba-texto-2)">{detalhe}</p>}
    </div>
  );
}
