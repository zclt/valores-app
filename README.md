# Valores App

Aplicativo para visualização e controle de receitas e despesas.

## Tecnologias

- React 19 + TypeScript
- Vite
- Firebase Hosting

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

## Build

```bash
npm run build
```

Os arquivos de produção são gerados na pasta `dist/`.

## Deploy

O deploy é feito no Firebase Hosting (`val-ores-app`).

```bash
npm run deploy
```

Este comando executa o build e publica automaticamente.

**URL de produção:** https://val-ores-app.web.app

Para deployar apenas o hosting sem rebuild:

```bash
firebase deploy --only hosting
```
