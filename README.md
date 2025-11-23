# Seu Cantinho API

API REST em camadas para o sistema de reservas "Seu Cantinho". A solução aborda os
recursos de usuários, espaços, reservas e pagamentos, garantindo execução via
Docker Compose e documentação OpenAPI/Swagger.

## Arquitetura

- **Camadas**: apresentação (Express controllers/rotas), aplicação (serviços e
  regras de negócio), domínio (entidades, enums e erros) e infraestrutura
  (repositórios SQLite).
- **Banco**: SQLite com `better-sqlite3`, habilitando `FOREIGN KEY` e bloqueio de
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
└── infra          # Banco SQLite e repositórios
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker 28.4+ e Docker Compose (para execução containerizada)

## Executando localmente

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
- `npm run seed`: popula dados base no SQLite local

Variáveis úteis (`.env`):

- `PORT` (default: 3333)
- `DATABASE_FILE` (default: `data/database.sqlite`)

## Executando com Docker Compose

```bash
docker compose up --build
# API disponível em http://localhost:3333/api e documentação em http://localhost:3333/docs
```

Os dados persistem no volume nomeado `api-data`.

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

## Seed de dados

Para acelerar validações manuais existe um script de seed que cria:

- Usuário `maria@seucantinho.com`
- Dois espaços pré-configurados
- Uma reserva confirmada e um pagamento de sinal

Execute:

```bash
npm run seed
```

## Estrutura adicional

- `docker-compose.yml`: orquestração completa com único comando.
- `uml/`: diagramas fornecidos no enunciado.
- `PDF/`: especificação original para consulta.

Sinta-se à vontade para adaptar a API adicionando autenticação, testes
automatizados ou integrações externas conforme novas entregas.
