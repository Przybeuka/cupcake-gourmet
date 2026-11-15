import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LinhaDoTempo } from "../components/LinhaDoTempo";
import { AvisoErro, botao, Carregando } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { api, ApiError } from "../lib/api";
import { dataHora, moeda } from "../lib/formato";
import { LOJA } from "../lib/loja";
import type { Pedido } from "../types";
import { SeloStatus } from "./MeusPedidos";

const ATUALIZA_A_CADA_MS = 20000;

function useContagem(alvo?: string) {
  const [resta, setResta] = useState(0);
  useEffect(() => {
    if (!alvo) return;
    const calcular = () => setResta(Math.max(0, Math.floor((new Date(alvo).getTime() - Date.now()) / 1000)));
    calcular();
    const t = setInterval(calcular, 1000);
    return () => clearInterval(t);
  }, [alvo]);
  return resta;
}

function Pix({ pedido, aoPagar }: { pedido: Pedido; aoPagar: () => Promise<void> }) {
  const toast = useToast();
  const resta = useContagem(pedido.pagamento?.pix_expira_em);
  const [pagando, setPagando] = useState(false);
  const codigo = pedido.pagamento?.pix_codigo ?? "";
  const mm = String(Math.floor(resta / 60)).padStart(2, "0");
  const ss = String(resta % 60).padStart(2, "0");

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      toast("Código Pix copiado");
    } catch {
      toast("Não foi possível copiar. Selecione o código e copie manualmente.", "erro");
    }
  };

  return (
    <section className="rounded-3xl border-2 border-framboesa bg-superficie p-6">
      <h2 className="text-2xl font-bold">Pague com Pix para confirmar</h2>
      <p className="mt-1 text-suave">
        {resta > 0 ? (
          <>O código expira em <strong className="tabular-nums text-tinta">{mm}:{ss}</strong>. Depois disso o pedido é cancelado.</>
        ) : (
          "O prazo de pagamento terminou. Atualize a página para ver o pedido cancelado."
        )}
      </p>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="rounded-2xl bg-white p-3">
          <QRCodeSVG value={codigo} size={168} fgColor="#2e1a24" aria-label="QR Code do Pix" />
        </div>
        <div className="w-full min-w-0 flex-1">
          <label htmlFor="pix" className="text-sm font-semibold">Pix copia e cola</label>
          <textarea id="pix" readOnly value={codigo} rows={3} className="mt-1 w-full resize-none rounded-xl border border-linha bg-fundo p-3 font-mono text-xs break-all" />
          <button onClick={copiar} className={`${botao.secundario} mt-2 w-full`}>Copiar código Pix</button>
          <button
            disabled={pagando || resta === 0}
            onClick={async () => { setPagando(true); await aoPagar(); setPagando(false); }}
            className={`${botao.primario} mt-3 w-full`}
          >
            {pagando ? "Confirmando…" : "Simular pagamento do Pix"}
          </button>
          <p className="mt-2 text-xs text-suave">Ambiente de demonstração: este botão faz o papel do banco confirmando o pagamento.</p>
        </div>
      </div>
    </section>
  );
}

/** HU 12: linha do tempo do pedido, com atualização manual e automática. */
export default function PedidoDetalhe() {
  const { id } = useParams();
  const toast = useToast();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setPedido(await api<Pedido>(`/api/pedidos/${id}`));
      setErro(null);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAtualizando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, ATUALIZA_A_CADA_MS);
    return () => clearInterval(t);
  }, [carregar]);

  const pagarPix = async () => {
    try {
      setPedido(await api<Pedido>(`/api/pedidos/${id}/pix/confirmar`, { method: "POST" }));
      toast("Pix confirmado! Seu pedido foi para a cozinha.");
    } catch (e) {
      toast((e as ApiError).message, "erro");
      carregar();
    }
  };

  const cancelar = async () => {
    if (!confirm("Cancelar este pedido? Os itens voltam para o estoque da loja.")) return;
    try {
      setPedido(await api<Pedido>(`/api/pedidos/${id}/cancelar`, { method: "POST" }));
      toast("Pedido cancelado");
    } catch (e) {
      toast((e as ApiError).message, "erro");
    }
  };

  if (erro && !pedido) return <div className="mx-auto max-w-xl px-4 py-12"><AvisoErro texto={erro} onTentar={carregar} /></div>;
  if (!pedido) return <Carregando />;

  const aguardandoPix = pedido.status === "AGUARDANDO_PAGAMENTO" && pedido.pagamento?.metodo === "PIX";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <Link to="/pedidos" className="text-sm font-semibold text-suave hover:text-tinta">‹ Meus pedidos</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-extrabold">Pedido #{pedido.id}</h1>
          <SeloStatus status={pedido.status} />
        </div>
        <p className="mt-1 text-suave">Feito em {dataHora(pedido.criado_em)}</p>
      </div>

      {aguardandoPix && <Pix pedido={pedido} aoPagar={pagarPix} />}

      {pedido.status === "CANCELADO" ? (
        <div className="rounded-2xl bg-linha/60 p-5">
          <p className="font-bold">Pedido cancelado</p>
          <p className="text-suave">Os itens voltaram para o estoque. Nenhuma cobrança foi mantida.</p>
        </div>
      ) : (
        !aguardandoPix && (
          <section className="rounded-3xl bg-superficie p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Acompanhamento</h2>
              <button onClick={carregar} disabled={atualizando} className="rounded-full px-3 py-2 text-sm font-semibold text-framboesa hover:bg-framboesa-clara">
                {atualizando ? "Atualizando…" : "Atualizar"}
              </button>
            </div>
            <LinhaDoTempo status={pedido.status} modalidade={pedido.modalidade} />
            <p className="mt-6 text-sm text-suave">Esta tela se atualiza sozinha a cada 20 segundos.</p>
          </section>
        )
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">Itens</h2>
          <ul className="mt-2 space-y-1">
            {pedido.itens.map((i) => (
              <li key={i.produto_id} className="flex justify-between gap-3">
                <span>{i.quantidade}× {i.nome}</span>
                <span className="tabular-nums">{moeda(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-linha pt-3 text-sm">
            <div className="flex justify-between"><dt>Entrega</dt><dd className="tabular-nums">{pedido.taxa_entrega ? moeda(pedido.taxa_entrega) : "Grátis"}</dd></div>
            <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{moeda(pedido.total)}</dd></div>
          </dl>
        </div>
        <div>
          <h2 className="text-lg font-bold">{pedido.modalidade === "DELIVERY" ? "Entrega em" : "Retirada em"}</h2>
          {pedido.endereco ? (
            <p className="mt-2 text-suave">
              {pedido.endereco.rua}, {pedido.endereco.numero}, {pedido.endereco.bairro}<br />
              {pedido.endereco.cidade}, CEP {pedido.endereco.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
              {pedido.endereco.referencia && <><br />Ref.: {pedido.endereco.referencia}</>}
            </p>
          ) : (
            <p className="mt-2 text-suave">{LOJA.endereco}<br />{LOJA.horario}</p>
          )}
          <p className="mt-3 text-sm text-suave">
            Pagamento: {pedido.pagamento?.metodo === "PIX" ? "Pix" : "Cartão de crédito"}
          </p>
        </div>
      </section>

      {pedido.pode_cancelar && (
        <button onClick={cancelar} className="text-sm font-semibold text-alerta underline-offset-4 hover:underline">
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
