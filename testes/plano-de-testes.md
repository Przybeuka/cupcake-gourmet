# Plano de Testes

Os testes seguem o Modelo V do material da disciplina: cada nível de especificação tem um nível de teste correspondente.

| Especificação | Teste correspondente | Onde |
|---|---|---|
| Requisitos (HU + RN) | Teste de aceitação com 5 usuários | [formulario-teste-usuario.md](formulario-teste-usuario.md) |
| Análise (casos de uso) | Teste de sistema (roteiro manual abaixo) | Seção 3 |
| Arquitetura (MVC + API) | Teste de integração (API + banco) | `backend/tests/` |
| Código | Teste unitário | `backend/tests/` e `frontend/src/**/*.test.ts(x)` |

## 1. Como executar

```bash
# Back-end (pytest): 54 testes
cd backend
python -m venv .venv
.venv\Scripts\activate        # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
pytest -v

# Front-end (Vitest): 15 testes
cd frontend
npm install
npm test
```

## 2. Rastreabilidade: requisito → teste automatizado

| HU / Regra | O que é verificado | Arquivo de teste |
|---|---|---|
| HU 01, RN01, RN02, RN11 | Cadastro válido; e-mail inválido; senha fraca; confirmação diferente; e-mail duplicado; senha gravada com bcrypt | `backend/tests/test_auth.py`, `frontend/src/lib/validacao.test.ts`, `frontend/src/components/componentes.test.tsx` |
| HU 02, RN03 | Login válido; mensagem de erro genérica; bloqueio após 5 tentativas; desbloqueio após 15 min | `backend/tests/test_auth.py` |
| HU 04, RN04 | Catálogo mostra só ativos; esgotado aparece com selo e no fim da lista | `backend/tests/test_catalogo.py` |
| HU 05, RN05 | Filtro por categoria; produto com várias categorias aparece em cada filtro; filtros combinados | `backend/tests/test_catalogo.py` |
| HU 06, RN06 | Ingredientes, alérgenos e peso; seletor não permite quantidade < 1 | `backend/tests/test_catalogo.py`, `frontend/src/components/componentes.test.tsx` |
| HU 07, RN07 | Adicionar, somar itens repetidos, limitar ao estoque, bloquear esgotado | `frontend/src/lib/carrinho.test.ts`, `backend/tests/test_pedidos.py` |
| HU 08, RN06 | Recalcular subtotal; remover quando quantidade < 1; lixeira | `frontend/src/lib/carrinho.test.ts` |
| HU 10, RN08 | Delivery cobra taxa fixa; CEP com 8 dígitos; endereço obrigatório; retirada sem taxa | `backend/tests/test_pedidos.py` |
| HU 11, RN10 | Cartão aprovado/recusado/inválido/vencido; Pix pendente → pago; Pix expirado cancela e devolve estoque; preço gravado no pedido | `backend/tests/test_pedidos.py` |
| HU 12 | Cliente vê só os próprios pedidos; linha do tempo por modalidade; cancelamento antes do preparo | `backend/tests/test_pedidos.py`, `frontend/src/components/componentes.test.tsx` |
| HU 13 | Cadastrar, editar, preço ≤ 0 rejeitado, switch de vitrine, upload até 2 MB, formato inválido | `backend/tests/test_admin.py` |
| HU 14, RN09 | Fila mostra só pedidos pagos, em ordem de chegada; transições de status válidas e inválidas; retirada não passa por "Saiu para entrega" | `backend/tests/test_admin.py` |
| Segurança | Rotas exigem login; cliente não acessa área administrativa | `backend/tests/test_auth.py`, `backend/tests/test_admin.py` |

## 3. Roteiro de teste de sistema (manual)

Executado em navegador, com celular (390 px) e computador (1280 px).

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o catálogo e filtrar por "Veganos" + "Sem Glúten" | Só "Coco e Maracujá Vegano Sem Glúten" aparece; "Limpar" volta a lista completa |
| 2 | Abrir "Chocolate Belga", escolher 2 unidades e adicionar | Alérgenos em destaque; contador do carrinho mostra 2 |
| 3 | Recarregar a página | Carrinho continua com os itens |
| 4 | No carrinho, diminuir um item até 0 | Item é removido e o total recalculado |
| 5 | Clicar em "Escolher entrega e pagar" sem estar logado | Vai para o login; após criar conta, volta ao checkout |
| 6 | Escolher delivery e digitar o CEP 01310-100 | Rua, bairro e cidade preenchidos; taxa de R$ 8,00 no total |
| 7 | Pagar com Pix | QR Code, código copia e cola e contagem de 10 min |
| 8 | Clicar em "Simular pagamento do Pix" | Pedido passa a "Recebido" e mostra a linha do tempo |
| 9 | Entrar como administrador e abrir a Fila | Pedido aparece em "Novos"; pedidos não pagos não aparecem |
| 10 | Avançar: Iniciar preparo → Marcar como pronto → Despachar → Entregue | Cliente vê cada etapa na linha do tempo |
| 11 | No Cardápio, desligar o switch de um sabor | O sabor some da vitrine do cliente, sem ser apagado |
| 12 | Pagar com cartão terminado em 0002 | Mensagem de recusa; nenhum pedido criado |

## 4. Resultado da última execução

| Data | Back-end | Front-end | Teste de sistema |
|---|---|---|---|
| 15/11/2026 | 54/54 passaram | 15/15 passaram | Roteiro executado. Bugs encontrados e corrigidos: (1) após criar o pedido, a tela ia para o carrinho em vez do pedido; (2) botão "Adicionar" passava da borda no celular; (3) ilustração pequena demais nas miniaturas |
