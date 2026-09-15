# Portal Academia Limoeirense de Letras (A.L.L.)

Monorepo com separação completa entre **Backend** (API REST em Node.js + Express + TypeScript) e **Frontend** (React 19 + Vite + Tailwind CSS v4).

## Development Server

Para iniciar os dois serviços simultaneamente (API na porta 3001 e Frontend na porta 5173 com proxy reverso):
```bash
npm run dev
```

Ou individualmente:
```bash
npm run dev:frontend   # Frontend (Vite)
npm run dev:backend    # Backend (tsx watch)
```

## Project Structure

```
portal-all/
├── backend/                  # Servidor API REST (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/      # Handlers HTTP
│   │   ├── services/         # Regras de negócio e filtros
│   │   ├── routes/           # Rotas /api/...
│   │   ├── data/             # Datasets tipados (cadeiras, eventos, notícias, acervo)
│   │   ├── types/            # Definições TypeScript
│   │   ├── app.ts            # Configuração Express e middlewares
│   │   └── server.ts         # Ponto de entrada do servidor
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Aplicação Cliente (React 19 + Vite + Tailwind v4)
│   ├── src/
│   │   ├── components/       # Componentes de interface compartilhados
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── services/api.ts   # Conexão tipada com a API backend
│   │   ├── data/             # Fallback local de dados
│   │   ├── routes.tsx        # Rotas do React Router v8
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts        # Vite com proxy para http://localhost:3001
│   └── package.json
│
└── package.json              # Orquestrador com concurrently
```

## Endpoints da API (`http://localhost:3001/api`)

- `GET /api/health` - Status e uptime do servidor
- `GET /api/cadeiras` - Quadro de cadeiras (filtros `?status=` e busca `?q=`)
- `GET /api/cadeiras/:numero` - Detalhes completos da cadeira e acadêmico
- `GET /api/eventos` - Agenda cultural (filtro `?tipo=`)
- `GET /api/eventos/galeria` - Registros fotográficos
- `GET /api/noticias` - Artigos e comunicados
- `GET /api/acervo` - Publicações, revistas, anais e atas
- `POST /api/contato` - Envio de mensagens de contato/ouvidoria
