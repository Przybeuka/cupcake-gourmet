import type { StatusPedido } from "../types";

const moedaFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const moeda = (valor: number) => moedaFmt.format(valor);

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Recebido",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

/** Texto do botão que leva o pedido a cada status (fila da cozinha). */
export const ACAO_STATUS: Partial<Record<StatusPedido, string>> = {
  EM_PREPARO: "Iniciar preparo",
  PRONTO: "Marcar como pronto",
  SAIU_PARA_ENTREGA: "Despachar para entrega",
  ENTREGUE: "Marcar como entregue",
};

export const apenasDigitos = (v: string) => v.replace(/\D/g, "");

export function mascaraCep(v: string) {
  const d = apenasDigitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascaraCartao(v: string) {
  return apenasDigitos(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function mascaraValidade(v: string) {
  const d = apenasDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
