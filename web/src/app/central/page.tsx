import type { Metadata } from "next";
import { Suspense } from "react";
import { AppCentral } from "@/components/central/AppCentral";

// Central Integrada: onde os SOS dos turistas chegam, traduzidos e com triagem sugerida.
export const metadata: Metadata = { title: "Central · TuristAí" };

export default function Page() {
  return (
    <Suspense fallback={<div className="central fixed inset-0" />}>
      <AppCentral />
    </Suspense>
  );
}
