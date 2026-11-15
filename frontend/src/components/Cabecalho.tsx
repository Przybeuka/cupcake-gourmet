import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCarrinho } from "../context/CarrinhoContext";

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-framboesa-clara text-framboesa" : "text-tinta/80 hover:text-tinta"
  }`;

export function Cabecalho() {
  const { usuario, sair } = useAuth();
  const { quantidadeTotal } = useCarrinho();
  const navegar = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-fundo/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2">
          <img src="/icone.svg" alt="" className="h-9 w-9" />
          <span className="font-titulo text-lg font-extrabold leading-none">
            Cupcake
            <br />
            <span className="text-framboesa">Gourmet</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Principal">
          {usuario?.perfil === "ADMIN" ? (
            <>
              <NavLink to="/admin/pedidos" className={link}>Fila</NavLink>
              <NavLink to="/admin/produtos" className={link}>Cardápio</NavLink>
            </>
          ) : (
            usuario && <NavLink to="/pedidos" className={link}>Meus pedidos</NavLink>
          )}
          {usuario ? (
            <button
              onClick={() => { navegar("/"); sair(); }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-tinta/70 hover:text-tinta"
            >
              Sair
            </button>
          ) : (
            <NavLink to="/entrar" className={link}>Entrar</NavLink>
          )}
          {usuario?.perfil !== "ADMIN" && (
            <Link
              to="/carrinho"
              aria-label={`Carrinho com ${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`}
              className="relative ml-1 grid h-11 w-11 place-items-center rounded-full bg-tinta text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 8h14l-1.5 11h-11z" strokeLinejoin="round" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {quantidadeTotal > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-framboesa px-1 text-xs font-bold tabular-nums">
                  {quantidadeTotal}
                </span>
              )}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
