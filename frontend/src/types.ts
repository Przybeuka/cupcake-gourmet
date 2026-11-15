export type Perfil = "CLIENTE" | "ADMIN";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  ingredientes: string;
  alergenos: string | null;
  peso_gramas: number;
  preco: number;
  estoque_diario: number;
  esgotado: boolean;
  imagem_url: string | null;
  categorias: Categoria[];
  ativo?: boolean;
}

export type StatusPedido =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "EM_PREPARO"
  | "PRONTO"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export type Modalidade = "DELIVERY" | "RETIRADA";
export type MetodoPagamento = "PIX" | "CARTAO";

export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  referencia: string | null;
}

export interface Pedido {
  id: number;
  status: StatusPedido;
  modalidade: Modalidade;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  criado_em: string;
  atualizado_em: string;
  pode_cancelar: boolean;
  itens: { produto_id: number; nome: string; quantidade: number; preco_unitario: number; subtotal: number }[];
  endereco: Endereco | null;
  pagamento: {
    metodo: MetodoPagamento;
    status: "PENDENTE" | "APROVADO" | "RECUSADO";
    valor: number;
    pago_em: string | null;
    pix_codigo?: string;
    pix_expira_em?: string;
  } | null;
  cliente?: { nome: string; email: string };
  proximos_status?: StatusPedido[];
}

export interface ItemCarrinho {
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  estoque: number;
  imagem_url: string | null;
}
