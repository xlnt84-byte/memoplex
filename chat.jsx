// Розділ "Чат" — стрічка користувацьких завантажень + модалка додавання мема
// з AI-валідацією (бот перевіряє підпис на спам/тон/категорію).

const CHAT_STORAGE_KEY = 'memoplex_chat_uploads';

function loadChatUploads() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}
function saveChatUploads(arr) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
}

// Викликаємо Claude для перевірки підпису. Повертає об'єкт з полями:
//   { approved: bool, reason: string, category: 'tvaryny'|'it'|'sport'|'lokalni'|'general' }
async function validateMemeCaption(caption, fileName) {
  const prompt = `Ти — модератор українського мем-сайту. Перевір наступний підпис до мема та поверни ЛИШЕ валідний JSON без пояснень, у форматі:
{"approved": true|false, "reason": "коротко (1 речення)", "category": "tvaryny"|"it"|"sport"|"lokalni"|"general", "title_suggestion": "коротко покращений заголовок або null"}

Правила:
- approved=false якщо: образи, дискримінація, спам, реклама, дезінформація.
- approved=true якщо: жарт, мем, нейтральний підпис, навіть якщо плоский.
- category: tvaryny (тварини), it (програмування/комп'ютери), sport (спорт), lokalni (Україна, побут), general (інше).

Назва файлу: ${fileName}
Підпис: "${caption}"

Відповідь (тільки JSON):`;

  try {
    const result = await window.claude.complete(prompt);
    // Витягуємо JSON з відповіді (на випадок зайвого тексту)
    const match = result.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON in response');
    const json = JSON.parse(match[0]);
    return {
      approved: !!json.approved,
      reason: json.reason || '',
      category: json.category || 'general',
      title_suggestion: json.title_suggestion || null,
    };
  } catch (e) {
    console.warn('AI валідація недоступна:', e);
    // Fallback — простий локальний фільтр на стоп-слова
    const stopwords = ['блять', 'хуй', 'putin', 'нацист'];
    const isBad = stopwords.some(w => caption.toLowerCase().includes(w));
    return {
      approved: !isBad,
      reason: isBad ? 'Підпис містить заборонене слово.' : 'Перевірено локально (AI недоступний).',
      category: 'general',
      title_suggestion: null,
    };
  }
}

// Конвертує File у base64 data URL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({ onClose, onPublished }) {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [caption, setCaption] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | checking | approved | rejected
  const [validation, setValidation] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const pickFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Будь ласка, завантаж зображення'); return; }
    if (f.size > 5 * 1024 * 1024) { alert('Файл > 5 МБ — спробуй менший'); return; }
    setFile(f);
    setPreview(await fileToDataUrl(f));
    setStatus('idle');
    setValidation(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file || !caption.trim()) return;
    setStatus('checking');
    const v = await validateMemeCaption(caption.trim(), file.name);
    setValidation(v);
    setStatus(v.approved ? 'approved' : 'rejected');
    if (v.approved) {
      // Чекаємо 1 сек щоб користувач побачив зелений статус, потім публікуємо
      setTimeout(() => {
        const meme = {
          id: 'u_' + Date.now(),
          title: v.title_suggestion || caption.trim(),
          caption: caption.trim(),
          cat: v.category === 'general' ? 'lokalni' : v.category,
          author: '@you',
          time: 'щойно',
          likes: 0, shares: 0, comments: 0,
          cover: 0,
          imageUrl: preview,
          createdAt: Date.now(),
          botReason: v.reason,
        };
        onPublished(meme);
      }, 900);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(14,14,18,.55)',
      backdropFilter: 'blur(6px)', zIndex: 150,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn .15s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, maxWidth: 540, width: '100%',
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.3)',
        animation: 'popIn .2s ease-out',
      }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>Додати мем</h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(14,14,18,.06)', width: 32, height: 32,
            borderRadius: 16, cursor: 'pointer', fontSize: 18, color: '#0E0E12', lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Drop zone */}
          {!preview ? (
            <label htmlFor="meme-file-input" onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: '40px 20px', borderRadius: 14,
                border: `2px dashed ${dragOver ? '#0E5C55' : 'rgba(14,14,18,.15)'}`,
                background: dragOver ? 'rgba(43,196,182,.08)' : 'rgba(14,14,18,.02)',
                cursor: 'pointer', transition: 'all .15s',
              }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0E5C55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0E0E12' }}>Перетягни картинку або натисни</div>
              <div style={{ fontSize: 12, color: 'rgba(14,14,18,.5)' }}>JPG, PNG, GIF · до 5 МБ</div>
              <input id="meme-file-input" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => pickFile(e.target.files[0])} />
            </label>
          ) : (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: 'rgba(14,14,18,.04)' }}>
              <img src={preview} alt="" style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'contain' }} />
              <button onClick={() => { setFile(null); setPreview(null); setStatus('idle'); setValidation(null); }}
                style={{ position: 'absolute', top: 10, right: 10, border: 'none',
                  background: 'rgba(0,0,0,.6)', color: '#fff', width: 28, height: 28,
                  borderRadius: 14, cursor: 'pointer', fontSize: 16, lineHeight: 1, backdropFilter: 'blur(4px)' }}>×</button>
            </div>
          )}

          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Підпис: розкажи що смішного або який контекст"
            rows={3}
            style={{
              width: '100%', border: '1px solid rgba(14,14,18,.1)', borderRadius: 12,
              padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
              outline: 'none', background: 'rgba(14,14,18,.02)', marginTop: preview ? 0 : 16,
              boxSizing: 'border-box',
            }} />

          {/* Статус валідації */}
          {status === 'checking' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(91,168,255,.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#1F3A66' }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(91,168,255,.3)', borderTopColor: '#1F3A66', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              <span><strong>Бот перевіряє…</strong> Аналіз підпису й категорії</span>
            </div>
          )}

          {status === 'approved' && validation && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(43,196,182,.1)', borderRadius: 10, fontSize: 13, color: '#0E5C55' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Бот схвалив · публікуємо в Чат
              </div>
              <div style={{ opacity: 0.8 }}>{validation.reason} · Категорія: <strong>{validation.category}</strong></div>
            </div>
          )}

          {status === 'rejected' && validation && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,111,145,.1)', borderRadius: 10, fontSize: 13, color: '#7A1F38' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Бот відхилив
              </div>
              <div style={{ opacity: 0.8 }}>{validation.reason}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(14,14,18,.06)' }}>
          <div style={{ fontSize: 12, color: 'rgba(14,14,18,.5)', flex: 1 }}>
            🤖 AI-модерація перевірить підпис
          </div>
          <button onClick={onClose} style={{
            border: '1px solid rgba(14,14,18,.12)', background: '#fff', color: '#0E0E12',
            padding: '9px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>Скасувати</button>
          <button onClick={submit} disabled={!file || !caption.trim() || status === 'checking' || status === 'approved'}
            style={{
              border: 'none',
              background: (!file || !caption.trim() || status === 'checking' || status === 'approved') ? 'rgba(255,111,145,.4)' : '#FF6F91',
              color: '#fff', padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: (!file || !caption.trim() || status === 'checking' || status === 'approved') ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
            {status === 'idle' && 'Опублікувати'}
            {status === 'checking' && 'Перевірка…'}
            {status === 'approved' && 'Опубліковано ✓'}
            {status === 'rejected' && 'Спробувати знову'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat View ───────────────────────────────────────────────────────────────

function ChatView({ uploads, accent, radius, onOpenUpload }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: -0.6 }}>Чат</h1>
          <p style={{ fontSize: 15, color: 'rgba(14,14,18,.6)', margin: '4px 0 0' }}>
            {uploads.length === 0
              ? 'Поки порожньо — поділись першим мемом'
              : `${uploads.length} мем${uploads.length === 1 ? '' : uploads.length < 5 ? 'и' : 'ів'} від спільноти`}
          </p>
        </div>
        <button onClick={onOpenUpload} style={{
          background: '#FF6F91', color: '#fff', border: 'none',
          padding: '10px 18px', borderRadius: 999, fontWeight: 600,
          fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(255,111,145,.32)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>+ Додати мем</button>
      </div>

      {uploads.length === 0 ? (
        <div style={{
          padding: '64px 24px', textAlign: 'center', borderRadius: radius,
          background: '#fff', border: '1px dashed rgba(14,14,18,.12)',
          color: 'rgba(14,14,18,.5)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0E0E12', marginBottom: 4 }}>Тихо тут поки що</div>
          <div style={{ fontSize: 14 }}>Завантаж першу картинку — бот її перевірить і опублікує сюди.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {uploads.map(m => <ChatBubble key={m.id} meme={m} radius={radius} accent={accent} />)}
        </div>
      )}

      <div style={{ marginTop: 32, padding: '14px 16px', borderRadius: 12, background: 'rgba(43,196,182,.08)', fontSize: 12, color: '#0E5C55', lineHeight: 1.55 }}>
        🤖 <strong>Як працює модерація:</strong> при завантаженні підпис проходить AI-перевірку на спам, образи та категоризацію. Зображення зберігаються в твоєму браузері (локально).
      </div>
    </div>
  );
}

function ChatBubble({ meme, radius, accent }) {
  const cat = MEME_CATEGORIES.find(c => c.id === meme.cat);
  const minutesAgo = Math.floor((Date.now() - (meme.createdAt || Date.now())) / 60000);
  const time = minutesAgo < 1 ? 'щойно' : minutesAgo < 60 ? `${minutesAgo} хв тому` : `${Math.floor(minutesAgo / 60)} год тому`;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #2BC4B6, #FF6F91)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 16,
      }}>Y</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{meme.author}</span>
          <span style={{ fontSize: 12, color: 'rgba(14,14,18,.45)' }}>{time}</span>
          {cat && <span style={{ background: 'rgba(43,196,182,.12)', color: '#0E5C55', padding: '1px 8px', borderRadius: 999, fontWeight: 600, fontSize: 11 }}>{cat.label}</span>}
        </div>
        <div style={{ background: '#fff', borderRadius: radius, border: '1px solid rgba(14,14,18,.06)', overflow: 'hidden' }}>
          {meme.imageUrl && (
            <img src={meme.imageUrl} alt="" style={{ width: '100%', display: 'block', height: 'auto' }} />
          )}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#0E0E12' }}>{meme.title}</div>
            {meme.botReason && (
              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(43,196,182,.08)', fontSize: 11, color: '#0E5C55', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>🤖</span> <span>{meme.botReason}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  UploadModal, ChatView, loadChatUploads, saveChatUploads, validateMemeCaption,
});
