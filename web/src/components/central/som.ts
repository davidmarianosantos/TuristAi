// Alerta sonoro de chamado novo, gerado na hora (sem arquivo de áudio).
// O navegador só deixa tocar som depois de um toque do usuário: por isso o "Iniciar turno"
// e o botão de som destravam o áudio.
let ctx: AudioContext | null = null;

export function destravarSom() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    ctx ??= new Ctor();
    void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export const somDestravado = () => !!ctx && ctx.state === "running";

/** Dois toques curtos, agudo e mais agudo: "chegou um urgente". */
export function tocarAlerta(urgente = true) {
  if (!ctx || ctx.state !== "running") return;
  const notas = urgente ? [880, 1175] : [660];
  notas.forEach((freq, i) => {
    const inicio = ctx!.currentTime + i * 0.16;
    const osc = ctx!.createOscillator();
    const ganho = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.14);
    osc.connect(ganho).connect(ctx!.destination);
    osc.start(inicio);
    osc.stop(inicio + 0.15);
  });
}
