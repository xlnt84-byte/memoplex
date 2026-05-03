// Спільна логіка для всіх трьох варіантів стрічки:
// - useFeedState: лайки, поділитись (toast «Посилання скопійовано»),
//   сортування, фільтр категорії, пошук, нескінченна стрічка, модалка.
// Кожен варіант стрічки рендерить свій layout, але користується цим.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function useFeedState({ memes = MEMES, pageSize = 6, initialSort = 'fresh', initialCat = 'all' } = {}) {
  const [sort, setSort] = useState(initialSort);
  const [cat, setCat] = useState(initialCat);
  const [query, setQuery] = useState('');
  const [likes, setLikes] = useState({});
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const sorted = useMemo(() => {
    const filtered = memes.filter(m => {
      if (cat !== 'all' && m.cat !== cat) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!m.title.toLowerCase().includes(q) && !m.author.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const key = sort === 'hot' ? 'hotness' : sort === 'top' ? 'top' : 'freshness';
    return [...filtered].sort((a, b) => b[key] - a[key]);
  }, [sort, cat, query, memes]);

  // reset нескінченної стрічки коли фільтри змінилися
  useEffect(() => { setVisibleCount(pageSize); }, [sort, cat, query, pageSize]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const toggleLike = useCallback((id) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(t => (t === msg ? null : t)), 2200);
  }, []);

  const share = useCallback((meme) => {
    const url = meme.permalink || `https://memoplex.ua/m/${meme.id}`;
    // Спроба запису в clipboard, інакше — імітуємо
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch (e) {}
    showToast('Посилання скопійовано');
  }, [showToast]);

  const open = useCallback((id) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);

  const loadMore = useCallback(() => {
    setVisibleCount(c => Math.min(c + pageSize, sorted.length));
  }, [pageSize, sorted.length]);

  return {
    sort, setSort, cat, setCat, query, setQuery,
    likes, toggleLike,
    visible, hasMore, loadMore, total: sorted.length,
    openId, open, close,
    toast,
    share,
  };
}

// Хук для нескінченної стрічки — підвантажує при підході до низу контейнера
function useInfiniteScroll(loadMore, hasMore, sentinelRef) {
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, hasMore, sentinelRef]);
}

// ------- Спільні UI-атоми -------

function CategoryPill({ cat, active, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        background: active ? '#0E5C55' : 'rgba(43, 196, 182, 0.12)',
        color: active ? '#fff' : '#0E5C55',
        padding: '8px 16px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'background .15s, color .15s',
        ...style,
      }}
    >
      {cat.label}
    </button>
  );
}

function SortTabs({ sort, setSort, style }) {
  return (
    <div style={{ display: 'inline-flex', gap: 0, padding: 3, background: 'rgba(14, 92, 85, 0.06)', borderRadius: 999, ...style }}>
      {SORT_MODES.map(m => (
        <button key={m.id}
          onClick={() => setSort(m.id)}
          style={{
            border: 'none', background: sort === m.id ? '#fff' : 'transparent',
            color: sort === m.id ? '#0E5C55' : 'rgba(14, 92, 85, 0.6)',
            padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: sort === m.id ? '0 1px 3px rgba(14,92,85,.12)' : 'none',
            transition: 'background .15s, color .15s',
          }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function HeartIcon({ filled, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#FF6F91' : 'none'}
      stroke={filled ? '#FF6F91' : 'currentColor'}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function ShareIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  );
}

function CommentIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

// Toast (loadable share notification)
function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#0E0E12', color: '#fff', padding: '12px 20px',
      borderRadius: 999, fontSize: 14, fontWeight: 500,
      boxShadow: '0 8px 28px rgba(0,0,0,.25)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'toastIn .2s ease-out',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2BC4B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {message}
    </div>
  );
}

// Модалка перегляду мема
function MemeModal({ meme, onClose, liked, onLike, onShare }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  if (!meme) return null;
  const cat = MEME_CATEGORIES.find(c => c.id === meme.cat);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(14, 14, 18, 0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn .15s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, maxWidth: 560, width: '100%',
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.3)',
        animation: 'popIn .2s ease-out',
      }}>
        <MemeCover index={meme.cover} height={320} label={`meme · ${meme.id}`} imageUrl={meme.imageUrl} />
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#0E5C55', marginBottom: 8 }}>
            <span style={{ background: 'rgba(43,196,182,.12)', padding: '3px 9px', borderRadius: 999, fontWeight: 500 }}>
              {cat ? cat.label : ''}
            </span>
            <span style={{ color: 'rgba(14,14,18,.5)' }}>{meme.author} · {meme.time}</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: '#0E0E12', lineHeight: 1.25, letterSpacing: -0.3 }}>
            {meme.title}
          </h2>
          <p style={{ margin: '0 0 18px', color: 'rgba(14,14,18,.7)', fontSize: 15, lineHeight: 1.5 }}>
            {meme.caption}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(14,14,18,.06)', paddingTop: 16 }}>
            <button onClick={onLike} style={{
              border: 'none', background: liked ? 'rgba(255, 111, 145, 0.12)' : 'rgba(14,14,18,.04)',
              color: liked ? '#FF6F91' : '#0E0E12', padding: '8px 14px', borderRadius: 999,
              cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <HeartIcon filled={liked} size={16} />
              {formatNum(meme.likes + (liked ? 1 : 0))}
            </button>
            <button style={{
              border: 'none', background: 'rgba(14,14,18,.04)', color: '#0E0E12',
              padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <CommentIcon size={16} /> {formatNum(meme.comments)}
            </button>
            <button onClick={onShare} style={{
              border: 'none', background: 'rgba(43,196,182,.12)', color: '#0E5C55',
              padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto',
            }}>
              <ShareIcon size={16} /> Поділитися
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  useFeedState, useInfiniteScroll,
  CategoryPill, SortTabs, HeartIcon, ShareIcon, CommentIcon,
  formatNum, Toast, MemeModal,
});
