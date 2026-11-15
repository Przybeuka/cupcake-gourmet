import { Link } from "react-router-dom";
import { ImagemProduto } from "../components/ImagemProduto";
import { botao, Seletor } from "../components/ui";
import { useCarrinho } from "../context/CarrinhoContext";
import { moeda } from "../lib/formato";

/** HU 08: aumentar, diminuir e remover itens com total recalculado na hora. */
export default function Carrinho() {
  const { itens, subtotal, alterar, remover } = useCarrinho();

  if (itens.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">Seu carrinho está vazio</h1>
        <p className="mt-3 text-suave">Escolha um sabor no cardápio para começar o pedido.</p>
        <Link to="/" className={`${botao.primario} mt-8`}>Ver cardápio</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl font-extrabold">Carrinho</h1>

      <ul className="mt-6 divide-y divide-linha">
        {itens.map((i) => (
          <li key={i.produto_id} className="flex gap-4 py-5">
            <ImagemProduto nome={i.nome} id={i.produto_id} url={i.imagem_url} glace={false} className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{i.nome}</p>
                <p className="text-sm text-suave tabular-nums">{moeda(i.preco)} cada</p>
              </div>
              <div className="flex items-center gap-3">
                {/* RN06: diminuir abaixo de 1 remove o item */}
                <Seletor valor={i.quantidade} min={0} max={i.estoque} onMudar={(q) => alterar(i.produto_id, q)} rotulo={`Quantidade de ${i.nome}`} />
                <button
                  onClick={() => remover(i.produto_id)}
                  aria-label={`Remover ${i.nome}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-suave hover:bg-alerta-clara hover:text-alerta"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <p className="w-24 font-bold tabular-nums sm:text-right">{moeda(i.preco * i.quantidade)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t-2 border-tinta pt-5">
        <span className="text-lg font-semibold">Subtotal</span>
        <span className="text-2xl font-extrabold tabular-nums">{moeda(subtotal)}</span>
      </div>
      <p className="mt-1 text-sm text-suave">A taxa de entrega aparece no próximo passo, se você escolher delivery.</p>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link to="/" className={botao.secundario}>Continuar comprando</Link>
        <Link to="/finalizar" className={botao.primario}>Escolher entrega e pagar</Link>
      </div>
    </div>
  );
}
