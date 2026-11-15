import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AvisoErro, botao, Carregando } from "../components/ui";
import { api } from "../lib/api";
import { dataHora, moeda, ROTULO_STATUS } from "../lib/formato";
import type { Pedido } from "../types";

export function SeloStatus({ status }: { status: Pedido["status"] }) {
  const cor =
    status === "CANCELADO" ? "bg-linha text-suave"
    : status === "ENTREGUE" ? "bg-pistache-clara text-pistache"
    : status === "AGUARDANDO_PAGAMENTO" ? "bg-alerta-clara text-alerta"
    : "bg-framboesa-clara text-framboesa";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cor}`}>{ROTULO_STATUS[status]}</span>;
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => {
    setErro(null);
    api<Pedido[]>("/api/pedidos").then(setPedidos).catch((e) => setErro(e.message));
  };
  useEffect(carregar, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl font-extrabold">Meus pedidos</h1>
      <div className="mt-6">
        {erro ? (
          <AvisoErro texto={erro} onTentar={carregar} />
        ) : pedidos === null ? (
          <Carregando />
        ) : pedidos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-suave">Você ainda não fez nenhum pedido.</p>
            <Link to="/" className={`${botao.primario} mt-6`}>Ver cardápio</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link to={`/pedidos/${p.id}`} className="flex items-center gap-4 rounded-2xl bg-superficie p-5 transition-colors hover:bg-framboesa-clara/40">
                  <div className="flex-1">
                    <p className="font-bold">Pedido #{p.id}</p>
                    <p className="text-sm text-suave">
                      {dataHora(p.criado_em)}, {p.itens.reduce((s, i) => s + i.quantidade, 0)} cupcake(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <SeloStatus status={p.status} />
                    <p className="mt-1 font-bold tabular-nums">{moeda(p.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
