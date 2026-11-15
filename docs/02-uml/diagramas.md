# Diagramas UML

> Os diagramas estão em Mermaid e são renderizados automaticamente pelo GitHub.

## 1. Casos de Uso

```mermaid
flowchart LR
    V([Visitante])
    C([Cliente])
    A([Administrador])

    subgraph Sistema Cupcake Gourmet
        UC01[UC01 Criar conta]
        UC02[UC02 Efetuar login]
        UC04[UC04 Visualizar catálogo]
        UC05[UC05 Filtrar por categoria]
        UC06[UC06 Ver detalhes e alérgenos]
        UC07[UC07 Adicionar ao carrinho]
        UC08[UC08 Gerenciar carrinho]
        UC10[UC10 Escolher entrega ou retirada]
        UC11[UC11 Pagar pedido]
        UC12[UC12 Acompanhar status]
        UC13[UC13 Gerenciar produtos]
        UC14[UC14 Gerenciar fila de pedidos]
    end

    V --> UC01
    V --> UC04
    C --> UC02
    C --> UC04
    C --> UC05
    C --> UC06
    C --> UC07
    C --> UC08
    C --> UC10
    C --> UC11
    C --> UC12
    A --> UC02
    A --> UC13
    A --> UC14
    UC11 -. include .-> UC10
    UC05 -. extend .-> UC04
```

## 2. Diagrama de Classes (domínio / persistência)

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        -string senhaHash
        +Perfil perfil
        +int tentativasLogin
        +datetime bloqueadoAte
        +datetime criadoEm
        +verificarSenha(senha) bool
        +estaBloqueado() bool
    }
    class Categoria {
        +int id
        +string nome
    }
    class Produto {
        +int id
        +string nome
        +string descricao
        +string ingredientes
        +string alergenos
        +int pesoGramas
        +decimal preco
        +int estoqueDiario
        +bool ativo
        +string imagemUrl
        +estaDisponivel(qtd) bool
    }
    class Pedido {
        +int id
        +StatusPedido status
        +Modalidade modalidade
        +decimal subtotal
        +decimal taxaEntrega
        +decimal total
        +datetime criadoEm
        +calcularTotal() decimal
        +avancarStatus() void
        +cancelar() void
    }
    class ItemPedido {
        +int id
        +int quantidade
        +decimal precoUnitario
        +subtotal() decimal
    }
    class EnderecoEntrega {
        +string cep
        +string rua
        +string numero
        +string bairro
        +string cidade
        +string referencia
    }
    class Pagamento {
        +int id
        +MetodoPagamento metodo
        +StatusPagamento status
        +decimal valor
        +datetime pagoEm
        +aprovar() void
    }
    class Perfil {
        <<enumeration>>
        CLIENTE
        ADMIN
    }
    class Modalidade {
        <<enumeration>>
        DELIVERY
        RETIRADA
    }
    class StatusPedido {
        <<enumeration>>
        AGUARDANDO_PAGAMENTO
        PAGO
        EM_PREPARO
        PRONTO
        SAIU_PARA_ENTREGA
        ENTREGUE
        CANCELADO
    }

    Usuario "1" --> "0..*" Pedido : realiza
    Pedido "1" *-- "1..*" ItemPedido : contém
    ItemPedido "0..*" --> "1" Produto : refere-se
    Produto "0..*" -- "1..*" Categoria : classificado em
    Pedido "1" *-- "0..1" EnderecoEntrega : entrega em
    Pedido "1" *-- "0..1" Pagamento : pago por
```

## 3. Diagrama de Sequência — Fechar pedido (UC10 + UC11)

```mermaid
sequenceDiagram
    actor C as Cliente
    participant F as Front-end (React)
    participant PC as PedidoController
    participant VC as ViaCEP
    participant M as Models (Pedido/Produto)
    participant DB as PostgreSQL

    C->>F: Confirma carrinho e escolhe Delivery
    F->>VC: GET /ws/{cep}/json
    VC-->>F: Endereço
    C->>F: Escolhe Pix e confirma
    F->>PC: POST /api/pedidos (itens, entrega, pagamento)
    PC->>M: Validar estoque de cada item (RN07)
    M->>DB: SELECT produtos
    alt estoque insuficiente
        PC-->>F: 409 Conflito + item indisponível
        F-->>C: Mensagem de erro
    else estoque ok
        PC->>M: Criar Pedido (AGUARDANDO_PAGAMENTO)
        M->>DB: INSERT pedido, itens, endereço, pagamento
        PC->>M: Pagamento simulado → aprovar()
        M->>DB: UPDATE pagamento = APROVADO, pedido = PAGO
        PC-->>F: 201 Criado + número do pedido
        F-->>C: Tela de confirmação e status
    end
```

## 4. Diagrama de Atividades — Jornada de compra

```mermaid
flowchart TD
    I((Início)) --> A[Abrir catálogo]
    A --> B{Aplicar filtro?}
    B -- Sim --> B1[Filtrar categorias] --> D
    B -- Não --> D[Ver detalhes do produto]
    D --> E[Adicionar ao carrinho]
    E --> F{Continuar comprando?}
    F -- Sim --> A
    F -- Não --> G{Está logado?}
    G -- Não --> H[Login / Cadastro] --> J
    G -- Sim --> J[Escolher modalidade]
    J --> K{Delivery?}
    K -- Sim --> L[Informar CEP e endereço]
    K -- Não --> M[Ver endereço da loja]
    L --> N[Escolher pagamento]
    M --> N
    N --> O{Pagamento aprovado?}
    O -- Não --> N
    O -- Sim --> P[Pedido entra na fila da cozinha]
    P --> Q((Fim))
```

## 5. Arquitetura MVC do back-end

```mermaid
flowchart LR
    FE[Front-end React] -- HTTP/JSON --> R[Rotas Flask]
    subgraph Backend Flask
        R --> CT[Controllers]
        CT --> MD[Models SQLAlchemy]
        CT --> VW[Views / Serializers JSON]
    end
    MD --> DB[(PostgreSQL)]
```
