import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as regras from "../lib/carrinho";
import type { ItemCarrinho, Produto } from "../types";

const CHAVE = "cupcake.carrinho";

interface CarrinhoValor {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  subtotal: number;
  adicionar: (produto: Produto, quantidade?: number) => boolean;
  alterar: (produtoId: number, quantidade: number) => void;
  remover: (produtoId: number) => void;
  limpar: () => void;
}

const CarrinhoCtx = createContext<CarrinhoValor | null>(null);

function carregar(): ItemCarrinho[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(carregar);

  // HU 07 RNF: carrinho persiste se o app fechar de repente
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* armazenamento indisponível: carrinho vale só nesta sessão */
    }
  }, [itens]);

  const adicionar = (produto: Produto, quantidade = 1) => {
    const r = regras.adicionarItem(itens, produto, quantidade);
    setItens(r.itens);
    return !r.limitado;
  };

  const valor: CarrinhoValor = {
    itens,
    quantidadeTotal: regras.totalItens(itens),
    subtotal: regras.subtotal(itens),
    adicionar,
    alterar: (id, q) => setItens((atual) => regras.alterarQuantidade(atual, id, q)),
    remover: (id) => setItens((atual) => regras.removerItem(atual, id)),
    limpar: () => setItens([]),
  };

  return <CarrinhoCtx.Provider value={valor}>{children}</CarrinhoCtx.Provider>;
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoCtx);
  if (!ctx) throw new Error("useCarrinho fora do CarrinhoProvider");
  return ctx;
}
