import { Suspense } from "react";
import { AppChat } from "@/components/chat/AppChat";

// WhatsApp simulado: representa o canal do chatbot na demo.
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-field" />}>
      <AppChat />
    </Suspense>
  );
}
