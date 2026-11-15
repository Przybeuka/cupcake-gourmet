import { Link, Route, Routes } from "react-router-dom";
import { Cabecalho } from "./components/Cabecalho";
import { RotaProtegida } from "./components/RotaProtegida";
import { botao } from "./components/ui";
import Cadastro from "./pages/Cadastro";
import Carrinho from "./pages/Carrinho";
import Catalogo from "./pages/Catalogo";
import Entrar from "./pages/Entrar";
import Finalizar from "./pages/Finalizar";
import MeusPedidos from "./pages/MeusPedidos";
import PedidoDetalhe from "./pages/PedidoDetalhe";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import FilaPedidos from "./pages/admin/FilaPedidos";
import ProdutoForm from "./pages/admin/ProdutoForm";
import ProdutosAdmin from "./pages/admin/ProdutosAdmin";

function NaoEncontrada() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-3 text-suave">O endereço pode ter mudado. Volte ao cardápio para continuar.</p>
      <Link to="/" className={`${botao.primario} mt-8`}>Ver cardápio</Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh">
      <Cabecalho />
      <main>
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/produto/:id" element={<ProdutoDetalhe />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/finalizar" element={<RotaProtegida><Finalizar /></RotaProtegida>} />
          <Route path="/pedidos" element={<RotaProtegida><MeusPedidos /></RotaProtegida>} />
          <Route path="/pedidos/:id" element={<RotaProtegida><PedidoDetalhe /></RotaProtegida>} />
          <Route path="/admin/pedidos" element={<RotaProtegida admin><FilaPedidos /></RotaProtegida>} />
          <Route path="/admin/produtos" element={<RotaProtegida admin><ProdutosAdmin /></RotaProtegida>} />
          <Route path="/admin/produtos/novo" element={<RotaProtegida admin><ProdutoForm /></RotaProtegida>} />
          <Route path="/admin/produtos/:id" element={<RotaProtegida admin><ProdutoForm /></RotaProtegida>} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </main>
    </div>
  );
}
