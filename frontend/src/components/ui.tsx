import type { InputHTMLAttributes, ReactNode } from "react";

export const botao = {
  primario:
    "inline-flex items-center justify-center gap-2 rounded-full bg-framboesa px-5 py-3 font-semibold text-white transition-colors hover:bg-framboesa-escura disabled:cursor-not-allowed disabled:opacity-50",
  secundario:
    "inline-flex items-center justify-center gap-2 rounded-full border border-tinta/15 bg-superficie px-5 py-3 font-semibold text-tinta transition-colors hover:border-tinta/40 disabled:cursor-not-allowed disabled:opacity-50",
  texto: "font-semibold text-framboesa underline-offset-4 hover:underline",
};

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  erro?: string;
  ajuda?: ReactNode;
}

export function Campo({ rotulo, erro, ajuda, id, className = "", ...resto }: CampoProps) {
  const campoId = id ?? resto.name;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="mb-1.5 block text-sm font-semibold">
        {rotulo}
      </label>
      <input
        id={campoId}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${campoId}-erro` : undefined}
        className={`w-full rounded-xl border bg-superficie px-4 py-3 text-base outline-none transition-colors focus:border-framboesa ${
          erro ? "border-alerta" : "border-linha"
        }`}
        {...resto}
      />
      {erro ? (
        <p id={`${campoId}-erro`} className="mt-1.5 text-sm text-alerta">
          {erro}
        </p>
      ) : (
        ajuda && <div className="mt-1.5 text-sm text-suave">{ajuda}</div>
      )}
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-suave">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-framboesa border-t-transparent" />
      {texto}
    </div>
  );
}

export function AvisoErro({ texto, onTentar }: { texto: string; onTentar?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl bg-alerta-clara p-5 text-alerta">
      <p className="font-medium">{texto}</p>
      {onTentar && (
        <button onClick={onTentar} className="mt-3 font-semibold underline underline-offset-4">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Seletor({
  valor,
  min = 1,
  max,
  onMudar,
  rotulo,
}: {
  valor: number;
  min?: number;
  max: number;
  onMudar: (v: number) => void;
  rotulo: string;
}) {
  const btn =
    "grid h-10 w-10 place-items-center rounded-full text-xl font-bold text-framboesa transition-colors hover:bg-framboesa-clara disabled:text-tinta/25 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex items-center rounded-full border border-linha bg-superficie" role="group" aria-label={rotulo}>
      <button type="button" className={btn} onClick={() => onMudar(valor - 1)} disabled={valor <= min} aria-label="Diminuir">
        −
      </button>
      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button type="button" className={btn} onClick={() => onMudar(valor + 1)} disabled={valor >= max} aria-label="Aumentar">
        +
      </button>
    </div>
  );
}
