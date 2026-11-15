import { ROTULO_STATUS } from "../lib/formato";
import type { Modalidade, StatusPedido } from "../types";

/** HU 12 CA#1: linha do tempo do pedido. A retirada não tem a etapa "Saiu para entrega". */
export function etapasDoPedido(modalidade: Modalidade): StatusPedido[] {
  return modalidade === "DELIVERY"
    ? ["PAGO", "EM_PREPARO", "PRONTO", "SAIU_PARA_ENTREGA", "ENTREGUE"]
    : ["PAGO", "EM_PREPARO", "PRONTO", "ENTREGUE"];
}

const ROTULO_RETIRADA: Partial<Record<StatusPedido, string>> = {
  PRONTO: "Pronto para retirar",
  ENTREGUE: "Retirado",
};

export function LinhaDoTempo({ status, modalidade }: { status: StatusPedido; modalidade: Modalidade }) {
  const etapas = etapasDoPedido(modalidade);
  const atual = etapas.indexOf(status);

  return (
    <ol className="space-y-0" aria-label="Andamento do pedido">
      {etapas.map((etapa, i) => {
        const feito = atual >= i;
        const agora = atual === i;
        const rotulo = (modalidade === "RETIRADA" && ROTULO_RETIRADA[etapa]) || ROTULO_STATUS[etapa];
        return (
          <li key={etapa} className="relative flex gap-4 pb-6 last:pb-0" aria-current={agora ? "step" : undefined}>
            {i < etapas.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${atual > i ? "bg-pistache" : "bg-linha"}`}
                aria-hidden
              />
            )}
            <span
              className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                agora ? "bg-framboesa text-white ring-4 ring-framboesa-clara" : feito ? "bg-pistache text-white" : "bg-linha text-suave"
              }`}
            >
              {feito && !agora ? "✓" : i + 1}
            </span>
            <span className={`pt-1 ${agora ? "font-bold" : feito ? "font-medium" : "text-suave"}`}>{rotulo}</span>
          </li>
        );
      })}
    </ol>
  );
}
