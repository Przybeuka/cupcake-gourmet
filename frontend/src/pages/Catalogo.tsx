import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagemProduto } from "../components/ImagemProduto";
import { AvisoErro, Carregando } from "../components/ui";
import { useCarrinho } from "../context/CarrinhoContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { moeda } from "../lib/formato";
import type { Categoria, Produto } from "../types";

/** HU 04 (vitrine) + HU 05 (filtros por categoria/restrição). */
export default function Catalogo() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtros, setFiltros] = useState<number[]>([]);
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { adicionar } = useCarrinho();
  const toast = useToast();

  useEffect(() => {
    api<Categoria[]>("/api/categorias").then(setCategorias).catch(() => {});
  }, []);

  const carregar = useCallback(() => {
    setErro(null);
    const qs = filtros.length ? `?categorias=${filtros.join(",")}` : "";
    api<Produto[]>(`/api/produtos${qs}`)
      .then(setProdutos)
      .catch((e) => setErro(e.message));
  }, [filtros]);

  useEffect(carregar, [carregar]);

  const alternar = (id: number) =>
    setFiltros((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const comprar = (p: Produto) => {
    const ok = adicionar(p);
    toast(ok ? `${p.nome} foi para o carrinho` : `Você já tem todo o estoque de hoje de ${p.nome} no carrinho`, ok ? "sucesso" : "erro");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-8 sm:py-12">
        <h1 className="max-w-xl text-4xl font-extrabold sm:text-6xl">Feitos hoje de manhã. Na sua mesa à tarde.</h1>
        <p className="mt-4 max-w-md text-lg text-suave">
          Escolha seus sabores, receba em casa ou retire no balcão. Filtre por restrição alimentar para achar o seu.
        </p>
      </section>

      <div className="sem-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-6" role="group" aria-label="Filtrar por categoria">
        {categorias.map((c) => {
          const ativo = filtros.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => alternar(c.id)}
              aria-pressed={ativo}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-superficie hover:border-tinta/40"
              }`}
            >
              {c.nome}
            </button>
          );
        })}
        {filtros.length > 0 && (
          <button onClick={() => setFiltros([])} className="shrink-0 px-3 text-sm font-semibold text-framboesa">
            Limpar
          </button>
        )}
      </div>

      {erro ? (
        <AvisoErro texto={erro} onTentar={carregar} />
      ) : produtos === null ? (
        <Carregando texto="Buscando os cupcakes de hoje…" />
      ) : produtos.length === 0 ? (
        <div className="rounded-3xl bg-superficie p-10 text-center">
          <p className="font-titulo text-2xl font-bold">Nenhum cupcake com essa combinação hoje.</p>
          <p className="mt-2 text-suave">Tire um dos filtros para ver mais sabores.</p>
          <button onClick={() => setFiltros([])} className="mt-5 font-semibold text-framboesa">
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {produtos.map((p) => (
            <li key={p.id} className="flex flex-col">
              <Link to={`/produto/${p.id}`} className="group block">
                <div className="relative">
                  <ImagemProduto
                    nome={p.nome}
                    id={p.id}
                    url={p.imagem_url}
                    className={`aspect-square rounded-b-3xl ${p.esgotado ? "opacity-60 grayscale" : ""}`}
                  />
                  {p.esgotado && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-tinta px-3 py-1 text-xs font-bold text-white">
                      Esgotado hoje
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug group-hover:text-framboesa">{p.nome}</h2>
              </Link>
              {p.categorias.some((c) => c.nome !== "Tradicionais") && (
                <p className="mt-1 text-sm text-pistache">
                  {p.categorias.filter((c) => c.nome !== "Tradicionais").map((c) => c.nome).join(", ")}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-lg font-bold tabular-nums">{moeda(p.preco)}</span>
                <button
                  onClick={() => comprar(p)}
                  disabled={p.esgotado}
                  aria-label={`Adicionar ${p.nome} ao carrinho`}
                  className="rounded-full bg-framboesa px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-framboesa-escura disabled:bg-linha disabled:text-suave"
                >
                  Adicionar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
