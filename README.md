# Node.js application server with clean architecture

Project is meticulously designed and implemented following the principles of Clean Architecture, ensuring a robust and maintainable codebase. Clean Architecture (Layered Architecture), emphasizes the separation of concerns and the independence of the application's core business logic from external frameworks and delivery mechanisms.

### Powered by: 
- [Fastify](https://fastify.io/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

## Getting started

### Requirments:
- Node.js (18v or later)
- PostgresSQL (15v or later)
- Redis

### Setting environment variables:
```shell
# chatgpt-clone/.env

# Database
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/chatgpt-clone"

# Session (min 32 bytes-long secret)
SESSION_SECRET="<SECRET>"

# OpenAI
OPENAI_API_KEY="<KEY>"
```

### Installing dependencies:
```shell
cd ./system
npm i
cd ../chatgpt-clone
npm i
```

### Running migrations:
```shell
cd ./chatgpt-clone
npm run migrate
```

### Startup:
```shell
npm start # - start in production

npm run dev # - start in development mode (only from Node.js version 20 or later)
```