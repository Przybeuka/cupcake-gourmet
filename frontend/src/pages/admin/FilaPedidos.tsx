import { useCallback, useEffect, useRef, useState } from "react";
import { AvisoErro, Carregando } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { api, ApiError, enviarJson } from "../../lib/api";
import { ACAO_STATUS, hora, moeda, ROTULO_STATUS } from "../../lib/formato";
import type { Pedido, StatusPedido } from "../../types";

const ATUALIZA_A_CADA_MS = 10000;

/** HU 14 CA#1: sinal sonoro curto quando chega pedido novo. */
function tocarAlerta() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((atraso) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.2, ctx.currentTime + atraso);
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + atraso + 0.15);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + atraso);
      osc.stop(ctx.currentTime + atraso + 0.15);
    });
  } catch {
    /* navegador sem áudio */
  }
}

const COLUNAS: { titulo: string; status: StatusPedido[] }[] = [
  { titulo: "Novos", status: ["PAGO"] },
  { titulo: "Em preparo", status: ["EM_PREPARO"] },
  { titulo: "Prontos e em rota", status: ["PRONTO", "SAIU_PARA_ENTREGA"] },
];

export default function FilaPedidos() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novos, setNovos] = useState<Set<number>>(new Set());
  const [ocupado, setOcupado] = useState<number | null>(null);
  const conhecidos = useRef<Set<number> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const lista = await api<Pedido[]>("/api/admin/pedidos");
      const ids = new Set(lista.map((p) => p.id));
      if (conhecidos.current) {
        const chegaram = lista.filter((p) => !conhecidos.current!.has(p.id)).map((p) => p.id);
        if (chegaram.length) {
          tocarAlerta();
          setNovos(new Set(chegaram));
          toast(chegaram.length === 1 ? "Chegou um pedido novo" : `Chegaram ${chegaram.length} pedidos novos`);
        }
      }
      conhecidos.current = ids;
      setPedidos(lista);
      setErro(null);
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, ATUALIZA_A_CADA_MS);
    return () => clearInterval(t);
  }, [carregar]);

  const mudar = async (pedido: Pedido, status: StatusPedido) => {
    setOcupado(pedido.id);
    try {
      const atualizado = await api<Pedido>(`/api/admin/pedidos/${pedido.id}/status`, enviarJson("PATCH", { status }));
      setPedidos((lista) =>
        (lista ?? [])
          .map((p) => (p.id === atualizado.id ? atualizado : p))
          .filter((p) => p.status !== "ENTREGUE" && p.status !== "CANCELADO"),
      );
      toast(`Pedido #${pedido.id}: ${ROTULO_STATUS[status].toLowerCase()}`);
    } catch (e) {
      toast((e as ApiError).message, "erro");
      carregar();
    } finally {
      setOcupado(null);
    }
  };

  if (erro && !pedidos) return <div className="mx-auto max-w-xl px-4 py-12"><AvisoErro texto={erro} onTentar={carregar} /></div>;
  if (!pedidos) return <Carregando />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold">Fila de pedidos</h1>
          <p className="mt-1 text-suave">Só aparecem pedidos já pagos, do mais antigo para o mais novo. Atualiza a cada 10 segundos.</p>
        </div>
        <button onClick={carregar} className="rounded-full px-3 py-2 text-sm font-semibold text-framboesa hover:bg-framboesa-clara">Atualizar agora</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {COLUNAS.map((col) => {
          const daColuna = pedidos.filter((p) => col.status.includes(p.status));
          return (
            <section key={col.titulo} aria-label={col.titulo}>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                {col.titulo}
                <span className="rounded-full bg-tinta px-2 text-sm text-white tabular-nums">{daColuna.length}</span>
              </h2>
              <ul className="mt-3 space-y-3">
                {daColuna.length === 0 && <li className="rounded-2xl border-2 border-dashed border-linha p-6 text-center text-sm text-suave">Nada por aqui.</li>}
                {daColuna.map((p) => (
                  <li
                    key={p.id}
                    onAnimationEnd={() => setNovos((n) => { const c = new Set(n); c.delete(p.id); return c; })}
                    className={`rounded-2xl bg-superficie p-4 ${novos.has(p.id) ? "alerta-novo ring-2 ring-framboesa" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-lg font-extrabold">#{p.id}</p>
                      <p className="text-sm text-suave tabular-nums">{hora(p.criado_em)}</p>
                    </div>
                    <p className="text-sm">
                      {p.cliente?.nome},{" "}<span className={p.modalidade === "DELIVERY" ? "font-semibold text-framboesa" : "font-semibold text-pistache"}>
                        {p.modalidade === "DELIVERY" ? "Delivery" : "Retirada"}
                      </span>
                    </p>
                    {p.status === "SAIU_PARA_ENTREGA" && <p className="mt-1 text-xs font-bold text-framboesa">Saiu para entrega</p>}
                    <ul className="mt-3 space-y-0.5 border-t border-linha pt-3">
                      {p.itens.map((i) => (
                        <li key={i.produto_id}><strong className="tabular-nums">{i.quantidade}×</strong> {i.nome}</li>
                      ))}
                    </ul>
                    {p.endereco && (
                      <p className="mt-2 text-sm text-suave">
                        {p.endereco.rua}, {p.endereco.numero}, {p.endereco.bairro}
                        {p.endereco.referencia && ` (${p.endereco.referencia})`}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-semibold tabular-nums">{moeda(p.total)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.proximos_status?.map((s) => (
                        <button
                          key={s}
                          disabled={ocupado === p.id}
                          onClick={() => mudar(p, s)}
                          className="flex-1 rounded-full bg-framboesa px-4 py-2.5 text-sm font-semibold text-white hover:bg-framboesa-escura disabled:opacity-50"
                        >
                          {ACAO_STATUS[s]}
                        </button>
                      ))}
                      {p.status === "PAGO" && (
                        <button
                          disabled={ocupado === p.id}
                          onClick={() => confirm(`Cancelar o pedido #${p.id}? O estoque é devolvido.`) && mudar(p, "CANCELADO")}
                          className="rounded-full px-3 py-2.5 text-sm font-semibold text-alerta hover:bg-alerta-clara"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
