import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { botao, Campo } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../lib/api";
import { emailValido, requisitosSenha, senhaValida } from "../lib/validacao";

/** HU 01: cadastro com validação de e-mail, regras de senha (RN02) e confirmação. */
export default function Cadastro() {
  const { cadastrar, usuario } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [dados, setDados] = useState({ nome: "", email: "", senha: "", confirmacao_senha: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const voltar = params.get("voltar") ?? "/";

  if (usuario) return <Navigate to={voltar} replace />;

  const mudar = (campo: keyof typeof dados) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados({ ...dados, [campo]: e.target.value });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!dados.nome.trim()) v.nome = "Informe seu nome completo.";
    if (!emailValido(dados.email)) v.email = "Informe um e-mail válido, como nome@exemplo.com.";
    if (!senhaValida(dados.senha)) v.senha = "A senha ainda não atende aos requisitos abaixo.";
    if (dados.senha !== dados.confirmacao_senha) v.confirmacao_senha = "As senhas não são iguais.";
    setErros(v);
    if (Object.keys(v).length) return;

    setEnviando(true);
    try {
      await cadastrar(dados);
      toast("Conta criada. Bem-vindo(a)!");
      navegar(voltar, { replace: true });
    } catch (e) {
      const err = e as ApiError;
      setErros({ [err.campo ?? "geral"]: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-4xl font-extrabold">Criar conta</h1>
      <p className="mt-2 text-suave">Para fazer pedidos e acompanhar a entrega.</p>
      <form onSubmit={enviar} noValidate className="mt-8 space-y-5">
        <Campo rotulo="Nome completo" name="nome" autoComplete="name" value={dados.nome} onChange={mudar("nome")} erro={erros.nome} />
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" value={dados.email} onChange={mudar("email")} erro={erros.email} />
        <Campo
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          value={dados.senha}
          onChange={mudar("senha")}
          erro={erros.senha}
        />
        <ul className="-mt-2 space-y-1 text-sm" aria-label="Requisitos da senha">
          {requisitosSenha(dados.senha).map((r) => (
            <li key={r.texto} className={r.ok ? "text-pistache" : "text-suave"}>
              {r.ok ? "✓" : "○"} {r.texto}
            </li>
          ))}
        </ul>
        <Campo
          rotulo="Confirme a senha"
          name="confirmacao_senha"
          type="password"
          autoComplete="new-password"
          value={dados.confirmacao_senha}
          onChange={mudar("confirmacao_senha")}
          erro={erros.confirmacao_senha}
        />
        {erros.geral && <p role="alert" className="rounded-xl bg-alerta-clara p-3 text-sm font-medium text-alerta">{erros.geral}</p>}
        <button type="submit" disabled={enviando} className={`${botao.primario} w-full`}>
          {enviando ? "Criando conta…" : "Criar conta"}
        </button>
      </form>
      <p className="mt-8 text-center text-suave">
        Já tem conta? <Link to={`/entrar?voltar=${encodeURIComponent(voltar)}`} className={botao.texto}>Entrar</Link>
      </p>
    </div>
  );
}
