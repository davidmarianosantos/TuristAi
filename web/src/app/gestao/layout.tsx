import { Poppins } from "next/font/google";
import "./gestao.css";

// Poppins só no /gestao, na linha visual do ba.gov.br. Se a fonte não vier, o system-ui assume.
const poppins = Poppins({
  variable: "--font-gestao",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${poppins.variable} painel-gestao`}>{children}</div>;
}
