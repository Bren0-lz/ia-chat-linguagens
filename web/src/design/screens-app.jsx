// screens-app.jsx — authenticated screens
// Dashboard (3 layout variants), Profile, Achievements (3 viz variants),
// Friends, Leaderboard, History, Settings.
// Streak has 3 visualization variants used across dashboard + profile.

// ────────────────────────────────────────────────
// Shared mock data for "Ana"
// ────────────────────────────────────────────────
const MOCK_ME = {
  name: "Ana",
  fullName: "Ana Beatriz",
  handle: "@anabsantos",
  level: "B1",
  xp: 2840,
  xpNextLevel: 3200,
  streak: 23,
  longestStreak: 47,
  league: "Prata II",
  leagueRank: 4,
  lessons: 142,
  minutesToday: 6,
  goalMinutes: 10,
  totalDays: 89,
  friends: 12,
  joined: "Mar 2025",
};

// Live ME proxy — reads real student data from the auth bridge (window.__iaAuth)
// and falls back to mock defaults for fields the backend doesn't track yet.
const ME = new Proxy(MOCK_ME, {
  get(target, prop) {
    const live = (typeof window !== "undefined" ? window.__iaAuth : null);
    const s = live && live.student;
    if (s) {
      const fullName = s.name || target.fullName;
      const first = (fullName || "").split(" ")[0] || target.name;
      if (prop === "name") return first;
      if (prop === "fullName") return fullName;
      if (prop === "handle") return s.telegram_username ? "@" + s.telegram_username : target.handle;
      if (prop === "level") return s.level || target.level;
      if (prop === "xp") return typeof s.xp === "number" ? s.xp : target.xp;
      if (prop === "streak") return typeof s.streak_count === "number" ? s.streak_count : target.streak;
      if (prop === "lessons") return typeof s.msg_count === "number" ? s.msg_count : target.lessons;
    }
    return target[prop];
  },
});

// Last 14 days of activity (1 = active, 0 = miss, with intensity)
const ACTIVITY_14 = [1,1,0,1,1,1,1,1,1,1,0,1,1,1];
// 30 days for monthly heatmap
const ACTIVITY_30 = [1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1];
// 7-day XP bars
const WEEK_XP = [85, 120, 0, 95, 140, 60, 110];

const FRIENDS = [
  { name: "Lucas P.", level: "B2", xp: 3120, online: true, streak: 31 },
  { name: "Mariana C.", level: "B1", xp: 2950, online: true, streak: 18 },
  { name: "Rafael S.", level: "A2", xp: 1840, online: false, streak: 5 },
  { name: "Júlia M.", level: "C1", xp: 4280, online: false, streak: 64 },
  { name: "Pedro V.", level: "A2", xp: 1200, online: true, streak: 2 },
];

const ACHIEVEMENTS = [
  { id: 1, emoji: "🔥", name: "Em chamas", desc: "7 dias seguidos", unlocked: true, rarity: "comum", progress: 100, color: "var(--flame)" },
  { id: 2, emoji: "🌟", name: "Estrela em ascensão", desc: "Suba 1 nível", unlocked: true, rarity: "comum", progress: 100, color: "var(--gold)" },
  { id: 3, emoji: "💬", name: "Tagarela", desc: "100 mensagens com o bot", unlocked: true, rarity: "raro", progress: 100, color: "var(--telegram)" },
  { id: 4, emoji: "🎯", name: "Foco total", desc: "30 dias seguidos", unlocked: false, rarity: "raro", progress: 76, color: "var(--brand)" },
  { id: 5, emoji: "📚", name: "Bookworm", desc: "200 palavras novas", unlocked: false, rarity: "raro", progress: 62, color: "var(--violet)" },
  { id: 6, emoji: "🏆", name: "Topo da liga", desc: "1º lugar semanal", unlocked: false, rarity: "épico", progress: 0, color: "var(--gold)" },
  { id: 7, emoji: "🌍", name: "Poliglota", desc: "Aprenda 3 idiomas", unlocked: false, rarity: "lendário", progress: 33, color: "var(--mint)" },
  { id: 8, emoji: "⚡", name: "Velocista", desc: "100 XP em 1 dia", unlocked: true, rarity: "comum", progress: 100, color: "var(--coral)" },
  { id: 9, emoji: "👥", name: "Social", desc: "10 amigos", unlocked: true, rarity: "comum", progress: 100, color: "var(--brand)" },
];

const LEAGUE_RANKING = [
  { rank: 1, name: "Júlia M.", xp: 4280, change: 1, isMe: false },
  { rank: 2, name: "Carlos B.", xp: 3590, change: -1, isMe: false },
  { rank: 3, name: "Lucas P.", xp: 3120, change: 0, isMe: false },
  { rank: 4, name: "Ana B.", xp: 2840, change: 2, isMe: true },
  { rank: 5, name: "Mariana C.", xp: 2950, change: -1, isMe: false },
  { rank: 6, name: "Felipe T.", xp: 2540, change: 0, isMe: false },
  { rank: 7, name: "Bruna L.", xp: 2310, change: 3, isMe: false },
  { rank: 8, name: "Diego R.", xp: 2100, change: -2, isMe: false },
  { rank: 9, name: "Helena K.", xp: 1950, change: 0, isMe: false },
  { rank: 10, name: "Igor F.", xp: 1820, change: -1, isMe: false },
];

// ════════════════════════════════════════════════
// STREAK VISUALIZATIONS — 3 variants
// ════════════════════════════════════════════════
function StreakFlameViz({ streak, longest }) {
  return (
    <div style={{
      background: "linear-gradient(140deg, #fff2dc 0%, #ffe1c4 100%)",
      border: "1px solid var(--flame-soft)",
      borderRadius: 22, padding: 20,
      display: "flex", alignItems: "center", gap: 18,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.4,
        background: "radial-gradient(circle at 80% 50%, rgba(255,122,42,0.2), transparent 60%)",
      }} />
      <div style={{ position: "relative", flexShrink: 0 }}>
        <BigFlame size={84} />
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--flame-deep)", marginBottom: 4 }}>Seu streak</div>
        <div className="tabular" style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48,
          color: "var(--flame-deep)", lineHeight: 1,
        }}>{streak}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
          dias seguidos · maior: <strong className="tabular" style={{ color: "var(--ink)" }}>{longest}</strong>
        </div>
      </div>
    </div>
  );
}

function StreakChartViz({ streak, longest }) {
  const max = Math.max(...WEEK_XP);
  const days = ["S","T","Q","Q","S","S","D"];
  return (
    <div style={{
      background: "linear-gradient(140deg, var(--surface) 0%, var(--surface-soft) 100%)",
      border: "1px solid var(--line)",
      borderRadius: 22, padding: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--flame-deep)" }}>Streak · 7 dias</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span className="tabular" style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 42,
              color: "var(--flame-deep)", lineHeight: 1,
            }}>{streak}</span>
            <span style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600 }}>dias</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--flame-soft)", borderRadius: 999 }}>
          {I.flame(16, "var(--flame-deep)")}
          <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: "var(--flame-deep)" }}>+1 hoje</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
        {WEEK_XP.map((xp, i) => {
          const h = max > 0 ? (xp / max) * 100 : 0;
          const isToday = i === WEEK_XP.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", height: `${Math.max(h, 4)}%`,
                borderRadius: 6,
                background: xp === 0 ? "var(--surface-soft)"
                  : isToday ? "linear-gradient(180deg, var(--flame) 0%, var(--flame-deep) 100%)"
                  : "var(--brand)",
                border: xp === 0 ? "1px dashed var(--line-strong)" : 0,
                transition: "height 0.4s",
              }} />
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: isToday ? "var(--flame-deep)" : "var(--ink-muted)",
              }}>{days[i]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StreakCalendarViz({ streak, longest }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: 22, padding: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--flame-deep)" }}>Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            {I.flame(28, "var(--flame)")}
            <span className="tabular" style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32,
              color: "var(--flame-deep)", lineHeight: 1,
            }}>{streak}</span>
            <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>dias</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 700, textAlign: "right" }}>
          NOV 2025
        </div>
      </div>
      {/* heatmap-ish grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: 4 }}>
        {ACTIVITY_30.map((a, i) => (
          <div key={i} style={{
            aspectRatio: "1",
            borderRadius: 5,
            background: a ? (
              i > 25 ? "var(--flame)" :
              i > 20 ? "var(--flame)" :
              "var(--brand)"
            ) : "var(--surface-soft)",
            border: a ? 0 : "1px solid var(--line)",
            opacity: a ? (0.6 + i / 75) : 1,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 11, color: "var(--ink-muted)" }}>
        <span>Menos</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? "var(--surface-soft)" : "var(--brand)", opacity: i === 0 ? 1 : 0.3 + i * 0.2 }} />
          ))}
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
}

function StreakViz({ kind, streak, longest }) {
  if (kind === "chart") return <StreakChartViz streak={streak} longest={longest} />;
  if (kind === "calendar") return <StreakCalendarViz streak={streak} longest={longest} />;
  return <StreakFlameViz streak={streak} longest={longest} />;
}

// ════════════════════════════════════════════════
// TELEGRAM STATUS CARD — appears in dashboard
// ════════════════════════════════════════════════
function TelegramStatusCard() {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--telegram) 0%, #1a85b8 100%)",
      color: "white", borderRadius: 20, padding: 16,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -30, right: -30, width: 140, height: 140,
        borderRadius: "50%", background: "rgba(255,255,255,0.08)",
      }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{I.telegram(24, "white")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Bot conectado
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>@iachat_bot</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#5ee395", marginRight: 6 }} />
            Última atividade · há 2h
          </div>
        </div>
        <button style={{
          background: "white", color: "var(--telegram-deep)",
          border: 0, padding: "10px 14px", borderRadius: 12,
          fontWeight: 700, fontSize: 12.5, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          Abrir
          {I.arrowRight(14)}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// XP / LEVEL CARD
// ════════════════════════════════════════════════
function XPCard() {
  const pct = (ME.xp / ME.xpNextLevel) * 100;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LevelPill level={ME.level} size="lg" />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Próximo nível
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>B2</div>
          </div>
        </div>
        <div className="tabular" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          <strong style={{ color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: 16 }}>{ME.xp}</strong> / {ME.xpNextLevel} XP
        </div>
      </div>
      <Progress value={ME.xp} max={ME.xpNextLevel} color="linear-gradient(90deg, var(--brand), var(--violet))" bg="var(--brand-soft)" height={12} />
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-soft)" }}>
        Faltam <strong className="tabular" style={{ color: "var(--brand)" }}>{ME.xpNextLevel - ME.xp} XP</strong> para subir para B2 — Intermediário avançado
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// DAILY GOAL RING
// ════════════════════════════════════════════════
function GoalRing({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--brand-soft)" strokeWidth="6"/>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--brand)" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 0.4s" }}/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", color: "var(--brand)",
      }}>
        <div className="tabular" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--ink-muted)", marginTop: 1 }}>/ {max}m</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// DASHBOARD — 3 layout variants
// ════════════════════════════════════════════════
function ScreenDashboard({ go, t }) {
  const layout = t.dashLayout || "cards";
  if (layout === "rows") return <DashboardRows go={go} streakKind={t.streakViz} />;
  if (layout === "game") return <DashboardGame go={go} streakKind={t.streakViz} />;
  return <DashboardCards go={go} streakKind={t.streakViz} />;
}

// 1) CARDS layout — default, generous spacing, varied cards
function DashboardCards({ go, streakKind }) {
  return (
    <div className="ia-screen">
      {/* greeting */}
      <div style={{ padding: "16px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={ME.name} size={44} ring={{ color: "var(--brand)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Bom dia,</div>
          <div className="h-section" style={{ fontSize: 22, lineHeight: 1.1 }}>{ME.name} 👋</div>
        </div>
        <button onClick={() => go("notifications")} style={{
          width: 42, height: 42, borderRadius: 14,
          border: "1px solid var(--line)", background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink)", cursor: "pointer", position: "relative",
        }}>
          {I.bell(20)}
          <span style={{
            position: "absolute", top: 8, right: 9, width: 8, height: 8,
            borderRadius: "50%", background: "var(--coral)", border: "2px solid white",
          }} />
        </button>
      </div>

      <div style={{ padding: "16px 20px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* streak */}
        <StreakViz kind={streakKind} streak={ME.streak} longest={ME.longestStreak} />

        {/* daily goal */}
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <GoalRing value={ME.minutesToday} max={ME.goalMinutes} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: "var(--brand)" }}>Meta de hoje</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
              {ME.goalMinutes - ME.minutesToday} min restantes
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 1 }}>
              Continue no Telegram para fechar o dia
            </div>
          </div>
        </div>

        {/* XP */}
        <XPCard />

        {/* Telegram status */}
        <TelegramStatusCard />

        {/* Continue + Suggested */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ActionCard
            tag="CONTINUAR"
            tagBg="var(--brand)"
            title="Past Continuous"
            sub="Lição 12 · 3 min"
            icon={I.book(22)}
            bg="linear-gradient(135deg, var(--brand-soft), white)"
          />
          <ActionCard
            tag="DESAFIO"
            tagBg="var(--flame)"
            title="Diálogo no café"
            sub="+50 XP"
            icon={I.chat(22)}
            bg="linear-gradient(135deg, var(--flame-soft), white)"
          />
        </div>

        {/* recent achievements */}
        <div style={{ padding: "8px 0 0" }}>
          <SectionHeader title="Conquistas recentes" right={<button className="btn-ghost" onClick={() => go("achievements")}>Ver todas</button>}/>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginLeft: -2, marginRight: -2 }}>
            {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 4).map(a => (
              <div key={a.id} style={{
                flexShrink: 0, width: 110, padding: 14,
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 16, textAlign: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `${a.color}22`, color: a.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 8px", fontSize: 22,
                }}>{a.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{a.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* friends activity teaser */}
        <SectionHeader title="Seus amigos hoje" right={<button className="btn-ghost" onClick={() => go("friends")}>Ver todos</button>}/>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {FRIENDS.slice(0, 3).map((f, i) => (
            <FriendRow key={f.name} friend={f} isLast={i === 2}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ tag, tagBg, title, sub, icon, bg }) {
  return (
    <button style={{
      padding: 14, borderRadius: 18, border: "1px solid var(--line)",
      background: bg, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
      display: "flex", flexDirection: "column", gap: 10, minHeight: 140,
    }}>
      <div style={{
        display: "inline-flex", alignSelf: "flex-start",
        background: tagBg, color: "white",
        padding: "3px 8px", borderRadius: 6,
        fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
      }}>{tag}</div>
      <div style={{ marginTop: "auto", color: "var(--ink)" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{sub}</div>
    </button>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 6px" }}>
      <div className="h-section" style={{ fontSize: 17 }}>{title}</div>
      {right}
    </div>
  );
}

function FriendRow({ friend, isLast }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px",
      borderBottom: isLast ? 0 : "1px solid var(--line)",
    }}>
      <div style={{ position: "relative" }}>
        <Avatar name={friend.name} size={38} />
        {friend.online && (
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--mint)", border: "2px solid white",
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{friend.name}</span>
          <LevelPill level={friend.level} size="sm" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-soft)", marginTop: 1 }}>
          <span className="tabular">{friend.xp} XP</span>
          <span>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            {I.flame(11, "var(--flame)")} <span className="tabular">{friend.streak}d</span>
          </span>
        </div>
      </div>
      <button style={{
        background: "var(--brand-soft)", color: "var(--brand)",
        border: 0, padding: "6px 10px", borderRadius: 8,
        fontSize: 11, fontWeight: 700, cursor: "pointer",
      }}>Desafiar</button>
    </div>
  );
}

// 2) ROWS layout — denser list-style dashboard
function DashboardRows({ go, streakKind }) {
  return (
    <div className="ia-screen">
      <div style={{ padding: "16px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={ME.name} size={40} ring={{ color: "var(--brand)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{ME.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            <LevelPill level={ME.level} size="sm" /> &nbsp;
            <span className="tabular">{ME.xp} XP</span>
          </div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12,
          border: "1px solid var(--line)", background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>{I.bell(18)}</button>
      </div>

      <div style={{ padding: "16px 20px 100px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* streak hero */}
        <StreakViz kind={streakKind} streak={ME.streak} longest={ME.longestStreak} />

        {/* condensed rows */}
        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 6 }}>
          <RowItem
            icon={I.bolt(22)} iconBg="var(--brand)"
            label="Meta de hoje"
            value={`${ME.minutesToday}/${ME.goalMinutes} min`}
            right={<GoalRing value={ME.minutesToday} max={ME.goalMinutes} />}
            tall
          />
          <RowItem
            icon={I.coin(22)} iconBg="var(--gold)"
            label="XP esta semana"
            value="+510 XP"
            sub="+12% vs semana passada"
            isLast
          />
        </div>

        <TelegramStatusCard />

        <SectionHeader title="Próximas lições" />
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {[
            { tag: "CONTINUAR", tagBg: "var(--brand)", title: "Past Continuous", sub: "Lição 12 · 3 min", icon: I.book(18) },
            { tag: "DESAFIO", tagBg: "var(--flame)", title: "Diálogo no café", sub: "+50 XP", icon: I.chat(18) },
            { tag: "REVISAR", tagBg: "var(--violet)", title: "Vocabulário: viagem", sub: "12 palavras", icon: I.bookmark(18) },
          ].map((row, i, arr) => (
            <RowItem key={i}
              icon={row.icon} iconBg={row.tagBg}
              label={row.title} sub={row.sub}
              tag={row.tag} tagBg={row.tagBg}
              isLast={i === arr.length - 1}
            />
          ))}
        </div>

        <SectionHeader title="Amigos hoje" right={<button className="btn-ghost" onClick={() => go("friends")}>Ver</button>} />
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {FRIENDS.slice(0, 3).map((f, i) => (
            <FriendRow key={f.name} friend={f} isLast={i === 2}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowItem({ icon, iconBg, label, value, sub, right, tag, tagBg, isLast, tall }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: tall ? "14px" : "12px 14px",
      borderBottom: isLast ? 0 : "1px solid var(--line)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: iconBg, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 1 }}>{sub}</div>}
      </div>
      {value && <div className="tabular" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{value}</div>}
      {tag && (
        <div style={{
          background: `${tagBg}22`, color: tagBg,
          padding: "3px 8px", borderRadius: 6,
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
        }}>{tag}</div>
      )}
      {right}
    </div>
  );
}

// 3) GAME layout — HUD-style with avatar prominent and big metrics
function DashboardGame({ go, streakKind }) {
  return (
    <div className="ia-screen">
      {/* dark hero with avatar */}
      <div style={{
        background: "linear-gradient(180deg, var(--surface-ink) 0%, #2a1f5c 100%)",
        color: "white", padding: "20px 20px 80px",
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(91,71,255,0.4), transparent 70%)",
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <button style={{
            width: 40, height: 40, borderRadius: 14,
            background: "rgba(255,255,255,0.1)", border: 0, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>{I.settings(20)}</button>
          <button style={{
            width: 40, height: 40, borderRadius: 14,
            background: "rgba(255,255,255,0.1)", border: 0, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            position: "relative",
          }}>
            {I.bell(20)}
            <span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: "50%", background: "var(--coral)" }} />
          </button>
        </div>
        <div style={{ position: "relative", textAlign: "center", marginBottom: 14 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar name={ME.name} size={92} ring={{ color: "var(--gold)", w: 3 }} />
            <div style={{
              position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
              background: "var(--gold)", color: "var(--ink)",
              padding: "3px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
              fontFamily: "var(--font-display)",
              boxShadow: "0 4px 12px rgba(217,147,10,0.4)",
            }}>NÍVEL {ME.level}</div>
          </div>
          <div className="h-display" style={{ fontSize: 24, marginTop: 14, color: "white" }}>
            Olá, {ME.name}!
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{ME.league} · #{ME.leagueRank} da liga</div>
        </div>
        {/* XP bar */}
        <div style={{ position: "relative", padding: "0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 6 }}>
            <span className="tabular">{ME.xp} XP</span>
            <span className="tabular">{ME.xpNextLevel} XP</span>
          </div>
          <div style={{ height: 12, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${(ME.xp / ME.xpNextLevel) * 100}%`,
              background: "linear-gradient(90deg, var(--gold) 0%, var(--flame) 100%)",
              borderRadius: 999,
              boxShadow: "0 0 12px rgba(255,182,39,0.6)",
            }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 100px", marginTop: -56, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* big stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <BigMetric icon={I.flame(22, "white")} bg="var(--flame)" value={ME.streak} label="STREAK" />
          <BigMetric icon={I.bolt(22)} bg="var(--gold)" value="510" label="XP/SEM" />
          <BigMetric icon={I.trophy(22)} bg="var(--brand)" value={`#${ME.leagueRank}`} label="LIGA" />
        </div>

        {/* main mission card */}
        <div style={{
          background: "linear-gradient(135deg, var(--brand) 0%, var(--violet) 100%)",
          color: "white", borderRadius: 20, padding: 18, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(255,255,255,0.1)",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 6 }}>
                MISSÃO PRINCIPAL
              </span>
              <XPTag value="50" color="var(--gold)" />
            </div>
            <div className="h-section" style={{ fontSize: 20, color: "white", margin: "0 0 4px" }}>
              Conversa: Pedindo café
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14 }}>
              3 min · diálogo em tempo real com IA
            </div>
            <button style={{
              background: "white", color: "var(--brand)", border: 0,
              padding: "12px 18px", borderRadius: 12, fontWeight: 800, fontSize: 14,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
              Começar no Telegram
              {I.telegram(16, "var(--brand)")}
            </button>
          </div>
        </div>

        <StreakViz kind={streakKind} streak={ME.streak} longest={ME.longestStreak} />

        <SectionHeader title="Próximas conquistas" right={<button className="btn-ghost" onClick={() => go("achievements")}>Ver</button>} />
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {ACHIEVEMENTS.filter(a => !a.unlocked && a.progress > 0).slice(0, 2).map((a, i, arr) => (
            <div key={a.id} style={{
              padding: "12px 14px",
              borderBottom: i === arr.length - 1 ? 0 : "1px solid var(--line)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${a.color}22`, color: a.color,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>{a.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 5 }}>{a.desc}</div>
                <Progress value={a.progress} color={a.color} bg={`${a.color}22`} height={6} />
              </div>
              <div className="tabular" style={{ fontSize: 13, fontWeight: 700, color: a.color }}>{a.progress}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BigMetric({ icon, bg, value, label }) {
  return (
    <div style={{
      padding: "14px 12px", background: "var(--surface)",
      border: "1px solid var(--line)", borderRadius: 16,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      boxShadow: "0 4px 12px rgba(21,16,46,0.05)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: bg, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div className="tabular" style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
        color: "var(--ink)", lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════
function ScreenProfile({ go, t }) {
  return (
    <div className="ia-screen">
      <AppHeader title="Perfil" right={
        <button onClick={() => go("settings")} style={{
          width: 38, height: 38, borderRadius: 12,
          border: "1px solid var(--line)", background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--ink)",
        }}>{I.settings(20)}</button>
      } />

      <div style={{ padding: "16px 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* hero */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 22, padding: 20, textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(135deg, var(--brand) 0%, var(--violet) 100%)",
          }} />
          <div style={{ position: "relative", marginTop: 24 }}>
            <Avatar name={ME.name} size={84} ring={{ color: "white", w: 4 }} style={{ margin: "0 auto" }} />
            <div className="h-display" style={{ fontSize: 22, marginTop: 10 }}>{ME.fullName}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{ME.handle} · Entrou em {ME.joined}</div>
            <div style={{ display: "inline-flex", gap: 6, marginTop: 10 }}>
              <LevelPill level={ME.level} size="md" />
              <span className="chip">
                {I.trophy(13)} {ME.league}
              </span>
            </div>
          </div>
        </div>

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Stat label="STREAK" value={`${ME.streak} dias`} icon={I.flame(14, "var(--flame-deep)")} color="var(--flame-deep)" bg="var(--flame-soft)" />
          <Stat label="XP TOTAL" value={ME.xp.toLocaleString("pt-BR")} icon={I.bolt(14)} color="var(--gold-deep)" bg="var(--gold-soft)" />
          <Stat label="LIÇÕES" value={ME.lessons} icon={I.book(14)} color="var(--brand-deep)" bg="var(--brand-soft)" />
          <Stat label="DIAS ATIVO" value={ME.totalDays} icon={I.calendar(14)} color="var(--mint-deep)" bg="var(--mint-soft)" />
        </div>

        {/* streak detail */}
        <StreakViz kind={t.streakViz} streak={ME.streak} longest={ME.longestStreak} />

        {/* achievements highlights */}
        <SectionHeader title={`Conquistas (${ACHIEVEMENTS.filter(a => a.unlocked).length}/${ACHIEVEMENTS.length})`}
          right={<button className="btn-ghost" onClick={() => go("achievements")}>Ver todas</button>}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {ACHIEVEMENTS.slice(0, 4).map(a => (
            <div key={a.id} style={{
              aspectRatio: "1",
              background: a.unlocked ? `${a.color}1a` : "var(--surface-soft)",
              border: a.unlocked ? `1.5px solid ${a.color}` : "1.5px dashed var(--line-strong)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              filter: a.unlocked ? "none" : "grayscale(1)",
              opacity: a.unlocked ? 1 : 0.4,
            }}>{a.emoji}</div>
          ))}
        </div>

        {/* CTA share */}
        <button className="btn btn-secondary" style={{ width: "100%" }}>
          {I.share(18)} Compartilhar perfil
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// ACHIEVEMENTS — 3 visual variants
// ════════════════════════════════════════════════
function ScreenAchievements({ go, t }) {
  const [filter, setFilter] = React.useState("all");
  const viz = t.achVisual || "cards";
  const filtered = filter === "all" ? ACHIEVEMENTS
    : filter === "unlocked" ? ACHIEVEMENTS.filter(a => a.unlocked)
    : ACHIEVEMENTS.filter(a => !a.unlocked);

  return (
    <div className="ia-screen">
      <AppHeader title="Conquistas"
        subtitle={`${ACHIEVEMENTS.filter(a => a.unlocked).length} de ${ACHIEVEMENTS.length} desbloqueadas`}
        onBack={() => go("dashboard")} />

      <div style={{ padding: "0 20px 16px" }}>
        <div style={{
          display: "flex", gap: 6, background: "var(--surface-soft)",
          padding: 4, borderRadius: 12, marginBottom: 16,
        }}>
          {[
            { k: "all", label: "Todas" },
            { k: "unlocked", label: "Desbloq." },
            { k: "locked", label: "Bloqueadas" },
          ].map(tab => (
            <button key={tab.k} onClick={() => setFilter(tab.k)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8, border: 0,
                background: filter === tab.k ? "var(--surface)" : "transparent",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
                color: filter === tab.k ? "var(--ink)" : "var(--ink-soft)",
                cursor: "pointer", boxShadow: filter === tab.k ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>
        {viz === "cards" && <AchCards items={filtered} />}
        {viz === "medals" && <AchMedals items={filtered} />}
        {viz === "shelf" && <AchShelf items={filtered} />}
      </div>
    </div>
  );
}

function AchCards({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(a => (
        <div key={a.id} style={{
          background: a.unlocked ? "var(--surface)" : "var(--surface-soft)",
          border: a.unlocked ? `1px solid ${a.color}40` : "1px dashed var(--line-strong)",
          borderRadius: 16, padding: 14,
          display: "flex", gap: 14, alignItems: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: a.unlocked ? `linear-gradient(135deg, ${a.color}, ${a.color}cc)` : "var(--surface)",
            color: "white", border: a.unlocked ? 0 : "1.5px dashed var(--line-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0,
            filter: a.unlocked ? "none" : "grayscale(1) opacity(0.4)",
            boxShadow: a.unlocked ? `0 6px 14px ${a.color}55` : "none",
          }}>{a.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: a.unlocked ? "var(--ink)" : "var(--ink-soft)" }}>{a.name}</span>
              <RarityBadge rarity={a.rarity} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: a.unlocked ? 0 : 8 }}>{a.desc}</div>
            {!a.unlocked && a.progress > 0 && (
              <div>
                <Progress value={a.progress} color={a.color} bg={`${a.color}22`} height={6}/>
                <div className="tabular" style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 3 }}>{a.progress}% completo</div>
              </div>
            )}
          </div>
          {a.unlocked && (
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: "var(--mint)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{I.check(14)}</div>
          )}
          {!a.unlocked && a.progress === 0 && (
            <div style={{ color: "var(--ink-muted)" }}>{I.lock(18)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AchMedals({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {items.map(a => (
        <div key={a.id} style={{
          background: a.unlocked ? `linear-gradient(180deg, ${a.color}15 0%, var(--surface) 100%)` : "var(--surface-soft)",
          border: a.unlocked ? `1px solid ${a.color}40` : "1px dashed var(--line-strong)",
          borderRadius: 18, padding: "18px 12px 14px",
          textAlign: "center", position: "relative",
        }}>
          {/* medal */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
            {/* ribbon */}
            <div style={{
              position: "absolute", left: "50%", top: -10, transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: `22px solid ${a.unlocked ? a.color : "#cdc6dc"}`,
              opacity: a.unlocked ? 0.45 : 0.3,
              zIndex: 0,
            }}/>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: a.unlocked
                ? `radial-gradient(circle at 30% 30%, ${a.color} 0%, ${a.color}cc 60%, ${a.color}99 100%)`
                : "var(--surface)",
              border: a.unlocked ? `3px solid white` : "3px dashed var(--line-strong)",
              boxShadow: a.unlocked ? `0 6px 14px ${a.color}66, inset 0 -3px 0 rgba(0,0,0,0.15)` : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, position: "relative", zIndex: 1,
              filter: a.unlocked ? "none" : "grayscale(1) opacity(0.4)",
            }}>{a.emoji}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: a.unlocked ? "var(--ink)" : "var(--ink-soft)", marginBottom: 2 }}>
            {a.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 6, minHeight: 26 }}>{a.desc}</div>
          {!a.unlocked && a.progress > 0 && (
            <Progress value={a.progress} color={a.color} bg={`${a.color}22`} height={4}/>
          )}
          {a.unlocked && <RarityBadge rarity={a.rarity} />}
        </div>
      ))}
    </div>
  );
}

function AchShelf({ items }) {
  // Group by rarity
  const groups = { lendário: [], épico: [], raro: [], comum: [] };
  items.forEach(a => { (groups[a.rarity] || []).push(a); });
  const order = ["lendário", "épico", "raro", "comum"];
  const colors = { lendário: "var(--mint)", épico: "var(--violet)", raro: "var(--telegram)", comum: "var(--ink-soft)" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {order.map(rarity => groups[rarity].length > 0 && (
        <div key={rarity}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "0 4px" }}>
            <div style={{ width: 6, height: 6, borderRadius: 999, background: colors[rarity] }}/>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors[rarity] }}>
              {rarity}
            </span>
            <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>· {groups[rarity].length}</span>
          </div>
          <div style={{
            background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%)",
            border: "1px solid var(--line)", borderBottom: "3px solid var(--ink-faint)",
            borderRadius: 18, padding: "14px 8px",
          }}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 4px" }}>
              {groups[rarity].map(a => (
                <div key={a.id} style={{
                  flexShrink: 0, width: 72, textAlign: "center",
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: a.unlocked ? `radial-gradient(circle at 30% 30%, ${a.color}, ${a.color}cc)` : "var(--surface)",
                    border: a.unlocked ? `3px solid white` : "2px dashed var(--line-strong)",
                    boxShadow: a.unlocked ? `0 4px 10px ${a.color}55` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, margin: "0 auto 4px",
                    filter: a.unlocked ? "none" : "grayscale(1) opacity(0.35)",
                  }}>{a.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, color: a.unlocked ? "var(--ink)" : "var(--ink-muted)" }}>
                    {a.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RarityBadge({ rarity }) {
  const colors = {
    comum: { bg: "rgba(154,147,173,0.18)", c: "var(--ink-soft)" },
    raro: { bg: "var(--telegram-soft)", c: "var(--telegram-deep)" },
    épico: { bg: "var(--violet-soft)", c: "var(--violet)" },
    lendário: { bg: "var(--mint-soft)", c: "var(--mint-deep)" },
  };
  const c = colors[rarity] || colors.comum;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
      padding: "2px 6px", borderRadius: 4,
      background: c.bg, color: c.c,
    }}>{rarity}</span>
  );
}

// ════════════════════════════════════════════════
// FRIENDS
// ════════════════════════════════════════════════
function ScreenFriends({ go }) {
  const [tab, setTab] = React.useState("friends");
  const [query, setQuery] = React.useState("");
  return (
    <div className="ia-screen">
      <AppHeader title="Amigos" subtitle={`${ME.friends} amigos`} onBack={() => go("dashboard")}
        right={<button style={{
          width: 38, height: 38, borderRadius: 12,
          background: "var(--brand)", color: "white", border: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 10px rgba(91,71,255,0.3)",
        }}>{I.plus(20)}</button>}
      />

      {/* search */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", background: "var(--surface)",
          border: "1px solid var(--line)", borderRadius: 14,
        }}>
          <span style={{ color: "var(--ink-muted)" }}>{I.search(18)}</span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por @usuário"
            style={{
              flex: 1, border: 0, background: "transparent",
              fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink)", outline: "none",
            }}
          />
        </div>
      </div>

      {/* tabs */}
      <div style={{
        display: "flex", gap: 24, padding: "0 20px",
        borderBottom: "1px solid var(--line)",
      }}>
        {[
          { k: "friends", label: "Amigos", count: 12 },
          { k: "requests", label: "Pedidos", count: 2 },
          { k: "suggest", label: "Sugestões", count: 6 },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{
              padding: "10px 0 12px", background: "transparent", border: 0,
              borderBottom: `2.5px solid ${tab === t.k ? "var(--brand)" : "transparent"}`,
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
              color: tab === t.k ? "var(--brand)" : "var(--ink-soft)",
              cursor: "pointer", marginBottom: -1,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {t.label}
            <span style={{
              fontSize: 11, padding: "1px 6px", borderRadius: 999,
              background: tab === t.k ? "var(--brand-soft)" : "var(--surface-soft)",
              color: tab === t.k ? "var(--brand)" : "var(--ink-muted)",
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 100px" }}>
        {tab === "friends" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {FRIENDS.map((f, i) => (
              <FriendRow key={f.name} friend={f} isLast={i === FRIENDS.length - 1}/>
            ))}
          </div>
        )}
        {tab === "requests" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { name: "Bruno C.", mutual: 3, level: "A2" },
              { name: "Carla T.", mutual: 1, level: "B1" },
            ].map(p => (
              <div key={p.name} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={p.name} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    <LevelPill level={p.level} size="sm" /> · {p.mutual} amigos em comum
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--brand)", color: "white", border: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>{I.check(18)}</button>
                  <button style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--surface-soft)", color: "var(--ink-soft)", border: "1px solid var(--line)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>{I.close(18)}</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "suggest" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { name: "Sofia L.", reason: "Mesma liga", level: "B1" },
              { name: "Tiago M.", reason: "Estuda inglês", level: "B1" },
              { name: "Renata O.", reason: "12 conexões mútuas", level: "B2" },
            ].map(p => (
              <div key={p.name} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={p.name} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    <LevelPill level={p.level} size="sm" />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{p.reason}</div>
                </div>
                <button style={{
                  background: "var(--brand-soft)", color: "var(--brand)",
                  border: 0, padding: "8px 12px", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {I.plus(14)} Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════
function ScreenLeaderboard({ go }) {
  const [tab, setTab] = React.useState("league");
  return (
    <div className="ia-screen">
      <AppHeader title="Ranking" onBack={() => go("dashboard")} />

      {/* tabs */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{
          display: "flex", gap: 4, background: "var(--surface-soft)",
          padding: 4, borderRadius: 12,
        }}>
          {[
            { k: "friends", label: "Amigos" },
            { k: "league", label: "Liga" },
            { k: "global", label: "Global" },
          ].map(tb => (
            <button key={tb.k} onClick={() => setTab(tb.k)}
              style={{
                flex: 1, padding: "8px 6px", borderRadius: 8, border: 0,
                background: tab === tb.k ? "var(--surface)" : "transparent",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
                color: tab === tb.k ? "var(--ink)" : "var(--ink-soft)",
                cursor: "pointer", boxShadow: tab === tb.k ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>{tb.label}</button>
          ))}
        </div>
      </div>

      {/* League hero */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{
          background: "linear-gradient(135deg, #d8d6e7 0%, #b8bcd0 100%)",
          border: "1px solid #a0a8c0",
          borderRadius: 22, padding: "18px 20px", position: "relative", overflow: "hidden",
          color: "var(--ink)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "linear-gradient(135deg, #d8d6e7, #8c92ac)",
              border: "3px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(140,146,172,0.5)",
              fontSize: 32,
            }}>🥈</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--ink-soft)" }}>
                Liga atual
              </div>
              <div className="h-display" style={{ fontSize: 22 }}>{ME.league}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                Você é #{ME.leagueRank} · Top 3 sobe para Ouro
              </div>
            </div>
          </div>
          {/* week timer */}
          <div style={{
            marginTop: 14, padding: "8px 12px",
            background: "rgba(255,255,255,0.4)", borderRadius: 10,
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, color: "var(--ink-soft)", fontWeight: 600,
          }}>
            <span>⏱</span>
            <span>Termina em <strong className="tabular" style={{ color: "var(--ink)" }}>4 dias e 18h</strong></span>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "0 20px 100px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {LEAGUE_RANKING.map((u, i) => {
            const promotion = u.rank <= 3;
            const demotion = u.rank >= 9;
            return (
              <div key={u.rank} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                background: u.isMe ? "var(--brand-soft)" : "transparent",
                borderBottom: i === LEAGUE_RANKING.length - 1 ? 0 : "1px solid var(--line)",
                borderLeft: u.isMe ? "3px solid var(--brand)" : "3px solid transparent",
              }}>
                <div className="tabular" style={{
                  width: 26, textAlign: "center",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
                  color: promotion ? "var(--gold-deep)" : demotion ? "var(--coral)" : "var(--ink-soft)",
                }}>
                  {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : u.rank}
                </div>
                <Avatar name={u.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {u.name} {u.isMe && <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 700 }}>(você)</span>}
                  </div>
                  <div className="tabular" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                    {u.xp.toLocaleString("pt-BR")} XP
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 2,
                  fontSize: 11, fontWeight: 700,
                  color: u.change > 0 ? "var(--mint-deep)" : u.change < 0 ? "var(--coral)" : "var(--ink-muted)",
                }}>
                  {u.change > 0 ? "▲" : u.change < 0 ? "▼" : "—"}
                  {u.change !== 0 && Math.abs(u.change)}
                </div>
              </div>
            );
          })}
          {/* zone divider */}
          <div style={{
            background: "var(--coral-soft)", padding: "6px 14px",
            fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
            color: "var(--coral)",
            borderTop: "1px dashed var(--coral)",
          }}>
            ↓ Zona de queda
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// HISTORY / ACTIVITY
// ════════════════════════════════════════════════
function ScreenHistory({ go }) {
  const max = Math.max(...WEEK_XP);
  return (
    <div className="ia-screen">
      <AppHeader title="Histórico" onBack={() => go("dashboard")} />

      <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* week summary */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--brand)" }}>Esta semana</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span className="tabular" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>510</span>
                <span style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600 }}>XP</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "var(--mint-deep)",
                  background: "var(--mint-soft)", padding: "2px 8px", borderRadius: 999,
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  {I.trend(11)} +12%
                </span>
              </div>
            </div>
            <select style={{
              padding: "6px 28px 6px 10px",
              border: "1px solid var(--line)", borderRadius: 8,
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              background: "var(--surface)",
            }}>
              <option>7 dias</option>
              <option>30 dias</option>
              <option>1 ano</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {WEEK_XP.map((xp, i) => {
              const h = max > 0 ? (xp / max) * 100 : 0;
              const days = ["S","T","Q","Q","S","S","D"];
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className="tabular" style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-muted)" }}>
                    {xp > 0 ? xp : ""}
                  </div>
                  <div style={{
                    width: "100%", height: `${Math.max(h, 4)}%`,
                    borderRadius: 6,
                    background: xp === 0 ? "var(--surface-soft)" : "linear-gradient(180deg, var(--brand) 0%, var(--violet) 100%)",
                    border: xp === 0 ? "1px dashed var(--line-strong)" : 0,
                  }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)" }}>{days[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* by type breakdown */}
        <SectionHeader title="Por atividade" />
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {[
            { type: "Conversa com bot", xp: 280, time: "1h 12m", icon: I.chat(18), color: "var(--telegram)" },
            { type: "Exercícios", xp: 150, time: "42m", icon: I.pencil(18), color: "var(--brand)" },
            { type: "Vocabulário", xp: 60, time: "18m", icon: I.book(18), color: "var(--violet)" },
            { type: "Listening", xp: 20, time: "6m", icon: I.ear(18), color: "var(--mint)" },
          ].map((row, i, arr) => (
            <div key={row.type} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderBottom: i === arr.length - 1 ? 0 : "1px solid var(--line)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${row.color}22`, color: row.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{row.type}</div>
                <div className="tabular" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{row.time}</div>
              </div>
              <div className="tabular" style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
                color: row.color,
              }}>+{row.xp}</div>
            </div>
          ))}
        </div>

        {/* timeline */}
        <SectionHeader title="Atividade recente" />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { when: "Hoje · 14:20", title: "Diálogo: Pedindo café", xp: 50, icon: I.chat(16), color: "var(--telegram)" },
            { when: "Hoje · 09:15", title: "Lição: Past Continuous", xp: 30, icon: I.book(16), color: "var(--brand)" },
            { when: "Ontem · 21:30", title: "Conquista: Em chamas", xp: 0, icon: I.medal(16, "var(--gold)"), color: "var(--gold)", badge: true },
            { when: "Ontem · 19:08", title: "Vocabulário: viagem", xp: 25, icon: I.bookmark(16), color: "var(--violet)" },
            { when: "Há 2 dias", title: "Quiz: phrasal verbs", xp: 45, icon: I.pencil(16), color: "var(--brand)" },
          ].map((ev, i, arr) => (
            <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 6 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 10,
                  background: `${ev.color}22`, color: ev.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{ev.icon}</div>
                {i < arr.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: "var(--line)", marginTop: 2 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>{ev.when}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</span>
                  {ev.xp > 0 && <XPTag value={ev.xp} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════
function ScreenSettings({ go }) {
  return (
    <div className="ia-screen">
      <AppHeader title="Configurações" onBack={() => go("profile")} />

      <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        <SettingsGroup title="Conta">
          <SettingsRow icon={I.user(18)} iconBg="var(--brand)" label="Editar perfil" detail={ME.handle}/>
          <SettingsRow icon={I.telegram(18, "white")} iconBg="var(--telegram)" label="Telegram" detail="Conectado" detailColor="var(--mint-deep)"/>
          <SettingsRow icon={I.globe(18)} iconBg="var(--violet)" label="Idioma estudado" detail="🇺🇸 Inglês" />
          <SettingsRow icon={I.bolt(18)} iconBg="var(--gold)" label="Meta diária" detail="10 min" isLast/>
        </SettingsGroup>

        <SettingsGroup title="Preferências">
          <SettingsRow icon={I.bell(18)} iconBg="var(--coral)" label="Notificações" detail="Diárias" />
          <SettingsRow icon={I.calendar(18)} iconBg="var(--mint)" label="Lembrete" detail="20:00" />
          <SettingsRow icon={I.heart(18)} iconBg="var(--coral)" label="Idioma da interface" detail="Português" isLast/>
        </SettingsGroup>

        <SettingsGroup title="Privacidade">
          <SettingsRow icon={I.lock(18)} iconBg="var(--ink)" label="Perfil público" detail="Ativado" detailColor="var(--mint-deep)"/>
          <SettingsRow icon={I.users(18)} iconBg="var(--brand)" label="Quem pode me adicionar" detail="Todos" isLast/>
        </SettingsGroup>

        <SettingsGroup title="Suporte">
          <SettingsRow icon={I.chat(18)} iconBg="var(--violet)" label="Central de ajuda"/>
          <SettingsRow icon={I.share(18)} iconBg="var(--brand)" label="Compartilhar o IA CHAT"/>
          <SettingsRow icon={I.bookmark(18)} iconBg="var(--gold)" label="Sobre" detail="v1.4.2" isLast/>
        </SettingsGroup>

        <button style={{
          background: "var(--coral-soft)", color: "var(--coral)",
          border: 0, padding: "14px", borderRadius: 14,
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          cursor: "pointer",
        }}>Sair</button>

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-muted)", paddingTop: 8 }}>
          IA CHAT · v1.4.2 · feito com 💜 no Brasil
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6, padding: "0 4px" }}>{title}</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, iconBg, label, detail, detailColor, isLast }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px",
      borderBottom: isLast ? 0 : "1px solid var(--line)",
      cursor: "pointer",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: iconBg, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{label}</div>
      {detail && (
        <div style={{ fontSize: 13, color: detailColor || "var(--ink-soft)", fontWeight: 500 }}>
          {detail}
        </div>
      )}
      {I.chevron(16, "right")}
    </div>
  );
}

// ════════════════════════════════════════════════
// Exports
// ════════════════════════════════════════════════
Object.assign(window, {
  ScreenDashboard, ScreenProfile, ScreenAchievements, ScreenFriends,
  ScreenLeaderboard, ScreenHistory, ScreenSettings,
  ME, FRIENDS, ACHIEVEMENTS, LEAGUE_RANKING, WEEK_XP, ACTIVITY_14, ACTIVITY_30,
});

export {};
