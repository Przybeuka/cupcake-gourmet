import type { ItemCarrinho, Produto } from "../types";

/** Regras puras do carrinho (testadas em carrinho.test.ts). */

export type ResultadoAdicao = { itens: ItemCarrinho[]; limitado: boolean };

/** HU 07 + RN07: soma ao carrinho sem passar do estoque diário. */
export function adicionarItem(itens: ItemCarrinho[], produto: Produto, quantidade = 1): ResultadoAdicao {
  if (produto.esgotado || produto.estoque_diario <= 0 || quantidade < 1) return { itens, limitado: true };
  const existente = itens.find((i) => i.produto_id === produto.id);
  const desejado = (existente?.quantidade ?? 0) + quantidade;
  const final = Math.min(desejado, produto.estoque_diario);
  const item: ItemCarrinho = {
    produto_id: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    imagem_url: produto.imagem_url,
    estoque: produto.estoque_diario,
    quantidade: final,
  };
  const novos = existente
    ? itens.map((i) => (i.produto_id === produto.id ? item : i))
    : [...itens, item];
  return { itens: novos, limitado: final < desejado };
}

/** HU 08 + RN06: abaixo de 1 o item sai da lista; acima do estoque é limitado. */
export function alterarQuantidade(itens: ItemCarrinho[], produtoId: number, quantidade: number): ItemCarrinho[] {
  if (quantidade < 1) return removerItem(itens, produtoId);
  return itens.map((i) =>
    i.produto_id === produtoId ? { ...i, quantidade: Math.min(quantidade, i.estoque) } : i,
  );
}

export function removerItem(itens: ItemCarrinho[], produtoId: number): ItemCarrinho[] {
  return itens.filter((i) => i.produto_id !== produtoId);
}

export const totalItens = (itens: ItemCarrinho[]) => itens.reduce((s, i) => s + i.quantidade, 0);

export const subtotal = (itens: ItemCarrinho[]) =>
  Math.round(itens.reduce((s, i) => s + i.preco * i.quantidade, 0) * 100) / 100;
