"use client";

import { createContext, useContext } from "react";
import { repositorio, type Repositorio } from "@/data/repositorio";

const Ctx = createContext<Repositorio | null>(null);

export function RepositorioProvider({ repo, children }: { repo?: Repositorio; children: React.ReactNode }) {
  return <Ctx.Provider value={repo ?? repositorio()}>{children}</Ctx.Provider>;
}

export function useRepositorio() {
  const r = useContext(Ctx);
  if (!r) throw new Error("useRepositorio fora do RepositorioProvider");
  return r;
}
