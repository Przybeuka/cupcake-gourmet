import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagemProduto } from "../../components/ImagemProduto";
import { botao, Campo, Carregando } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { api, ApiError, enviarJson } from "../../lib/api";
import type { Categoria, Produto } from "../../types";

const LIMITE_IMAGEM = 2 * 1024 * 1024;

const VAZIO = {
  nome: "", descricao: "", ingredientes: "", alergenos: "", peso_gramas: "", preco: "",
  estoque_diario: "", imagem_url: "", categorias: [] as number[], ativo: true,
};

/** HU 13: cadastrar/editar sabor, com upload de foto (máx. 2 MB) e preço > 0. */
export default function ProdutoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const toast = useToast();
  const navegar = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(editando);
  const [enviando, setEnviando] = useState(false);
  const [subindo, setSubindo] = useState(false);

  useEffect(() => {
    api<Categoria[]>("/api/categorias").then(setCategorias);
    if (!editando) return;
    api<Produto[]>("/api/admin/produtos").then((lista) => {
      const p = lista.find((x) => x.id === Number(id));
      if (p)
        setDados({
          nome: p.nome, descricao: p.descricao, ingredientes: p.ingredientes, alergenos: p.alergenos ?? "",
          peso_gramas: String(p.peso_gramas), preco: p.preco.toFixed(2).replace(".", ","),
          estoque_diario: String(p.estoque_diario), imagem_url: p.imagem_url ?? "",
          categorias: p.categorias.map((c) => c.id), ativo: p.ativo ?? true,
        });
      setCarregando(false);
    });
  }, [id, editando]);

  const mudar = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDados({ ...dados, [campo]: e.target.value });

  async function enviarImagem(arquivo: File) {
    if (arquivo.size > LIMITE_IMAGEM) {
      setErros({ ...erros, imagem: "A foto passa de 2 MB. Reduza o tamanho e tente de novo." });
      return;
    }
    setSubindo(true);
    const form = new FormData();
    form.append("arquivo", arquivo);
    try {
      const r = await api<{ url: string }>("/api/admin/uploads", { method: "POST", body: form });
      setDados((d) => ({ ...d, imagem_url: r.url }));
      setErros(({ imagem: _, ...resto }) => resto);
    } catch (e) {
      setErros({ ...erros, imagem: (e as ApiError).message });
    } finally {
      setSubindo(false);
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const preco = Number(dados.preco.replace(",", "."));
    if (!(preco > 0)) return setErros({ preco: "O preço deve ser maior que zero." });
    setEnviando(true);
    setErros({});
    const corpo = {
      ...dados,
      preco: preco.toFixed(2),
      peso_gramas: Number(dados.peso_gramas),
      estoque_diario: Number(dados.estoque_diario || 0),
    };
    try {
      await api(editando ? `/api/admin/produtos/${id}` : "/api/admin/produtos", enviarJson(editando ? "PUT" : "POST", corpo));
      toast(editando ? "Alterações salvas" : "Sabor cadastrado");
      navegar("/admin/produtos");
    } catch (e) {
      const err = e as ApiError;
      setErros({ [err.campo ?? "geral"]: err.message });
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <Carregando />;

  const area = "w-full rounded-xl border border-linha bg-superficie px-4 py-3 outline-none focus:border-framboesa";

  return (
    <form onSubmit={salvar} noValidate className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to="/admin/produtos" className="text-sm font-semibold text-suave hover:text-tinta">‹ Cardápio</Link>
      <h1 className="text-4xl font-extrabold">{editando ? "Editar sabor" : "Cadastrar sabor"}</h1>

      <div className="flex flex-col gap-5 sm:flex-row">
        <ImagemProduto nome={dados.nome || "Novo"} id={Number(id ?? 0)} url={dados.imagem_url || null} className="aspect-square w-full shrink-0 rounded-b-3xl sm:w-48" />
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="foto">Foto do produto</label>
          <input
            id="foto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && enviarImagem(e.target.files[0])}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-framboesa-clara file:px-4 file:py-2 file:font-semibold file:text-framboesa"
          />
          <p className={`mt-1.5 text-sm ${erros.imagem ? "text-alerta" : "text-suave"}`}>
            {subindo ? "Enviando foto…" : erros.imagem ?? "PNG, JPG ou WEBP de até 2 MB. Sem foto, mostramos uma ilustração do sabor."}
          </p>
        </div>
      </div>

      <Campo rotulo="Nome do sabor" name="nome" value={dados.nome} onChange={mudar("nome")} erro={erros.nome} maxLength={100} />
      <div>
        <label htmlFor="descricao" className="mb-1.5 block text-sm font-semibold">Descrição</label>
        <textarea id="descricao" rows={2} className={area} value={dados.descricao} onChange={mudar("descricao")} />
        {erros.descricao && <p className="mt-1.5 text-sm text-alerta">{erros.descricao}</p>}
      </div>
      <div>
        <label htmlFor="ingredientes" className="mb-1.5 block text-sm font-semibold">Ingredientes</label>
        <textarea id="ingredientes" rows={2} className={area} value={dados.ingredientes} onChange={mudar("ingredientes")} />
        {erros.ingredientes && <p className="mt-1.5 text-sm text-alerta">{erros.ingredientes}</p>}
      </div>
      <Campo rotulo="Aviso de alérgenos" name="alergenos" placeholder="Ex.: Contém glúten. Pode conter traços de nozes." value={dados.alergenos} onChange={mudar("alergenos")} erro={erros.alergenos} />

      <div className="grid grid-cols-3 gap-4">
        <Campo rotulo="Preço (R$)" name="preco" inputMode="decimal" value={dados.preco} onChange={mudar("preco")} erro={erros.preco} />
        <Campo rotulo="Peso (g)" name="peso_gramas" inputMode="numeric" value={dados.peso_gramas} onChange={mudar("peso_gramas")} erro={erros.peso_gramas} />
        <Campo rotulo="Estoque hoje" name="estoque_diario" inputMode="numeric" value={dados.estoque_diario} onChange={mudar("estoque_diario")} erro={erros.estoque_diario} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Categorias e restrições</legend>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => {
            const marcada = dados.categorias.includes(c.id);
            return (
              <label key={c.id} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${marcada ? "border-tinta bg-tinta text-white" : "border-linha bg-superficie"}`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={marcada}
                  onChange={() =>
                    setDados({ ...dados, categorias: marcada ? dados.categorias.filter((x) => x !== c.id) : [...dados.categorias, c.id] })
                  }
                />
                {c.nome}
              </label>
            );
          })}
        </div>
      </fieldset>

      {erros.geral && <p role="alert" className="rounded-xl bg-alerta-clara p-3 text-sm font-medium text-alerta">{erros.geral}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={enviando || subindo} className={botao.primario}>
          {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar sabor"}
        </button>
        <Link to="/admin/produtos" className={botao.secundario}>Cancelar</Link>
      </div>
    </form>
  );
}
