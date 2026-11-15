import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { botao, Campo } from "../components/ui";
import { useAuth } from "../context/AuthContext";

/** HU 02: login simples, com mensagem genérica de erro vinda do servidor. */
export default function Entrar() {
  const { entrar, usuario } = useAuth();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const voltar = params.get("voltar");

  if (usuario) return <Navigate to={voltar ?? (usuario.perfil === "ADMIN" ? "/admin/pedidos" : "/")} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!email.trim() || !senha) return setErro("Informe e-mail e senha.");
    setEnviando(true);
    try {
      const u = await entrar(email, senha);
      navegar(voltar ?? (u.perfil === "ADMIN" ? "/admin/pedidos" : "/"), { replace: true });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-4xl font-extrabold">Entrar</h1>
      {voltar === "/finalizar" && <p className="mt-2 text-suave">Entre na sua conta para fechar o pedido. Seu carrinho continua salvo.</p>}
      <form onSubmit={enviar} noValidate className="mt-8 space-y-5">
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        {erro && <p role="alert" className="rounded-xl bg-alerta-clara p-3 text-sm font-medium text-alerta">{erro}</p>}
        <button type="submit" disabled={enviando} className={`${botao.primario} w-full`}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-8 text-center text-suave">
        Primeira vez aqui?{" "}
        <Link to={`/cadastro${voltar ? `?voltar=${encodeURIComponent(voltar)}` : ""}`} className={botao.texto}>Criar conta</Link>
      </p>
    </div>
  );
}
