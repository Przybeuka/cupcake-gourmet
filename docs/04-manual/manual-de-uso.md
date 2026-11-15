# Manual de Uso

## Para o cliente

### Criar conta e entrar
1. Clique em **Entrar** no topo e depois em **Criar conta**.
2. Informe nome, e-mail e uma senha com 8 caracteres ou mais, uma letra maiúscula e um número. Os requisitos ficam verdes conforme você digita.
3. Após 5 tentativas de login erradas, a conta fica bloqueada por 15 minutos.

### Escolher os cupcakes
- O cardápio mostra os sabores disponíveis hoje. Sabores esgotados aparecem em cinza no fim da lista.
- Use os botões **Tradicionais**, **Veganos**, **Zero Lactose** e **Sem Glúten** para filtrar. Com mais de um filtro, aparecem os sabores que atendem a **todos** ao mesmo tempo. **Limpar** remove os filtros.
- Clique em um sabor para ver ingredientes, peso e o aviso de **alérgenos**, e escolher a quantidade.

### Carrinho
- O ícone no topo mostra quantos itens há no carrinho. Ele fica salvo mesmo se você fechar o navegador.
- Use **−** e **+** para mudar quantidades; diminuir abaixo de 1 remove o item. A lixeira remove na hora.
- Não é possível colocar mais unidades do que o estoque do dia.

### Fechar o pedido
1. Clique em **Escolher entrega e pagar** (é preciso estar logado).
2. **Entrega delivery:** digite o CEP; rua, bairro e cidade são preenchidos automaticamente. Complete o número. A taxa é de R$ 8,00.
   **Retirar no balcão:** aparece o endereço e o horário da loja, sem taxa.
3. Escolha o pagamento:
   - **Pix:** aparece o QR Code e o código copia e cola, válido por 10 minutos. Se não for pago nesse prazo, o pedido é cancelado.
   - **Cartão de crédito:** aprovação na hora.

> Ambiente de demonstração: o pagamento é simulado. No Pix, o botão **Simular pagamento do Pix** faz o papel do banco. No cartão, use `4111 1111 1111 1111` com validade futura; cartões terminados em `0002` são recusados para teste.

### Acompanhar o pedido
- Em **Meus pedidos**, abra o pedido para ver a linha do tempo: Recebido → Em preparo → Pronto → Saiu para entrega → Entregue (na retirada: Pronto para retirar → Retirado).
- A tela se atualiza sozinha a cada 20 segundos, ou use **Atualizar**.
- Enquanto o pedido não entrou em preparo, é possível **cancelar**. Os itens voltam para o estoque.

## Para a loja (administrador)

Entre com a conta de administrador. O menu passa a mostrar **Fila** e **Cardápio**.

### Fila de pedidos
- Mostra apenas pedidos **já pagos**, do mais antigo para o mais novo, em três colunas: Novos, Em preparo, Prontos e em rota.
- A tela se atualiza a cada 10 segundos. Quando chega um pedido novo, toca um sinal sonoro e o cartão pisca.
- Use os botões do cartão para avançar: **Iniciar preparo**, **Marcar como pronto**, **Despachar para entrega** (só delivery) e **Marcar como entregue**.
- Pedidos novos podem ser cancelados; o estoque é devolvido.

### Cardápio
- O switch **Na vitrine / Oculto** tira o sabor da vitrine sem apagar o cadastro.
- **Cadastrar sabor** e **Editar** abrem o formulário: nome, descrição, ingredientes, alérgenos, preço (maior que zero), peso, estoque do dia e categorias.
- A foto aceita PNG, JPG ou WEBP de até 2 MB. Sem foto, o sistema mostra uma ilustração com a cor do sabor.
- O **estoque do dia** baixa a cada venda e volta quando um pedido é cancelado.
