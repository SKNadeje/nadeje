# TipParta

## Instalace

```bash
npx create-expo-app@latest tipparta
cd tipparta
```

Nakopíruj soubory z tohoto zipu do projektu, pak:

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
cp .env.example .env   # vyplň hodnoty ze Supabase dashboardu
echo ".env" >> .gitignore
npx expo start
```

## Logo

Až budeš mít logo, ulož ho jako `assets/logo.png` a v `app/index.tsx` změň:
```ts
// z:
const LOGO = null;
// na:
const LOGO = require('../assets/logo.png');
```

## GitHub

```bash
git init && git add . && git commit -m "feat: úvodní obrazovka a registrace"
gh repo create tipparta --private --source=. --remote=origin --push
```
