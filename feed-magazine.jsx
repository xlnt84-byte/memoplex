// Варіант A — Magazine: великий герой + сітка з 2 колонок.
// Щільність cozy, обкладинки великі, акцент на «свіжі».

function FeedMagazine({ density = 'cozy', radius = 18, accent = '#0E5C55', memes }) {
  const feed = useFeedState({ memes, pageSize: 7 });
  const sentinelRef = useRef(null);
  useInfiniteScroll(feed.loadMore, feed.hasMore, sentinelRef);

  const openMeme = feed.openId ? (memes || MEMES).find(m => m.id === feed.openId) : null;

  const [hero, ...rest] = feed.visible;
  const gap = density === 'compact' ? 14 : 20;

  return (
    <div style={{ background: '#FAFBF9', minHeight: '100%', fontFamily: 'Manrope, system-ui, sans-serif', color: '#0E0E12' }}>
      <Header accent={accent} />
      <FilterBar feed={feed} accent={accent} />

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 28px 80px' }}>
        {hero && (
          <HeroCard meme={hero}
            liked={feed.likes[hero.id]}
            onLike={() => feed.toggleLike(hero.id)}
            onOpen={() => feed.open(hero.id)}
            onShare={() => feed.share(hero)}
            radius={radius}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap, marginTop: gap }}>
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

      {openMeme && (
        <MemeModal meme={openMeme} onClose={feed.close}
          liked={feed.likes[openMeme.id]}
          onLike={() => feed.toggleLike(openMeme.id)}
          onShare={() => feed.share(openMeme)}
        />
      )}
      <Toast message={feed.toast} />
    </div>
  );
}

function Header({ accent }) {
  return (
    <header style={{
      borderBottom: '1px solid rgba(14,14,18,.06)',
      background: '#fff',
      padding: '18px 28px',
      display: 'flex', alignItems: 'center', gap: 16,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <Logo accent={accent} />
      <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
        {['Стрічка', 'Топ дня', 'Канали', 'Про нас'].map((l, i) => (
          <a key={l} href="#" style={{
            padding: '8px 12px', borderRadius: 8,
            color: i === 0 ? accent : 'rgba(14,14,18,.55)',
            fontWeight: i === 0 ? 600 : 500,
            fontSize: 14, textDecoration: 'none',
            background: i === 0 ? 'rgba(43,196,182,.12)' : 'transparent',
          }}>{l}</a>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <button style={{
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
