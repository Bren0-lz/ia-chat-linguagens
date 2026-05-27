// components.jsx — IA CHAT shared UI primitives
// Icons (custom SVG set), avatars, badges, bottom nav, streak flame, etc.

// ────────────────────────────────────────────────
// Icons — a curated custom set, single style (stroke 1.8, round)
// ────────────────────────────────────────────────
const I = {
  // navigation
  home: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3.5 11L12 4l8.5 7v8.5a1 1 0 01-1 1h-4.5v-6h-6v6H4.5a1 1 0 01-1-1V11z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  trophy: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v5a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M17 6h2.5a1 1 0 011 1v1a3 3 0 01-3 3M7 6H4.5a1 1 0 00-1 1v1a3 3 0 003 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9 14v2.5h6V14M8 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  users: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 14h.5c2.6 0 4.5 1.8 4.5 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  user: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  // streak
  flame: (s = 22, color = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c1.5 3 4.5 4 4.5 8a4.5 4.5 0 11-9 0c0-2 1-3 2-4 .5 1.5 1.5 2 2.5 2-1-2-1-4 0-6z"
        fill={color} stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10.5 14.5c0 1.4 1 2.5 1.5 2.5s1.5-1 1.5-2.3" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  ),
  // achievements / xp
  star: (s = 16, color = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.9 6.3 6.6.7-5 4.6 1.4 6.6L12 16.9l-5.9 3.3L7.5 13.6l-5-4.6 6.6-.7L12 2z"/>
    </svg>
  ),
  coin: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.5"/>
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--gold-deep)" fontFamily="var(--font-display)">XP</text>
    </svg>
  ),
  medal: (s = 22, color = "var(--gold)") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 2h8l-2 6h-4L8 2z" fill={color} opacity="0.6"/>
      <circle cx="12" cy="14" r="6.5" fill={color} stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="14" r="3.5" fill="white" opacity="0.3"/>
    </svg>
  ),
  // ui
  chevron: (s = 18, dir = "right") => {
    const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  },
  arrowRight: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowLeft: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  search: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  settings: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  bell: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  // telegram
  telegram: (s = 22, color = "white") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
      <path d="M22 4.5L2.5 12.2c-.7.3-.7 1.3.1 1.5l4.6 1.4 1.8 5.8c.2.6 1 .8 1.5.3l2.5-2.5 4.5 3.3c.7.5 1.7.1 1.8-.7L22.9 5.5c.2-.8-.5-1.4-1-.9zM10 14.5l8-6-6 7v3l-2-4z"/>
    </svg>
  ),
  globe: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  bolt: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>
  ),
  chat: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-5l-5 4v-4H7a3 3 0 01-3-3V6z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="9" cy="10" r="1" fill="currentColor"/>
      <circle cx="12" cy="10" r="1" fill="currentColor"/>
      <circle cx="15" cy="10" r="1" fill="currentColor"/>
    </svg>
  ),
  heart: (s = 18, fill = "none") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 21c-1 0-9-5.5-9-12 0-3 2.5-5 5-5 2 0 3 1 4 2.5C13 5 14 4 16 4c2.5 0 5 2 5 5 0 6.5-8 12-9 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  lock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  bookmark: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 3h12v18l-6-4-6 4V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  mic: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  ear: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 21c-2 0-4-2-4-4 0-3 2-5 2-8a6 6 0 0112 0c0 4-5 4-5 8 0 2-2 3-3 3a2 2 0 01-2-2"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  book: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M4 20a2 2 0 012-2h13v3H6a2 2 0 01-2-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  pencil: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  trend: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 17l6-6 4 4 8-9M15 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  qr: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="5.5" y="5.5" width="2" height="2" fill="currentColor"/>
      <rect x="16.5" y="5.5" width="2" height="2" fill="currentColor"/>
      <rect x="5.5" y="16.5" width="2" height="2" fill="currentColor"/>
      <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
      <rect x="19" y="14" width="2" height="2" fill="currentColor"/>
      <rect x="14" y="19" width="2" height="2" fill="currentColor"/>
      <rect x="19" y="19" width="2" height="2" fill="currentColor"/>
    </svg>
  ),
  copy: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  share: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12M8 7l4-4 4 4M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ────────────────────────────────────────────────
// Avatar — colorful initials disk with optional ring
// ────────────────────────────────────────────────
function Avatar({ name = "U", size = 44, ring = null, emoji = null, bg = null, style = {} }) {
  // Deterministic color from name
  const colors = ["#5B47FF", "#FF7A2A", "#1EC57A", "#A056FF", "#229ED9", "#FF5A7A", "#FFB627"];
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const c = bg || colors[hash % colors.length];
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const ringStyle = ring
    ? { boxShadow: `0 0 0 2px white, 0 0 0 ${2 + (ring.w || 2)}px ${ring.color}` }
    : {};
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 800,
      fontSize: emoji ? size * 0.55 : size * 0.4,
      letterSpacing: "-0.02em",
      flexShrink: 0,
      ...ringStyle, ...style,
    }}>
      {emoji || initials}
    </div>
  );
}

// ────────────────────────────────────────────────
// Level badge — CEFR pill A1..C2 with color
// ────────────────────────────────────────────────
function LevelPill({ level = "B1", size = "md" }) {
  const colors = {
    A1: "var(--lv-a1)", A2: "var(--lv-a2)", B1: "var(--lv-b1)",
    B2: "var(--lv-b2)", C1: "var(--lv-c1)", C2: "var(--lv-c2)",
  };
  const sz = size === "sm" ? { fs: 10, py: 3, px: 8 } : size === "lg" ? { fs: 14, py: 6, px: 14 } : { fs: 11, py: 4, px: 10 };
  return (
    <span className="level-pill" style={{ background: colors[level], fontSize: sz.fs, padding: `${sz.py}px ${sz.px}px` }}>
      {level}
    </span>
  );
}

// ────────────────────────────────────────────────
// Flame (animated SVG) — the streak hero element
// ────────────────────────────────────────────────
function BigFlame({ size = 80, glow = true }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      {glow && (
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,122,42,0.35) 0%, transparent 65%)",
          filter: "blur(4px)",
        }} />
      )}
      <div style={{
        position: "relative", width: "100%", height: "100%",
        animation: "flameFlicker 1.8s ease-in-out infinite",
        transformOrigin: "50% 90%",
      }}>
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="flameG" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffd05a"/>
              <stop offset="45%" stopColor="#ff7a2a"/>
              <stop offset="100%" stopColor="#e85c10"/>
            </linearGradient>
            <linearGradient id="flameG2" x1="50%" y1="20%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fff5b8"/>
              <stop offset="100%" stopColor="#ffb627"/>
            </linearGradient>
          </defs>
          <path d="M50 5 C 60 22 78 32 78 55 a28 28 0 11-56 0 c0-13 6-19 12-25 2 8 8 12 14 12-6-10-6-22 2-37 z" fill="url(#flameG)"/>
          <path d="M50 35 c5 9 14 16 14 26 a14 14 0 11-28 0 c0-7 4-12 8-15 1 5 5 7 8 6 -3-5-5-10-2-17z" fill="url(#flameG2)"/>
        </svg>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Bottom Nav — five tabs
// ────────────────────────────────────────────────
const TABS = [
  { key: "dashboard", label: "Home", icon: "home" },
  { key: "leaderboard", label: "Ranking", icon: "trophy" },
  { key: "achievements", label: "Conquistas", icon: "medal" },
  { key: "friends", label: "Amigos", icon: "users" },
  { key: "profile", label: "Perfil", icon: "user" },
];

function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingBottom: 24, paddingTop: 6,
      background: "rgba(255, 247, 232, 0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid var(--line)",
      zIndex: 30,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "0 6px" }}>
        {TABS.map(t => {
          const isActive = active === t.key || (t.key === "achievements" && active === "achievements");
          const isHighlighted = active === t.key;
          return (
            <button key={t.key}
              onClick={() => onChange(t.key)}
              style={{
                background: "transparent", border: 0, padding: "8px 4px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: isHighlighted ? "var(--brand)" : "var(--ink-muted)",
                cursor: "pointer", borderRadius: 12,
                position: "relative",
              }}>
              {isHighlighted && (
                <div style={{
                  position: "absolute", top: 2, width: 28, height: 3, borderRadius: 2,
                  background: "var(--brand)",
                }} />
              )}
              <div style={{ marginTop: 3 }}>
                {t.icon === "medal"
                  ? I.medal(22, isHighlighted ? "var(--brand)" : "var(--ink-muted)")
                  : I[t.icon] && I[t.icon](22)}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.2 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Top header inside app screens (greeting / title + right slot)
// ────────────────────────────────────────────────
function AppHeader({ title, subtitle, right, onBack, dark = false }) {
  return (
    <div style={{ padding: "8px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 12,
          border: "1px solid var(--line)", background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink)", cursor: "pointer", flexShrink: 0,
        }}>
          {I.arrowLeft(18)}
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && <div className="eyebrow" style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--ink-muted)" }}>{subtitle}</div>}
        <div className="h-section" style={{ fontSize: 26, color: dark ? "white" : "var(--ink)" }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// ────────────────────────────────────────────────
// Stat tile — number + label + icon, colored bg variants
// ────────────────────────────────────────────────
function Stat({ value, label, icon, color = "var(--brand)", bg = "var(--brand-soft)", style = {} }) {
  return (
    <div style={{
      padding: "14px 14px", borderRadius: 16,
      background: bg, border: `1px solid ${color}22`,
      display: "flex", flexDirection: "column", gap: 6,
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      </div>
      <div className="tabular" style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24,
        color: "var(--ink)", lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Progress bar — striped, animated
// ────────────────────────────────────────────────
function Progress({ value = 50, max = 100, color = "var(--brand)", bg = "var(--brand-soft)", height = 10, showLabel = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%" }}>
      <div style={{
        height, borderRadius: 999, background: bg, overflow: "hidden", position: "relative",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color, borderRadius: 999,
          transition: "width 0.4s ease",
        }} />
      </div>
      {showLabel && (
        <div className="tabular" style={{ marginTop: 4, fontSize: 11, color: "var(--ink-soft)", display: "flex", justifyContent: "space-between" }}>
          <span>{value} XP</span>
          <span>{max} XP</span>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// XP coin display — small inline xp tag
// ────────────────────────────────────────────────
function XPTag({ value, color = "var(--gold)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
      color: "var(--gold-deep)",
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%",
        background: color, color: "white",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 800,
        border: "1.5px solid var(--gold-deep)",
      }}>★</span>
      <span className="tabular">+{value}</span>
    </span>
  );
}

// Export everything
Object.assign(window, {
  I, Avatar, LevelPill, BigFlame, BottomNav, AppHeader, Stat, Progress, XPTag, TABS,
});

export {};
