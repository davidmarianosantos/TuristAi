import { Suspense } from "react";
import { AppTurista } from "@/components/turista/AppTurista";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-field" />}>
      <AppTurista />
    </Suspense>
  );
}
