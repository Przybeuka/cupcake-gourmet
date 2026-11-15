import type { Produto } from "../types";
import { adicionarItem, alterarQuantidade, removerItem, subtotal, totalItens } from "./carrinho";

const produto = (sobrescrever: Partial<Produto> = {}): Produto => ({
  id: 1, nome: "Red Velvet", descricao: "", ingredientes: "", alergenos: null, peso_gramas: 110,
  preco: 12.9, estoque_diario: 5, esgotado: false, imagem_url: null, categorias: [], ...sobrescrever,
});

describe("HU 07 - adicionar ao carrinho", () => {
  it("adiciona um item novo", () => {
    const { itens, limitado } = adicionarItem([], produto());
    expect(itens).toHaveLength(1);
    expect(itens[0].quantidade).toBe(1);
    expect(limitado).toBe(false);
  });

  it("soma quantidades do mesmo sabor", () => {
    const primeiro = adicionarItem([], produto()).itens;
    const { itens } = adicionarItem(primeiro, produto(), 2);
    expect(itens).toHaveLength(1);
    expect(itens[0].quantidade).toBe(3);
  });

  it("RN07: não passa do estoque diário", () => {
    const { itens, limitado } = adicionarItem([], produto({ estoque_diario: 3 }), 10);
    expect(itens[0].quantidade).toBe(3);
    expect(limitado).toBe(true);
  });

  it("não adiciona produto esgotado", () => {
    const { itens, limitado } = adicionarItem([], produto({ estoque_diario: 0, esgotado: true }));
    expect(itens).toHaveLength(0);
    expect(limitado).toBe(true);
  });
});

describe("HU 08 - gerenciar carrinho", () => {
  const base = adicionarItem(adicionarItem([], produto(), 2).itens, produto({ id: 2, nome: "Pistache", preco: 16.9 })).itens;

  it("recalcula subtotal e total de itens", () => {
    expect(totalItens(base)).toBe(3);
    expect(subtotal(base)).toBe(42.7);
  });

  it("RN06: diminuir abaixo de 1 remove o item", () => {
    const itens = alterarQuantidade(base, 2, 0);
    expect(itens.map((i) => i.produto_id)).toEqual([1]);
  });

  it("aumentar respeita o estoque", () => {
    expect(alterarQuantidade(base, 1, 99)[0].quantidade).toBe(5);
  });

  it("lixeira remove o item", () => {
    expect(removerItem(base, 1).map((i) => i.produto_id)).toEqual([2]);
  });
});
