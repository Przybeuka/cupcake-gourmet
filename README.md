# Cupcake Gourmet — Sistema de Vendas Online

Projeto Integrador Transdisciplinar em Engenharia de Software II — Cruzeiro do Sul Virtual
Autor: Jeander Kauan Przybeuka — RGM 40561992

Aplicação web responsiva (PWA) para venda online de uma loja de cupcakes gourmet:
o cliente navega pelo catálogo, monta o carrinho e fecha o pedido; a loja gerencia
o cardápio e a fila de pedidos.

| | Link |
|---|---|
| Sistema em funcionamento | _a definir (Vercel)_ |
| API | _a definir (Render)_ |
| Vídeo de demonstração | _a definir_ |

## Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| [`docs/01-escopo`](docs/01-escopo) | Escopo revisado (melhoria contínua sobre a PIT I) |
| [`docs/02-uml`](docs/02-uml) | Diagramas de casos de uso, classes, sequência e atividades |
| [`docs/03-banco-de-dados`](docs/03-banco-de-dados) | Modelo conceitual, lógico, script físico (SQL) e dicionário de dados |
| [`docs/04-manual`](docs/04-manual) | Manual de uso (cliente e loja) |
| [`backend/`](backend) | API em Python + Flask, padrão MVC |
| [`frontend/`](frontend) | Interface em React + TypeScript + Tailwind CSS |
| [`testes/`](testes) | Plano de testes, rastreabilidade, formulário de teste com usuários e laudos |

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 18, TypeScript, Tailwind CSS 4, Vite (hospedagem: Vercel) |
| Back-end | Python 3, Flask, SQLAlchemy, JWT, bcrypt — padrão MVC (hospedagem: Render) |
| Banco de dados | PostgreSQL (produção) / SQLite (desenvolvimento e testes) |
| Testes | pytest (54 testes no back-end), Vitest + Testing Library (15 testes no front-end) |
| Integrações | ViaCEP (autopreenchimento de endereço) |

## Arquitetura MVC do back-end

```
backend/app/
├── models/          Model: entidades, regras de negócio e validação (Usuario, Produto, Pedido, Pagamento…)
├── views/           View: serialização dos models em JSON
├── controllers/     Controller: rotas HTTP, leitura da requisição, orquestra models e views
├── auth.py          Emissão e verificação de token JWT, controle de perfil (cliente/admin)
├── errors.py        Tratamento centralizado de erros com mensagens amigáveis
└── seed.py          Dados iniciais (categorias, administrador, cardápio)
```

## Como rodar localmente

Pré-requisitos: Python 3.12+ e Node.js 20+.

```bash
# 1. Back-end (http://localhost:5000)
cd backend
python -m venv .venv
.venv\Scripts\activate            # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
flask --app run seed              # cria categorias, admin e cardápio de exemplo
python run.py

# 2. Front-end (http://localhost:5173), em outro terminal
cd frontend
npm install
npm run dev
```

Sem a variável `DATABASE_URL`, o back-end usa SQLite local. Para PostgreSQL, copie `backend/.env.example` para `backend/.env`.

**Conta da loja criada pelo seed:** `admin@cupcakegourmet.com` / `Admin1234` (troque com `ADMIN_SENHA` em produção).

### Testes

```bash
cd backend && pytest -v
cd frontend && npm test
```

## Publicação

1. **Back-end + banco (Render):** New → Blueprint → selecione este repositório. O [`render.yaml`](render.yaml) cria o PostgreSQL e a API. Defina `ADMIN_SENHA` e `CORS_ORIGINS` (URL da Vercel) no painel.
2. **Front-end (Vercel):** importe o repositório com *Root Directory* `frontend` e a variável `VITE_API_URL` apontando para a URL da API no Render.

## Endpoints da API

| Método | Rota | Acesso | HU |
|---|---|---|---|
| POST | `/api/auth/registrar` | Público | 01 |
| POST | `/api/auth/login` | Público | 02 |
| GET | `/api/auth/me` | Logado | 02 |
| GET | `/api/categorias` | Público | 05 |
| GET | `/api/produtos?categorias=1,2` | Público | 04, 05 |
| GET | `/api/produtos/{id}` | Público | 06 |
| POST | `/api/pedidos` | Cliente | 10, 11 |
| GET | `/api/pedidos` | Cliente | 12 |
| GET | `/api/pedidos/{id}` | Cliente | 12 |
| POST | `/api/pedidos/{id}/pix/confirmar` | Cliente | 11 |
| POST | `/api/pedidos/{id}/cancelar` | Cliente | 12 |
| GET / POST | `/api/admin/produtos` | Admin | 13 |
| PUT | `/api/admin/produtos/{id}` | Admin | 13 |
| PATCH | `/api/admin/produtos/{id}/ativo` | Admin | 13 |
| POST | `/api/admin/uploads` | Admin | 13 |
| GET | `/api/admin/pedidos` | Admin | 14 |
| PATCH | `/api/admin/pedidos/{id}/status` | Admin | 14 |
