import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagemProduto } from "../components/ImagemProduto";
import { AvisoErro, botao, Carregando, Seletor } from "../components/ui";
import { useCarrinho } from "../context/CarrinhoContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { moeda } from "../lib/formato";
import type { Produto } from "../types";

/** HU 06: ingredientes, alérgenos em destaque, peso e escolha de quantidade. */
export default function ProdutoDetalhe() {
  const { id } = useParams();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [qtd, setQtd] = useState(1);
  const { adicionar, itens } = useCarrinho();
  const toast = useToast();
  const navegar = useNavigate();

  useEffect(() => {
    api<Produto>(`/api/produtos/${id}`).then(setProduto).catch((e) => setErro(e.message));
  }, [id]);

  if (erro)
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <AvisoErro texto={erro} />
        <Link to="/" className={`${botao.texto} mt-6 inline-block`}>Voltar ao cardápio</Link>
      </div>
    );
  if (!produto) return <Carregando />;

  const noCarrinho = itens.find((i) => i.produto_id === produto.id)?.quantidade ?? 0;
  const disponivel = Math.max(produto.estoque_diario - noCarrinho, 0);

  const confirmar = () => {
    const ok = adicionar(produto, qtd);
    toast(ok ? `${qtd}× ${produto.nome} no carrinho` : "Adicionamos só o que restava no estoque de hoje", ok ? "sucesso" : "erro");
    navegar("/");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-6 md:grid-cols-2 md:py-12">
      <ImagemProduto nome={produto.nome} id={produto.id} url={produto.imagem_url} className="aspect-square rounded-b-[2rem]" />

      <div>
        <Link to="/" className="text-sm font-semibold text-suave hover:text-tinta">‹ Cardápio</Link>
        <h1 className="mt-2 text-4xl font-extrabold">{produto.nome}</h1>
        <p className="mt-2 text-2xl font-bold tabular-nums">{moeda(produto.preco)}</p>
        <p className="mt-4 text-lg leading-relaxed text-suave">{produto.descricao}</p>

        {produto.alergenos && (
          <div className="mt-6 rounded-2xl border-2 border-alerta/30 bg-alerta-clara p-4">
            <p className="font-bold text-alerta">Alérgenos</p>
            <p className="mt-1 font-medium">{produto.alergenos}</p>
          </div>
        )}

        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="font-semibold">Ingredientes</dt>
            <dd className="mt-1 text-suave">{produto.ingredientes}</dd>
          </div>
          <div className="flex gap-8">
            <div>
              <dt className="font-semibold">Peso</dt>
              <dd className="mt-1 text-suave">{produto.peso_gramas} g</dd>
            </div>
            {produto.categorias.length > 0 && (
              <div>
                <dt className="font-semibold">Categorias</dt>
                <dd className="mt-1 text-suave">{produto.categorias.map((c) => c.nome).join(", ")}</dd>
              </div>
            )}
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {produto.esgotado ? (
            <p className="rounded-full bg-tinta px-5 py-3 font-semibold text-white">Esgotado hoje. Volte amanhã!</p>
          ) : disponivel === 0 ? (
            <p className="text-suave">Todo o estoque de hoje já está no seu carrinho.</p>
          ) : (
            <>
              <Seletor valor={qtd} max={disponivel} onMudar={setQtd} rotulo="Quantidade" />
              <button onClick={confirmar} className={botao.primario}>
                Adicionar {moeda(produto.preco * qtd)}
              </button>
            </>
          )}
        </div>
        {!produto.esgotado && disponivel > 0 && disponivel <= 5 && (
          <p className="mt-3 text-sm font-medium text-alerta">Restam {disponivel} unidade(s) hoje.</p>
        )}
      </div>
    </div>
  );
}
