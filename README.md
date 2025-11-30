# Seu Cantinho API

API REST em camadas para o sistema de reservas "Seu Cantinho". A solução aborda os
recursos de usuários, espaços, reservas e pagamentos, garantindo execução via
Docker Compose e documentação OpenAPI/Swagger.

## Arquitetura

- **Camadas**: apresentação (Express controllers/rotas), aplicação (serviços e
  regras de negócio), domínio (entidades, enums e erros) e infraestrutura
  (repositórios PostgreSQL).
- **Banco**: PostgreSQL, habilitando `FOREIGN KEY` e bloqueio de
  double-booking por meio de validação transacional na criação/edição de reservas.
- **Validação**: Zod garante contratos de entrada e traduz erros para respostas
  HTTP 422.
- **Documentação**: `openapi.yaml` servido em `/docs` via Swagger UI.

```
src
├── app            # Controllers, rotas, middlewares e validações
├── application    # Serviços (regras de negócio)
├── config         # Configurações e variáveis de ambiente
├── domain         # Entidades, enums e erros reutilizáveis
└── infra          # Banco PostgreSQL e repositórios
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker 28.4+ e Docker Compose (para execução containerizada)

## Executando localmente

Para executar localmente, você precisará de uma instância do PostgreSQL rodando.
Recomendamos utilizar o Docker Compose para subir o banco de dados:

```bash
docker compose up -d db
```

Em seguida, instale as dependências e execute a aplicação:

```bash
npm install
npm run dev # recarrega em tempo real
```

Scripts adicionais:

- `npm run lint`: checa tipos/compilação
- `npm run build`: gera artefatos em `dist`
- `npm start`: executa a versão compilada (exige `npm run build` prévio)
- `npm run test`: executa a suíte Vitest com Supertest (fluxos principais)
- `npm run test:watch`: modo interativo para desenvolvimento
- `npm run seed`: popula dados base no banco
- `npm run migrate`: executa as migrações do banco

Variáveis úteis (`.env`):

- `PORT` (default: 3333)
- `DB_HOST` (default: `postgres` - para docker, use `localhost` para local)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: `seu_cantinho`)
- `DB_USER` (default: `seucantinho`)
- `DB_PASSWORD` (default: `seucantinho`)

## Executando com Docker Compose

```bash
docker compose up --build
# API disponível em http://localhost:3333/api e documentação em http://localhost:3333/docs
```

Os dados persistem no volume nomeado `pgdata`.

## Documentação da API

- Swagger UI: `http://localhost:3333/docs`
- Arquivo fonte: [`openapi.yaml`](openapi.yaml)

Principais grupos de rotas (`/api/...`):

- `GET /health`: verificação de saúde
- `users`: CRUD de usuários
- `spaces`: CRUD de espaços
- `reservations`: CRUD com validações contra conflitos de horário
- `payments`: CRUD com vínculo a reservas

## Teste rápido via HTTP

```bash
# 1. cria usuário
curl -X POST http://localhost:3333/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Maria Souza","email":"maria@example.com"}'

# 2. lista espaços
curl http://localhost:3333/api/spaces
```

## Credenciais de Acesso (Demo)

O sistema já vem com dados de demonstração. Para acessar o frontend:

| Campo | Valor |
|-------|-------|
| **URL** | <http://localhost:8080/login> |
| **Email** | `maria@seucantinho.com` |
| **Senha** | `senha123` |

Este usuário possui perfil **master** (Dona Maria) com acesso total ao sistema.

## Seed de dados

O seed é executado automaticamente ao iniciar os containers e cria:

- Usuário `maria@seucantinho.com` (senha: `senha123`, perfil: master)
- Dois espaços pré-configurados (Chácara e Salão)
- Uma reserva confirmada e um pagamento de sinal

Para executar manualmente (desenvolvimento local):

```bash
npm run seed
```

## Estrutura adicional

- `docker-compose.yml`: orquestração completa com único comando.
- `uml/`: diagramas fornecidos no enunciado.
- `PDF/`: especificação original para consulta.

Sinta-se à vontade para adaptar a API adicionando autenticação, testes
automatizados ou integrações externas conforme novas entregas.
