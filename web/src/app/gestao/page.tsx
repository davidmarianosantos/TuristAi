import type { Metadata } from "next";
import { AppGestao } from "@/components/gestao/AppGestao";

// Painel da gestão: publica Alertas para a região e mostra o Alcance deles.
export const metadata: Metadata = { title: "Gestão · TuristAí" };

export default function Page() {
  return <AppGestao />;
}
