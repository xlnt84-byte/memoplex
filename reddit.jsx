// Завантаження постів з Reddit API + мапінг у формат, який очікує стрічка.
// Reddit JSON endpoint безкоштовний, не потребує авторизації.
//
// Категорії прив'язані до сабреддитів:
//   tvaryny  → AnimalsBeingDerps, Eyebleach
//   it       → ProgrammerHumor, programminghumor
//   sport    → sportsmemes, soccercirclejerk
//   lokalni  → ukraina, Pikabu_Ukraine
//
// Якщо запит не вдається (CORS / 429 / offline) — компонент впаде на мок.

const REDDIT_SOURCES = [
  { sub: 'AnimalsBeingDerps', cat: 'tvaryny' },
  { sub: 'Eyebleach',         cat: 'tvaryny' },
  { sub: 'ProgrammerHumor',   cat: 'it' },
  { sub: 'sportsmemes',       cat: 'sport' },
  { sub: 'ukraina',           cat: 'lokalni' },
];

// Reddit повертає секунди-from-epoch. Робимо людський таймстамп.
function relativeTime(tsSec) {
  const diff = Math.max(0, Date.now() / 1000 - tsSec);
  if (diff < 60)       return Math.floor(diff) + ' сек тому';
  if (diff < 3600)     return Math.floor(diff / 60) + ' хв тому';
  if (diff < 86400)    return Math.floor(diff / 3600) + ' год тому';
  if (diff < 86400*7)  return Math.floor(diff / 86400) + ' дн тому';
  return Math.floor(diff / 604800) + ' тиж тому';
}

// Reddit іноді ховає картинку в preview.images[0].source.url з &amp; -> треба декодувати.
function decodeUrl(u) {
  if (!u) return null;
  return u.replace(/&amp;/g, '&');
}

// З поста дістаємо найкращу доступну картинку.
function extractImage(post) {
  // 1) прямий лінк на jpg/png/gif
  if (post.url && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(post.url)) {
    return post.url;
  }
  // 2) preview
  const prev = post.preview && post.preview.images && post.preview.images[0];
  if (prev) {
    if (prev.source && prev.source.url) return decodeUrl(prev.source.url);
    if (prev.resolutions && prev.resolutions.length) {
      const best = prev.resolutions[prev.resolutions.length - 1];
      return decodeUrl(best.url);
    }
  }
  // 3) thumbnail (низька якість, але краще ніж нічого)
  if (post.thumbnail && /^https?:/.test(post.thumbnail)) return post.thumbnail;
  return null;
}

async function fetchSubreddit({ sub, cat }, limit = 12) {
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}&raw_json=1`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`r/${sub}: ${res.status}`);
  const json = await res.json();
  const items = (json.data && json.data.children) || [];
  return items
    .map(({ data: p }) => {
      const img = extractImage(p);
      if (!img) return null;
      // фільтруємо NSFW
      if (p.over_18) return null;
      return {
        id: 'r_' + p.id,
        title: p.title,
        cat,
        author: '@' + p.author,
        time: relativeTime(p.created_utc),
        likes: p.ups || 0,
        shares: Math.round((p.ups || 0) * 0.18),
        comments: p.num_comments || 0,
        cover: 0, // не використовується коли є imageUrl
        imageUrl: img,
        permalink: 'https://reddit.com' + p.permalink,
        sub: p.subreddit,
        // числа для сортувань: hot — по позиції у відповіді, fresh — по даті, top — по апвоутах
        hotness: 0,    // присвоїться після злиття
        freshness: p.created_utc,
        top: p.ups || 0,
        caption: (p.selftext || '').slice(0, 200) || `${p.subreddit} · ${(p.ups || 0)} upvotes`,
      };
    })
    .filter(Boolean);
}

// Тягне з усіх джерел паралельно, обʼєднує, дедуплікує, перемішує по категорії.
async function fetchAllMemes() {
  const results = await Promise.allSettled(REDDIT_SOURCES.map(s => fetchSubreddit(s)));
  let memes = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      // hotness — інверсія індексу в межах сабу (перші у hot — гарячіші)
      r.value.forEach((m, idx) => { m.hotness = (r.value.length - idx) / r.value.length; });
      memes.push(...r.value);
    } else {
      console.warn('reddit failed:', REDDIT_SOURCES[i].sub, r.reason);
    }
  });
  if (memes.length === 0) throw new Error('Reddit недоступний — усі джерела впали');
  // перемішуємо щоб у стрічці категорії чергувалися
  return interleave(memes);
}

// Чергує елементи різних категорій, щоб стрічка не була блоками.
function interleave(items) {
  const buckets = {};
  items.forEach(m => { (buckets[m.cat] = buckets[m.cat] || []).push(m); });
  const out = [];
  let any = true;
  while (any) {
    any = false;
    for (const k of Object.keys(buckets)) {
      if (buckets[k].length) { out.push(buckets[k].shift()); any = true; }
    }
  }
  return out;
}

Object.assign(window, { fetchAllMemes });
