// Дані мемів (mock). Використовуються в усіх трьох варіантах.
// Зображення мемів — стилізовані плейсхолдери (SVG patterns), бо реальних
// мемів ми не малюємо.

const MEME_CATEGORIES = [
  { id: 'all', label: 'Усі', emoji: '◆' },
  { id: 'tvaryny', label: 'Тварини', emoji: '◆' },
  { id: 'it', label: 'IT', emoji: '◆' },
  { id: 'sport', label: 'Спорт', emoji: '◆' },
  { id: 'lokalni', label: 'Локальні', emoji: '◆' },
];

const SORT_MODES = [
  { id: 'fresh', label: 'Свіжі' },
  { id: 'hot', label: 'Гарячі' },
  { id: 'top', label: 'Топ тижня' },
];

// Палітра обкладинок — узгоджена з основною палітрою (бірюза + кораловий + шари м'яких форм).
// Кожна обкладинка — дружня ілюстративна композиція з геометрією та підписом.
const COVER_PALETTES = [
  { bg: '#E6F8F5', shape1: '#2BC4B6', shape2: '#FF6F91', accent: '#0E5C55' },
  { bg: '#FFF1EE', shape1: '#FF6F91', shape2: '#2BC4B6', accent: '#7A1F38' },
  { bg: '#F2FBFA', shape1: '#7BDED2', shape2: '#FFB199', accent: '#0E5C55' },
  { bg: '#FFF8E7', shape1: '#FFCF5C', shape2: '#2BC4B6', accent: '#5A4A1A' },
  { bg: '#EAF3FF', shape1: '#5BA8FF', shape2: '#FF6F91', accent: '#1F3A66' },
  { bg: '#F4EEFF', shape1: '#9B7CFF', shape2: '#FFCF5C', accent: '#3B2870' },
];

const MEMES = [
  {
    id: 'm01', title: 'Коли деплой у п\u02BCятницю о 17:55',
    cat: 'it', author: '@kyiv_dev', time: '14 хв тому', likes: 1240, shares: 312, comments: 87,
    cover: 0, hotness: 0.94, freshness: 0.99, top: 0.71,
    caption: 'Розробник вмикає режим спокою, поки CI зеленіє. Класика жанру.',
  },
  {
    id: 'm02', title: 'Кіт після того, як уперше побачив роботу-пилосос',
    cat: 'tvaryny', author: '@meme.kyiv', time: '32 хв тому', likes: 4820, shares: 1140, comments: 263,
    cover: 1, hotness: 0.99, freshness: 0.96, top: 0.92,
    caption: 'Очі повні екзистенційного жаху. Пилосос продовжує робити свою справу.',
  },
  {
    id: 'm03', title: 'Маршрутка №42 проти всіх',
    cat: 'lokalni', author: '@lviv_lol', time: '1 год тому', likes: 2890, shares: 540, comments: 198,
    cover: 2, hotness: 0.85, freshness: 0.88, top: 0.66,
    caption: 'Сьогоднішня поїздка перевершила всі очікування — навіть водія.',
  },
  {
    id: 'm04', title: 'Тренер каже «легка пробіжка»',
    cat: 'sport', author: '@runners_ua', time: '2 год тому', likes: 980, shares: 210, comments: 54,
    cover: 3, hotness: 0.62, freshness: 0.79, top: 0.45,
    caption: '15 км пізніше обличчя розповідає геть іншу історію.',
  },
  {
    id: 'm05', title: 'Pull request на 2000 рядків без опису',
    cat: 'it', author: '@code_review_ua', time: '3 год тому', likes: 3120, shares: 680, comments: 412,
    cover: 4, hotness: 0.91, freshness: 0.74, top: 0.81,
    caption: '«Просто маленькі правки» — слоган сьогоднішньої катастрофи.',
  },
  {
    id: 'm06', title: 'Пес, який вкрав весь батон',
    cat: 'tvaryny', author: '@dogs_of_odesa', time: '4 год тому', likes: 6210, shares: 2010, comments: 489,
    cover: 5, hotness: 0.97, freshness: 0.71, top: 0.98,
    caption: 'Жодних докорів сумління. Лише задоволення та крихти.',
  },
  {
    id: 'm07', title: 'Коли в кафе сказали «зараз буде швидко»',
    cat: 'lokalni', author: '@kava.kyiv', time: '5 год тому', likes: 1450, shares: 290, comments: 98,
    cover: 0, hotness: 0.71, freshness: 0.65, top: 0.52,
    caption: 'Пройшло сорок хвилин. Кава досі в дорозі, як і життя.',
  },
  {
    id: 'm08', title: 'Дербі: «Динамо» — «Шахтар» очима кота',
    cat: 'sport', author: '@futbol_meme', time: '6 год тому', likes: 2100, shares: 480, comments: 152,
    cover: 1, hotness: 0.78, freshness: 0.58, top: 0.62,
    caption: 'Кіт обрав сторону. Кіт пожалкував про вибір. Кіт пішов спати.',
  },
  {
    id: 'm09', title: 'Stand-up: «То, що працює локально»',
    cat: 'it', author: '@dev_humor_ua', time: '8 год тому', likes: 5400, shares: 1320, comments: 367,
    cover: 2, hotness: 0.89, freshness: 0.51, top: 0.93,
    caption: 'Класична фраза, після якої починається розслідування на 3 дні.',
  },
  {
    id: 'm10', title: 'Бабуся з ринку як головний тренер життя',
    cat: 'lokalni', author: '@rynok.lviv', time: '12 год тому', likes: 3870, shares: 920, comments: 241,
    cover: 3, hotness: 0.83, freshness: 0.42, top: 0.76,
    caption: 'Поради безкоштовні. Поради безцінні. Поради не можна ігнорувати.',
  },
  {
    id: 'm11', title: 'Хом\u02BCяк, який не тренувався цілий тиждень',
    cat: 'tvaryny', author: '@khomiak.gym', time: '1 день тому', likes: 4100, shares: 1010, comments: 287,
    cover: 4, hotness: 0.81, freshness: 0.36, top: 0.84,
    caption: 'Колесо стоїть. Хом\u02BCяк теж. Все під контролем.',
  },
  {
    id: 'm12', title: 'Збірна U-21 на тренуванні після перемоги',
    cat: 'sport', author: '@usports', time: '1 день тому', likes: 2780, shares: 590, comments: 174,
    cover: 5, hotness: 0.69, freshness: 0.31, top: 0.58,
    caption: 'Енергія така, що хоч зараз на стадіон. Тренер — інший. Тренер хоче кави.',
  },
  {
    id: 'm13', title: 'Коли мама питає коли ти повернешся',
    cat: 'lokalni', author: '@dim.ua', time: '1 день тому', likes: 1920, shares: 430, comments: 112,
    cover: 0, hotness: 0.55, freshness: 0.28, top: 0.41,
    caption: 'Відповідаєш «скоро». Скоро триває третю годину.',
  },
  {
    id: 'm14', title: 'Меркетолог відкриває аналітику після релізу',
    cat: 'it', author: '@growth_kyiv', time: '2 дні тому', likes: 3340, shares: 760, comments: 245,
    cover: 1, hotness: 0.73, freshness: 0.21, top: 0.79,
    caption: 'Графіки кажуть одне. Реальність каже інше. Кава нічого не каже.',
  },
  {
    id: 'm15', title: 'Папуга, який вивчив пароль від wi-fi',
    cat: 'tvaryny', author: '@parrot.life', time: '2 дні тому', likes: 5870, shares: 1480, comments: 392,
    cover: 2, hotness: 0.87, freshness: 0.18, top: 0.96,
    caption: 'Гість заходить у квартиру. Гість виходить з квартири з паролем.',
  },
  {
    id: 'm16', title: 'Спортзал у понеділок vs у п\u02BCятницю',
    cat: 'sport', author: '@gym.kyiv', time: '3 дні тому', likes: 2240, shares: 510, comments: 142,
    cover: 3, hotness: 0.61, freshness: 0.12, top: 0.54,
    caption: 'Понеділок: повний зал, повна решучість. П\u02BCятниця: тиша, єхо, один тренер.',
  },
];

// Обкладинка мема — м'яка ілюстративна композиція з кругами/арками + підпис.
// Не дублюємо логотип і не намагаємося малювати реалістичні мем-образи.
function MemeCover({ index, palette, height = 220, label, imageUrl }) {
  // Якщо є реальна картинка з API — показуємо її повністю (contain) на м'якому фоні
  if (imageUrl) {
    const p = palette || COVER_PALETTES[(index || 0) % COVER_PALETTES.length];
    return (
      <div style={{
        width: '100%', height, position: 'relative', overflow: 'hidden',
        background: p.bg,
      }}>
        {/* Розмитий фон з тієї ж картинки — заповнює пусті місця при letterbox */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(28px) brightness(.85)',
          transform: 'scale(1.2)',
          opacity: 0.55,
        }} />
        <img src={imageUrl} alt={label || ''} loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{
            position: 'relative',
            width: '100%', height: '100%', objectFit: 'contain',
            display: 'block',
          }} />
      </div>
    );
  }

  const p = palette || COVER_PALETTES[index % COVER_PALETTES.length];
  // Псевдо-випадкова, але детермінована композиція по index
  const seed = (index * 9301 + 49297) % 233280 / 233280;
  const seed2 = ((index + 7) * 9301 + 49297) % 233280 / 233280;
  return (
    <div style={{
      width: '100%', height, position: 'relative', overflow: 'hidden',
      background: p.bg,
    }}>
      {/* великий блоб */}
      <div style={{
        position: 'absolute', width: '120%', height: '120%',
        left: `${-20 + seed * 10}%`, top: `${-30 + seed2 * 20}%`,
        background: p.shape1, borderRadius: '46% 54% 60% 40% / 50% 40% 60% 50%',
        opacity: 0.85,
      }} />
      {/* арка */}
      <div style={{
        position: 'absolute', width: 180, height: 180,
        right: `${-30 + seed * 20}%`, bottom: `${-40 + seed2 * 20}%`,
        background: p.shape2, borderRadius: '50%',
      }} />
      {/* три кружечки */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: p.accent, opacity: 0.5 }} />
        ))}
      </div>
      {/* плюсики як декор */}
      <svg style={{ position: 'absolute', right: 16, top: 16, opacity: 0.55 }} width="22" height="22" viewBox="0 0 22 22">
        <path d="M11 3v16M3 11h16" stroke={p.accent} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      {/* лінія-горизонт */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '32%',
        height: 1, background: p.accent, opacity: 0.18,
      }} />
      {/* підпис «meme #N» */}
      <div style={{
        position: 'absolute', left: 18, bottom: 14,
        fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace',
        fontSize: 11, color: p.accent, opacity: 0.7, letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {label || `meme · ${String(index + 1).padStart(2, '0')}`}
      </div>
    </div>
  );
}

Object.assign(window, { MEMES, MEME_CATEGORIES, SORT_MODES, COVER_PALETTES, MemeCover });
