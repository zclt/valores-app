# 💰 Valores

> Controle suas receitas e despesas de forma simples e visual.

Cole seus lançamentos, veja o saldo na hora. Seus dados ficam salvos na nuvem e sincronizam em qualquer dispositivo.

---

## Stack

- **React 19** + TypeScript
- **Vite**
- **Firebase** — Auth (Google), Firestore, Hosting

---

## Rodando localmente

```bash
cp .env.example .env   # preencha as variáveis Firebase
npm install
npm run dev            # http://localhost:5173
```

## Build

```bash
npm run build          # gera dist/
```

## Deploy

```bash
npm run deploy         # build + firebase deploy (hosting + firestore rules)
```

**Produção:** https://val-ores-app.web.app

---

## Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

No CI, as mesmas variáveis devem existir como secrets no GitHub Actions.
