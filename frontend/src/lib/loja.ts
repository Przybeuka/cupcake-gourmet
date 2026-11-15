/** Dados da loja exibidos na retirada (HU 10 CA#2). Taxa espelha o back-end (RN08). */
export const LOJA = {
  endereco: "Rua das Confeiteiras, 210, Centro, Curitiba/PR",
  horario: "Segunda a sábado, das 10h às 19h",
  prazoRetirada: "Seu pedido fica pronto em cerca de 40 minutos após o pagamento.",
};

export const TAXA_ENTREGA = 8;

export interface EnderecoViaCep {
  rua: string;
  bairro: string;
  cidade: string;
}

/** HU 10 RNF: autocompletar o endereço pelo CEP (ViaCEP). */
export async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
  const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!r.ok) return null;
  const d = await r.json();
  if (d.erro) return null;
  return { rua: d.logradouro ?? "", bairro: d.bairro ?? "", cidade: d.localidade ? `${d.localidade}/${d.uf}` : "" };
}
