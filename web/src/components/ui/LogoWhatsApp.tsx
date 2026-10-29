import { Phone } from "lucide-react";

/**
 * Marca do WhatsApp desenhada em SVG (balão com telefone). Usada só para indicar o canal
 * na demo: a página /chat simula o WhatsApp porque a integração real (Twilio) fica para depois.
 */
export function LogoWhatsApp({ tamanho = 24, cor = "#fff" }: { tamanho?: number; cor?: string }) {
  return (
    <span aria-hidden className="relative inline-flex shrink-0 items-center justify-center" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" className="absolute inset-0">
        <path
          d="M12 2.4a9.6 9.6 0 0 0-8.3 14.4L2.4 21.6l4.9-1.3A9.6 9.6 0 1 0 12 2.4z"
          stroke={cor}
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
      <Phone size={tamanho * 0.42} strokeWidth={2.6} style={{ color: cor, fill: cor }} className="relative -translate-y-[0.5px] translate-x-[0.5px]" />
    </span>
  );
}

export const VERDE_WHATSAPP = "#25D366";
