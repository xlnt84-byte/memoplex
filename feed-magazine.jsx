// Варіант A — Magazine: великий герой + сітка з 2 колонок.
// Щільність cozy, обкладинки великі, акцент на «свіжі».

function FeedMagazine({ density = 'cozy', radius = 18, accent = '#0E5C55', memes }) {
  // Чисті URL для розділів + категорій:
  //   /             → стрічка, всі категорії
  //   /top          → топ дня
  //   /channels     → канали
  //   /about        → про нас
  //   /tvaryny etc. → стрічка, відфільтрована по категорії
  const VIEWS = ['feed', 'top', 'channels', 'about', 'chat'];
  const CATS = MEME_CATEGORIES.filter(c => c.id !== 'all').map(c => c.id);

  const readPath = () => {
    const p = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    const slug = p === '/' ? '' : p.slice(1);
    if (!slug) return { view: 'feed', cat: 'all' };
    if (VIEWS.includes(slug)) return { view: slug, cat: 'all' };
    if (CATS.includes(slug)) return { view: 'feed', cat: slug };
    return { view: 'feed', cat: 'all' };
  };

  const initial = readPath();
  const [view, setViewRaw] = useState(initial.view);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploads, setUploads] = useState(() => loadChatUploads());

  const publishUpload = (meme) => {
    setUploads(prev => {
      const next = [meme, ...prev];
      saveChatUploads(next);
      return next;
    });
    setUploadOpen(false);
    setView('chat');
  };

  const feed = useFeedState({
    memes, pageSize: 7,
    initialSort: initial.view === 'top' ? 'top' : 'fresh',
    initialCat: initial.cat,
  });

  // Один писач URL-я з джерела істини (view + feed.cat)
  const writeUrl = (v, c) => {
    let target = '/';
    if (v === 'feed') target = c === 'all' ? '/' : '/' + c;
    else target = '/' + v;
    if (window.location.pathname !== target) history.pushState(null, '', target);
  };

  const setView = (v) => {
    setViewRaw(v);
    if (v !== 'feed') {
      feed.setCat('all');
      writeUrl(v, 'all');
    } else {
      writeUrl('feed', feed.cat);
    }
  };

  // Реагуємо на back/forward
  useEffect(() => {
    const onPop = () => {
      const { view: v, cat: c } = readPath();
      setViewRaw(v);
      feed.setCat(c);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [feed]);

  // Коли користувач перемикає категорію в FilterBar — оновити URL
  useEffect(() => {
    if (view === 'feed') writeUrl('feed', feed.cat);
  }, [feed.cat, view]);

  // Оновлюємо title сторінки під поточний розділ + категорію
  useEffect(() => {
    const titles = {
      feed: 'Мемоплекс — нові українські меми',
      top: 'Топ дня · Мемоплекс',
      channels: 'Канали · Мемоплекс',
      about: 'Про нас · Мемоплекс',
      chat: 'Чат · Мемоплекс',
    };
    if (view === 'feed' && feed.cat !== 'all') {
      const cat = MEME_CATEGORIES.find(c => c.id === feed.cat);
      document.title = (cat ? cat.label : '') + ' · Мемоплекс';
    } else {
      document.title = titles[view] || titles.feed;
    }
  }, [view, feed.cat]);

  const sentinelRef = useRef(null);
  useInfiniteScroll(feed.loadMore, feed.hasMore, sentinelRef);

  // "Топ дня" перемикає сортування при заході
  useEffect(() => {
    if (view === 'top') feed.setSort('top');
    else if (view === 'feed') feed.setSort('fresh');
  }, [view]);

  const openMeme = feed.openId ? (memes || MEMES).find(m => m.id === feed.openId) : null;

  const [hero, ...rest] = feed.visible;
  const gap = density === 'compact' ? 14 : 20;

  return (
    <div style={{ background: '#FAFBF9', minHeight: '100%', fontFamily: 'Manrope, system-ui, sans-serif', color: '#0E0E12' }}>
      <Header accent={accent} view={view} setView={setView} onUpload={() => setUploadOpen(true)} />

      {(view === 'feed' || view === 'top') && (
        <>
          <FilterBar feed={feed} accent={accent} />
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 28px 80px' }}>
            {view === 'top' && <TopBanner accent={accent} />}
            {hero && (
              <HeroCard meme={hero}
                liked={feed.likes[hero.id]}
                onLike={() => feed.toggleLike(hero.id)}
                onOpen={() => feed.open(hero.id)}
                onShare={() => feed.share(hero)}
                radius={radius}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap, marginTop: gap }}>
              {rest.map(m => (
                <MagCard key={m.id} meme={m}
                  liked={feed.likes[m.id]}
                  onLike={() => feed.toggleLike(m.id)}
                  onOpen={() => feed.open(m.id)}
                  onShare={() => feed.share(m)}
                  radius={radius}
                  density={density}
                />
              ))}
            </div>
            <Sentinel ref={sentinelRef} hasMore={feed.hasMore} total={feed.total} />
          </div>
        </>
      )}

      {view === 'channels' && <ChannelsView memes={memes || MEMES} accent={accent} radius={radius}
        onOpenAuthor={(author) => { feed.setQuery(author); setView('feed'); }} />}
      {view === 'about' && <AboutView accent={accent} radius={radius} />}
      {view === 'chat' && <ChatView uploads={uploads} accent={accent} radius={radius}
        onOpenUpload={() => setUploadOpen(true)} />}

      {openMeme && (
        <MemeModal meme={openMeme} onClose={feed.close}
          liked={feed.likes[openMeme.id]}
          onLike={() => feed.toggleLike(openMeme.id)}
          onShare={() => feed.share(openMeme)}
        />
      )}
      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onPublished={publishUpload} />
      )}
      <Toast message={feed.toast} />
    </div>
  );
}

function TopBanner({ accent }) {
  return (
    <div style={{
      marginBottom: 20, padding: '14px 20px', borderRadius: 14,
      background: 'linear-gradient(135deg, #FF6F91 0%, #FFB199 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 6px 20px rgba(255,111,145,.25)',
    }}>
      <span style={{ fontSize: 22 }}>🔥</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Топ дня</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Меми з найбільшою кількістю реакцій за останні 24 години</div>
      </div>
    </div>
  );
}

function ChannelsView({ memes, accent, radius, onOpenAuthor }) {
  // Групуємо меми за автором/каналом, рахуємо стати.
  const byAuthor = {};
  memes.forEach(m => {
    const key = m.author;
    if (!byAuthor[key]) byAuthor[key] = { author: key, sub: m.sub, count: 0, likes: 0, cat: m.cat, sample: m };
    byAuthor[key].count += 1;
    byAuthor[key].likes += m.likes || 0;
  });
  const channels = Object.values(byAuthor).sort((a, b) => b.likes - a.likes);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: -0.6 }}>Канали</h1>
        <p style={{ fontSize: 15, color: 'rgba(14,14,18,.6)', margin: '4px 0 0' }}>
          {channels.length} активних авторів · підписуйся, щоб бачити їхні меми в стрічці
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {channels.map(ch => {
          const cat = MEME_CATEGORIES.find(c => c.id === ch.cat);
          const palette = COVER_PALETTES[(ch.author.length * 7) % COVER_PALETTES.length];
          return (
            <div key={ch.author} onClick={() => onOpenAuthor(ch.author)}
              style={{
                background: '#fff', border: '1px solid rgba(14,14,18,.06)',
                borderRadius: radius, padding: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(14,14,18,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${palette.shape1}, ${palette.shape2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 18,
              }}>{ch.author[1] ? ch.author[1].toUpperCase() : '@'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.author}</div>
                <div style={{ fontSize: 12, color: 'rgba(14,14,18,.5)', marginTop: 2 }}>
                  {ch.sub ? `r/${ch.sub} · ` : ''}{cat ? cat.label : ''}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(14,14,18,.4)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {ch.count} мем{ch.count === 1 ? '' : ch.count < 5 ? 'и' : 'ів'} · {formatNum(ch.likes)} ❤
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); }}
                style={{
                  border: `1px solid ${accent}`, background: 'transparent', color: accent,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                }}>+ Підписка</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AboutView({ accent, radius }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 28px 80px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, letterSpacing: -0.8, textWrap: 'balance' }}>
        Меми, які <span style={{ color: accent }}>хочеться</span> зберегти.
      </h1>
      <p style={{ fontSize: 18, color: 'rgba(14,14,18,.65)', lineHeight: 1.55, margin: '16px 0 32px' }}>
        Мемоплекс агрегує свіжі картинки з відкритих джерел — Reddit-сабредитів про тварин, IT, спорт і Україну.
        Без алгоритмічної сегрегації: одна стрічка, чотири категорії, три способи сортувати.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 36 }}>
        <AboutStat num="5" label="джерел у стрічці" />
        <AboutStat num="100+" label="свіжих мемів щодня" />
        <AboutStat num="4" label="категорії" />
        <AboutStat num="0₴" label="коштує користуватися" />
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(14,14,18,.06)', borderRadius: radius, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: accent }}>Як це працює</h3>
        <ol style={{ margin: 0, paddingLeft: 22, color: 'rgba(14,14,18,.75)', fontSize: 15, lineHeight: 1.65 }}>
          <li>При завантаженні сторінки тягнемо «hot» пости з 5 сабреддитів паралельно.</li>
          <li>Фільтруємо NSFW, дедуплікуємо, чергуємо за категоріями.</li>
          <li>Ти лайкаєш, шериш, дивишся — все відбувається в браузері без логіну.</li>
          <li>«Поділитися» копіює оригінальне посилання на пост у джерелі.</li>
        </ol>
      </div>

      <div style={{ background: '#FFF1EE', borderRadius: radius, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#7A1F38' }}>Що далі</h3>
        <p style={{ fontSize: 14, color: '#7A1F38', lineHeight: 1.55, margin: 0, opacity: 0.85 }}>
          Підключення Telegram-каналів через MTProto, форма «+ Додати мем», PWA з офлайн-режимом і push-сповіщеннями.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: 'rgba(14,14,18,.4)' }}>
        Мемоплекс · v0.1 · MIT
      </div>
    </div>
  );
}

function AboutStat({ num, label }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(14,14,18,.06)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0E5C55', letterSpacing: -0.5 }}>{num}</div>
      <div style={{ fontSize: 12, color: 'rgba(14,14,18,.55)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Header({ accent, view, setView, onUpload }) {
  const NAV = [
    { id: 'feed', label: 'Стрічка' },
    { id: 'top', label: 'Топ дня' },
    { id: 'channels', label: 'Канали' },
    { id: 'chat', label: 'Чат' },
    { id: 'about', label: 'Про нас' },
  ];
  return (
    <header style={{
      borderBottom: '1px solid rgba(14,14,18,.06)',
      background: '#fff',
      padding: '18px 28px',
      display: 'flex', alignItems: 'center', gap: 16,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div onClick={() => setView('feed')} style={{ cursor: 'pointer' }}>
        <Logo accent={accent} />
      </div>
      <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
        {NAV.map(n => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '8px 12px', borderRadius: 8,
              color: active ? accent : 'rgba(14,14,18,.55)',
              fontWeight: active ? 600 : 500,
              fontSize: 14,
              background: active ? 'rgba(43,196,182,.12)' : 'transparent',
              transition: 'background .12s, color .12s',
            }}>{n.label}</button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <button onClick={onUpload} style={{
        background: '#FF6F91', color: '#fff', border: 'none',
        padding: '9px 16px', borderRadius: 999, fontWeight: 600,
        fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(255,111,145,.32)',
      }}>+ Додати мем</button>
    </header>
  );
}

function Logo({ accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 30, height: 30 }}>
        <span style={{ position: 'absolute', inset: 0, background: '#2BC4B6', borderRadius: '50%' }} />
        <span style={{ position: 'absolute', right: -4, top: 2, width: 18, height: 18, background: '#FF6F91', borderRadius: '50%', mixBlendMode: 'multiply', opacity: 0.9 }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: -0.4, color: '#0E0E12' }}>
        Мемо<span style={{ color: accent }}>плекс</span>
      </span>
    </div>
  );
}

function FilterBar({ feed, accent }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(14,14,18,.06)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MEME_CATEGORIES.map(c => (
          <CategoryPill key={c.id} cat={c} active={feed.cat === c.id} onClick={() => feed.setCat(c.id)} />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative' }}>
        <input value={feed.query} onChange={e => feed.setQuery(e.target.value)}
          placeholder="Пошук мемів..."
          style={{
            border: '1px solid rgba(14,14,18,.1)', borderRadius: 999,
            padding: '8px 14px 8px 36px', fontSize: 13, fontFamily: 'inherit',
            background: 'rgba(14,14,18,.02)', outline: 'none', width: 200,
          }} />
        <svg style={{ position: 'absolute', left: 12, top: 9 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(14,14,18,.4)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <SortTabs sort={feed.sort} setSort={feed.setSort} />
    </div>
  );
}

function HeroCard({ meme, liked, onLike, onOpen, onShare, radius }) {
  const cat = MEME_CATEGORIES.find(c => c.id === meme.cat);
  return (
    <article onClick={onOpen} style={{
      borderRadius: radius, overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 3px rgba(14,14,18,.06), 0 12px 32px rgba(14,14,18,.06)',
      display: 'grid', gridTemplateColumns: '1.2fr 1fr', cursor: 'pointer',
      border: '1px solid rgba(14,14,18,.04)',
    }}>
      <MemeCover index={meme.cover} height={340} label={`meme · ${meme.id}`} imageUrl={meme.imageUrl} />
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ background: 'rgba(43,196,182,.12)', color: '#0E5C55', padding: '3px 9px', borderRadius: 999, fontWeight: 600 }}>{cat ? cat.label : ''}</span>
          <span style={{ background: '#FF6F91', color: '#fff', padding: '3px 9px', borderRadius: 999, fontWeight: 600 }}>HOT</span>
          <span style={{ color: 'rgba(14,14,18,.5)' }}>{meme.time}</span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: -0.5, textWrap: 'balance' }}>
          {meme.title}
        </h2>
        <p style={{ color: 'rgba(14,14,18,.65)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>{meme.caption}</p>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: 'rgba(14,14,18,.5)' }}>{meme.author}</div>
        <CardActions liked={liked} onLike={onLike} onShare={onShare} meme={meme} />
      </div>
    </article>
  );
}

function MagCard({ meme, liked, onLike, onOpen, onShare, radius, density }) {
  const cat = MEME_CATEGORIES.find(c => c.id === meme.cat);
  return (
    <article onClick={onOpen} style={{
      borderRadius: radius, overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 3px rgba(14,14,18,.06), 0 6px 20px rgba(14,14,18,.04)',
      cursor: 'pointer', border: '1px solid rgba(14,14,18,.04)',
      display: 'flex', flexDirection: 'column',
    }}>
      <MemeCover index={meme.cover} height={density === 'compact' ? 160 : 200} label={`meme · ${meme.id}`} imageUrl={meme.imageUrl} />
      <div style={{ padding: density === 'compact' ? 14 : 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ background: 'rgba(43,196,182,.12)', color: '#0E5C55', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{cat ? cat.label : ''}</span>
          <span style={{ color: 'rgba(14,14,18,.45)' }}>{meme.author}</span>
          <span style={{ color: 'rgba(14,14,18,.35)', marginLeft: 'auto' }}>{meme.time}</span>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, lineHeight: 1.3, letterSpacing: -0.2, textWrap: 'balance' }}>{meme.title}</h3>
        <div style={{ flex: 1 }} />
        <CardActions liked={liked} onLike={onLike} onShare={onShare} meme={meme} compact />
      </div>
    </article>
  );
}

function CardActions({ meme, liked, onLike, onShare, compact }) {
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 8, marginTop: compact ? 4 : 8 }}>
      <button onClick={stop(onLike)} style={btnStyle(liked ? '#FF6F91' : 'rgba(14,14,18,.65)', liked)}>
        <HeartIcon filled={liked} size={16} /> {formatNum(meme.likes + (liked ? 1 : 0))}
      </button>
      <button onClick={stop(() => {})} style={btnStyle('rgba(14,14,18,.65)', false)}>
        <CommentIcon size={16} /> {formatNum(meme.comments)}
      </button>
      <button onClick={stop(onShare)} style={{ ...btnStyle('#0E5C55', false), marginLeft: 'auto', background: 'rgba(43,196,182,.1)' }}>
        <ShareIcon size={16} /> {compact ? '' : 'Поділитися'}
      </button>
    </div>
  );
}

function btnStyle(color, active) {
  return {
    border: 'none', background: active ? 'rgba(255,111,145,.1)' : 'transparent',
    color, padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5,
  };
}

const Sentinel = React.forwardRef(function Sentinel({ hasMore, total }, ref) {
  return (
    <div ref={ref} style={{ padding: '32px 0', textAlign: 'center', color: 'rgba(14,14,18,.4)', fontSize: 13 }}>
      {hasMore ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, border: '2px solid rgba(14,92,85,.2)', borderTopColor: '#0E5C55', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          Завантажуємо ще...
        </span>
      ) : `Кінець стрічки · ${total} мемів`}
    </div>
  );
});

Object.assign(window, { FeedMagazine });
