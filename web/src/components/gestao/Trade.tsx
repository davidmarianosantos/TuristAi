import type { Estabelecimento } from "@/data/tipos";

/** Estabelecimentos com Selo e, entre eles, quantos têm Cadastur (docs/adr/0001). */
export function Trade({ comSelo }: { comSelo: Estabelecimento[] }) {
  const comCadastur = comSelo.filter((e) => e.cadastur).length;
  const numeros = [
    { valor: comSelo.length, rotulo: "Estabelecimentos com Selo" },
    { valor: comCadastur, rotulo: "com Cadastur" },
    { valor: comSelo.length - comCadastur, rotulo: "em formalização" },
  ];
  return (
    <section className="rounded-md bg-card p-5 shadow-1">
      <h2 className="text-[20px] font-extrabold">Trade</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {numeros.map((n) => (
          <div key={n.rotulo} className="rounded-sm bg-surface p-3">
            <p className="text-[32px] font-extrabold leading-none">{n.valor}</p>
            <p className="mt-1 text-[14px] text-ink-2">{n.rotulo}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
