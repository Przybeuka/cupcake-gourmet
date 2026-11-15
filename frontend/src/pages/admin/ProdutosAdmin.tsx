import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagemProduto } from "../../components/ImagemProduto";
import { AvisoErro, botao, Carregando } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { api, ApiError, enviarJson } from "../../lib/api";
import { moeda } from "../../lib/formato";
import type { Produto } from "../../types";

/** HU 13: lista do cardápio com switch de exibição na vitrine. */
export default function ProdutosAdmin() {
  const toast = useToast();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => api<Produto[]>("/api/admin/produtos").then(setProdutos).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);

  const alternar = async (p: Produto) => {
    try {
      const atualizado = await api<Produto>(`/api/admin/produtos/${p.id}/ativo`, enviarJson("PATCH", { ativo: !p.ativo }));
      setProdutos((lista) => lista!.map((x) => (x.id === p.id ? atualizado : x)));
      toast(atualizado.ativo ? `${p.nome} voltou para a vitrine` : `${p.nome} saiu da vitrine`);
    } catch (e) {
      toast((e as ApiError).message, "erro");
    }
  };

  if (erro) return <div className="mx-auto max-w-xl px-4 py-12"><AvisoErro texto={erro} /></div>;
  if (!produtos) return <Carregando />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Cardápio</h1>
        <Link to="/admin/produtos/novo" className={botao.primario}>Cadastrar sabor</Link>
      </div>

      <ul className="mt-8 divide-y divide-linha rounded-3xl bg-superficie px-4">
        {produtos.map((p) => (
          <li key={p.id} className={`flex items-center gap-4 py-4 ${p.ativo ? "" : "opacity-60"}`}>
            <ImagemProduto nome={p.nome} id={p.id} url={p.imagem_url} glace={false} className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Link to={`/admin/produtos/${p.id}`} className="font-bold hover:text-framboesa">{p.nome}</Link>
              <p className="text-sm text-suave tabular-nums">
                {moeda(p.preco)}, {p.estoque_diario > 0 ? `${p.estoque_diario} em estoque hoje` : "sem estoque hoje"}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <span className="hidden sm:inline">{p.ativo ? "Na vitrine" : "Oculto"}</span>
              <button
                role="switch"
                aria-checked={p.ativo}
                aria-label={`Mostrar ${p.nome} na vitrine`}
                onClick={() => alternar(p)}
                className={`relative h-7 w-12 rounded-full transition-colors ${p.ativo ? "bg-pistache" : "bg-linha"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${p.ativo ? "left-6" : "left-1"}`} />
              </button>
            </label>
            <Link to={`/admin/produtos/${p.id}`} className="text-sm font-semibold text-framboesa">Editar</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
