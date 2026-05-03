# Мемоплекс

Прототип стрічки українських мемів — 3 варіанти розкладки + admin-модерація + схема архітектури гібридного джерела.

## Локально

```bash
npx serve .
# або
python3 -m http.server 3000
```

Відкрити `http://localhost:3000`.

## Деплой на Vercel

### Спосіб 1 — через CLI

```bash
npm i -g vercel
vercel
```

Vercel визначить це як статичний проєкт автоматично. Production-білд:

```bash
vercel --prod
```

### Спосіб 2 — через GitHub

1. Заллий репо на GitHub
2. На [vercel.com](https://vercel.com) → **Add New → Project** → обери репо
3. Framework Preset: **Other**
4. Build Command: *(пусто)*
5. Output Directory: `.`
6. **Deploy**

## Структура

```
index.html              ← головна сторінка (канвас з усіма артбордами)
data.jsx                ← mock-дані мемів
shared.jsx              ← спільні хуки/компоненти (useFeedState, MemeModal, Toast)
feed-magazine.jsx       ← варіант A (герой + сітка)
feed-masonry.jsx        ← варіант B (мозаїка)
feed-stack.jsx          ← варіант C (соцмережна стрічка)
feed-admin.jsx          ← варіант D (адмінка) + E (схема архітектури)
design-canvas.jsx       ← дизайн-канвас (pan/zoom, focus mode)
tweaks-panel.jsx        ← панель Tweaks
vercel.json             ← правила хостингу (MIME для .jsx, кеш-хедери)
```

## Подальші кроки → справжня PWA

1. Перенести на Next.js (`npx create-next-app`) — отримати `/api`, image optimization
2. Додати `manifest.json` + іконки 192/512/maskable
3. Зареєструвати Service Worker (Workbox для готових стратегій кешу)
4. Підключити Vercel Postgres + Vercel Blob для черги модерації
5. Cron-агрегатор Reddit/Telegram → `vercel.json` з `crons`
