import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { botao, Campo } from "../components/ui";
import { useCarrinho } from "../context/CarrinhoContext";
import { useToast } from "../context/ToastContext";
import { api, ApiError, enviarJson } from "../lib/api";
import { apenasDigitos, mascaraCartao, mascaraCep, mascaraValidade, moeda } from "../lib/formato";
import { buscarCep, LOJA, TAXA_ENTREGA } from "../lib/loja";
import type { MetodoPagamento, Modalidade, Pedido } from "../types";

const opcao = (ativa: boolean) =>
  `flex-1 cursor-pointer rounded-2xl border-2 p-4 transition-colors ${
    ativa ? "border-framboesa bg-framboesa-clara" : "border-linha bg-superficie hover:border-tinta/30"
  }`;

/** HU 10 (modalidade de entrega) + HU 11 (pagamento). */
export default function Finalizar() {
  const { itens, subtotal, limpar } = useCarrinho();
  const toast = useToast();

  const [modalidade, setModalidade] = useState<Modalidade>("DELIVERY");
  const [end, setEnd] = useState({ cep: "", rua: "", numero: "", bairro: "", cidade: "", referencia: "" });
  const [cepStatus, setCepStatus] = useState<"" | "buscando" | "ok" | "naoEncontrado">("");
  const [metodo, setMetodo] = useState<MetodoPagamento>("PIX");
  const [cartao, setCartao] = useState({ nome: "", numero: "", validade: "", cvv: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Ao concluir, o carrinho é esvaziado; isto evita o redirecionamento de "carrinho vazio"
  const [pedidoCriado, setPedidoCriado] = useState<number | null>(null);

  const cep = apenasDigitos(end.cep);
  useEffect(() => {
    if (cep.length !== 8) {
      setCepStatus("");
      return;
    }
    let ativo = true;
    setCepStatus("buscando");
    buscarCep(cep)
      .then((r) => {
        if (!ativo) return;
        if (r) {
          setEnd((e) => ({ ...e, rua: r.rua || e.rua, bairro: r.bairro || e.bairro, cidade: r.cidade || e.cidade }));
          setCepStatus("ok");
        } else setCepStatus("naoEncontrado");
      })
      .catch(() => ativo && setCepStatus(""));
    return () => {
      ativo = false;
    };
  }, [cep]);

  if (pedidoCriado) return <Navigate to={`/pedidos/${pedidoCriado}`} replace />;
  if (itens.length === 0) return <Navigate to="/carrinho" replace />;

  const taxa = modalidade === "DELIVERY" ? TAXA_ENTREGA : 0;
  const total = subtotal + taxa;

  function validar() {
    const e: Record<string, string> = {};
    if (modalidade === "DELIVERY") {
      if (cep.length !== 8) e.cep = "Informe os 8 dígitos do CEP.";
      else if (cepStatus === "naoEncontrado") e.cep = "CEP não encontrado. Confira os números.";
      if (!end.rua.trim()) e.rua = "Informe a rua.";
      if (!end.numero.trim()) e.numero = "Informe o número.";
      if (!end.bairro.trim()) e.bairro = "Informe o bairro.";
      if (!end.cidade.trim()) e.cidade = "Informe a cidade.";
    }
    if (metodo === "CARTAO") {
      if (!cartao.nome.trim()) e.nome = "Informe o nome impresso no cartão.";
      if (apenasDigitos(cartao.numero).length < 13) e.numero_cartao = "Número de cartão incompleto.";
      if (!/^\d{2}\/\d{2}$/.test(cartao.validade)) e.validade = "Use o formato MM/AA.";
      if (!/^\d{3,4}$/.test(cartao.cvv)) e.cvv = "3 ou 4 dígitos.";
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setErroGeral(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      const pedido = await api<Pedido>(
        "/api/pedidos",
        enviarJson("POST", {
          itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
          modalidade,
          endereco: modalidade === "DELIVERY" ? { ...end, cep } : undefined,
          pagamento: { metodo, cartao: metodo === "CARTAO" ? cartao : undefined },
        }),
      );
      setPedidoCriado(pedido.id);
      limpar();
      toast(metodo === "PIX" ? "Pedido criado. Agora é só pagar o Pix." : "Pagamento aprovado! Pedido recebido.");
    } catch (e) {
      const err = e as ApiError;
      const mapa: Record<string, string> = { numero: "numero_cartao" };
      if (err.campo && err.campo !== "itens") setErros({ [mapa[err.campo] ?? err.campo]: err.message });
      else setErroGeral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const mudarEnd = (campo: keyof typeof end) => (ev: React.ChangeEvent<HTMLInputElement>) =>
    setEnd({ ...end, [campo]: campo === "cep" ? mascaraCep(ev.target.value) : ev.target.value });

  return (
    <form onSubmit={enviar} noValidate className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-10">
        <h1 className="text-4xl font-extrabold">Finalizar pedido</h1>

        <fieldset>
          <legend className="font-titulo text-2xl font-bold">Como você quer receber?</legend>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className={opcao(modalidade === "DELIVERY")}>
              <input type="radio" name="modalidade" className="sr-only" checked={modalidade === "DELIVERY"} onChange={() => setModalidade("DELIVERY")} />
              <span className="block font-bold">Entrega delivery</span>
              <span className="text-sm text-suave">Taxa de {moeda(TAXA_ENTREGA)}</span>
            </label>
            <label className={opcao(modalidade === "RETIRADA")}>
              <input type="radio" name="modalidade" className="sr-only" checked={modalidade === "RETIRADA"} onChange={() => setModalidade("RETIRADA")} />
              <span className="block font-bold">Retirar no balcão</span>
              <span className="text-sm text-suave">Sem taxa</span>
            </label>
          </div>

          {modalidade === "DELIVERY" ? (
            <div className="mt-6 grid grid-cols-6 gap-4">
              <Campo
                className="col-span-6 sm:col-span-3"
                rotulo="CEP"
                name="cep"
                inputMode="numeric"
                autoComplete="postal-code"
                value={end.cep}
                onChange={mudarEnd("cep")}
                erro={erros.cep ?? (cepStatus === "naoEncontrado" ? "CEP não encontrado. Confira os números." : undefined)}
                ajuda={cepStatus === "buscando" ? "Buscando endereço…" : cepStatus === "ok" ? "Endereço preenchido pelo CEP." : "Preenchemos a rua para você."}
              />
              <Campo className="col-span-6" rotulo="Rua" name="rua" autoComplete="address-line1" value={end.rua} onChange={mudarEnd("rua")} erro={erros.rua} />
              <Campo className="col-span-2" rotulo="Número" name="numero" value={end.numero} onChange={mudarEnd("numero")} erro={erros.numero} />
              <Campo className="col-span-4" rotulo="Bairro" name="bairro" value={end.bairro} onChange={mudarEnd("bairro")} erro={erros.bairro} />
              <Campo className="col-span-6 sm:col-span-3" rotulo="Cidade" name="cidade" value={end.cidade} onChange={mudarEnd("cidade")} erro={erros.cidade} />
              <Campo className="col-span-6 sm:col-span-3" rotulo="Ponto de referência (opcional)" name="referencia" value={end.referencia} onChange={mudarEnd("referencia")} />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-pistache-clara p-5">
              <p className="font-bold">{LOJA.endereco}</p>
              <p className="mt-1">{LOJA.horario}</p>
              <p className="mt-1 text-sm text-suave">{LOJA.prazoRetirada}</p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="font-titulo text-2xl font-bold">Pagamento</legend>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className={opcao(metodo === "PIX")}>
              <input type="radio" name="metodo" className="sr-only" checked={metodo === "PIX"} onChange={() => setMetodo("PIX")} />
              <span className="block font-bold">Pix</span>
              <span className="text-sm text-suave">QR Code ou copia e cola, válido por 10 min</span>
            </label>
            <label className={opcao(metodo === "CARTAO")}>
              <input type="radio" name="metodo" className="sr-only" checked={metodo === "CARTAO"} onChange={() => setMetodo("CARTAO")} />
              <span className="block font-bold">Cartão de crédito</span>
              <span className="text-sm text-suave">Aprovação na hora</span>
            </label>
          </div>

          {metodo === "CARTAO" && (
            <div className="mt-6 grid grid-cols-6 gap-4">
              <Campo className="col-span-6" rotulo="Nome impresso no cartão" name="nome" autoComplete="cc-name" value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value })} erro={erros.nome} />
              <Campo className="col-span-6" rotulo="Número do cartão" name="numero_cartao" inputMode="numeric" autoComplete="cc-number" value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: mascaraCartao(e.target.value) })} erro={erros.numero_cartao} />
              <Campo className="col-span-3" rotulo="Validade" name="validade" placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp" value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: mascaraValidade(e.target.value) })} erro={erros.validade} />
              <Campo className="col-span-3" rotulo="CVV" name="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: apenasDigitos(e.target.value) })} erro={erros.cvv} />
              <p className="col-span-6 text-sm text-suave">
                Ambiente de demonstração: use o cartão 4111 1111 1111 1111. Cartões terminados em 0002 são recusados para teste.
              </p>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="h-fit rounded-3xl bg-superficie p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Resumo</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {itens.map((i) => (
            <li key={i.produto_id} className="flex justify-between gap-3">
              <span>{i.quantidade}× {i.nome}</span>
              <span className="tabular-nums">{moeda(i.preco * i.quantidade)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-linha pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{moeda(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Entrega</dt><dd className="tabular-nums">{taxa ? moeda(taxa) : "Grátis"}</dd></div>
          <div className="flex justify-between pt-2 text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{moeda(total)}</dd></div>
        </dl>
        {erroGeral && (
          <div role="alert" className="mt-4 rounded-xl bg-alerta-clara p-3 text-sm font-medium text-alerta">
            {erroGeral}
            {/estoque|dispon/i.test(erroGeral) && (
              <Link to="/carrinho" className="mt-1 block underline">Ajustar carrinho</Link>
            )}
          </div>
        )}
        <button type="submit" disabled={enviando} className={`${botao.primario} mt-6 w-full`}>
          {enviando ? "Enviando…" : metodo === "PIX" ? `Gerar Pix de ${moeda(total)}` : `Pagar ${moeda(total)}`}
        </button>
      </aside>
    </form>
  );
}
