# Escopo Revisado (Kaizen sobre a PIT I)

## 1. Contexto

Na PIT I foram levantadas 15 Histórias de Usuário (HU) para um aplicativo de vendas
online de uma loja de cupcakes gourmet, cujo cliente havia sofrido com um app anterior
disfuncional por falhas na coleta de requisitos. Nesta etapa o escopo foi revisado para
viabilizar a **implementação, os testes e a validação com usuários** dentro do prazo
da disciplina.

## 2. Mudanças em relação à PIT I

| # | Mudança | Justificativa |
|---|---|---|
| M1 | App mobile nativo → **aplicação web responsiva (PWA)** | Os testadores acessam por um link, sem instalar APK; mantém a experiência mobile (layout responsivo, RNF da HU 06) |
| M2 | Pagamento real (HU 11) → **pagamento simulado** | Integração com gateway exige credenciamento comercial; o fluxo e os estados do pagamento são mantidos e podem ser trocados por gateway real depois |
| M3 | Frete por distância e raio de 15 km (HU 10) → **ViaCEP + taxa fixa** | Elimina dependência de API paga de geolocalização; a regra de raio fica no backlog |
| M4 | Status em tempo real (HU 12) → **status atualizado por consulta** | Evita WebSocket; o cliente vê o status ao abrir/atualizar a tela |
| M5 | HU 03, 09 e 15 → **backlog futuro** | Prioridades B/C, dependem de serviço de e-mail (03) ou não fazem parte do fluxo essencial de compra |
| M6 | Perfil **Administrador** formalizado | As HU 13 e 14 já previam a loja operando o sistema; agora é um ator explícito |

## 3. Escopo do MVP

| HU | Título | Prioridade | Situação |
|---|---|---|---|
| 01 | Criar conta de acesso | A | Mantida |
| 02 | Efetuar login | A | Mantida (bloqueio após 5 tentativas incluído) |
| 04 | Visualizar catálogo | A | Mantida |
| 05 | Filtrar por categorias e restrições | B | Mantida |
| 06 | Detalhes do produto e alérgenos | A | Mantida |
| 07 | Adicionar ao carrinho | A | Mantida |
| 08 | Gerenciar itens do carrinho | A | Mantida |
| 10 | Selecionar modalidade de entrega | A | Simplificada (M3) |
| 11 | Efetuar pagamento | A | Simplificada (M2) |
| 12 | Acompanhar status do pedido | B | Simplificada (M4) |
| 13 | Cadastrar e gerenciar produtos | A | Mantida |
| 14 | Gerenciar fila de pedidos | A | Mantida |

**Backlog futuro:** HU 03 (recuperar senha), HU 09 (kit presente), HU 15 (relatório de vendas).

## 4. Atores

- **Visitante:** pode criar conta e ver o catálogo.
- **Cliente:** usuário autenticado que compra.
- **Administrador:** funcionário da loja que gerencia o cardápio e os pedidos.

## 5. Ciclo de vida do pedido

`AGUARDANDO_PAGAMENTO → PAGO → EM_PREPARO → PRONTO → SAIU_PARA_ENTREGA / RETIRADO → ENTREGUE`
Em qualquer etapa anterior a `EM_PREPARO`, o pedido pode ir para `CANCELADO`.

## 6. Regras de negócio consolidadas

| Código | Regra | HU |
|---|---|---|
| RN01 | E-mail único por usuário | 01 |
| RN02 | Senha com no mínimo 8 caracteres, 1 maiúscula e 1 número | 01 |
| RN03 | Bloquear login por 15 min após 5 tentativas consecutivas erradas | 02 |
| RN04 | Catálogo exibe apenas produtos ativos | 04 |
| RN05 | Produto com várias categorias aparece em todos os filtros correspondentes | 05 |
| RN06 | Quantidade mínima de um item é 1; abaixo disso o item é removido | 06, 08 |
| RN07 | Quantidade no carrinho limitada ao estoque diário do produto | 07 |
| RN08 | Delivery exige CEP válido (ViaCEP) e cobra taxa fixa | 10 |
| RN09 | Pedido só entra na fila da cozinha após pagamento aprovado | 11, 14 |
| RN10 | Preço do item é gravado no pedido no momento da compra | 11 |
| RN11 | Senhas armazenadas com hash bcrypt | 01 |
