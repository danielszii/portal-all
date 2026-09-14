# Portal Academia Limoeirense de Letras (A.L.L.)

React + Vite + Tailwind CSS (v4) project for the Academia Limoeirense de Letras official portal.

## Development Server

Vite development server can be started using:
```bash
pnpm dev
# or npm run dev
```

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into `#root`
- `src/App.tsx` - Primary application component with React Router provider
- `src/routes.tsx` - App routing definitions
- `src/pages/` - Page components (Home, Academia, Cadeiras, Membro, Acervo, Agenda, Noticias, Contato)
- `src/components/` - Shared UI components (Layout, Header, Footer, etc.)
- `src/data/` - Static datasets for acadêmicos, cadeiras and agenda
- `src/index.css` - Global CSS styles and Tailwind CSS v4 setup
- `index.html` - HTML shell
- `package.json` - Project scripts and dependencies
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and `@` alias for `src`

## Dependencies

- Runtime: React 19, React DOM 19, React Router v8, Lucide React
- Styling: Tailwind CSS v4 with `@tailwindcss/vite`
- Build tooling: Vite 8, TypeScript 5.7
