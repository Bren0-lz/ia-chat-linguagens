// app.jsx — IA CHAT main shell
// Owns: screen routing, iPhone frame, bottom nav, tweaks panel, screen-jump sidebar.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dashLayout": "cards",
  "streakViz": "flame",
  "achVisual": "cards",
  "vibe": "ludico"
}/*EDITMODE-END*/;

const SCREEN_GROUPS = [
  { label: "Onboarding", screens: [
    { k: "landing", label: "Landing" },
    { k: "auth", label: "Login / Cadastro" },
    { k: "onboarding", label: "Onboarding" },
    { k: "placement", label: "Nivelamento" },
  ]},
  { label: "App", screens: [
    { k: "dashboard", label: "Dashboard" },
    { k: "leaderboard", label: "Ranking" },
    { k: "achievements", label: "Conquistas" },
    { k: "friends", label: "Amigos" },
    { k: "profile", label: "Perfil" },
    { k: "history", label: "Histórico" },
    { k: "settings", label: "Configurações" },
  ]},
];

const APP_SCREENS = new Set(["dashboard","leaderboard","achievements","friends","profile","history","settings"]);
const HIDE_NAV = new Set(["landing","auth","onboarding","placement","history","settings"]);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Initial screen: if not authed, start at landing; else dashboard
  const initialScreen = (window.__iaAuth && window.__iaAuth.student) ? "dashboard" : "landing";
  const [screen, setScreen] = React.useState(initialScreen);
  const [, forceRerender] = React.useState(0);

  // Re-render when bridge updates auth state (window.__iaAuth)
  React.useEffect(() => {
    const handler = () => forceRerender((n) => n + 1);
    window.addEventListener("ia-auth-changed", handler);
    return () => window.removeEventListener("ia-auth-changed", handler);
  }, []);

  const go = React.useCallback((s) => {
    const target = document.querySelector(".ia-screen");
    if (target) target.scrollTop = 0;
    setScreen(s);
  }, []);

  // Render screen
  const renderScreen = () => {
    const props = { go, t };
    switch (screen) {
      case "landing": return <ScreenLanding {...props} />;
      case "auth": return <ScreenAuth {...props} />;
      case "onboarding": return <ScreenOnboarding {...props} />;
      case "placement": return <ScreenPlacement {...props} />;
      case "dashboard": return <ScreenDashboard {...props} />;
      case "profile": return <ScreenProfile {...props} />;
      case "achievements": return <ScreenAchievements {...props} />;
      case "friends": return <ScreenFriends {...props} />;
      case "leaderboard": return <ScreenLeaderboard {...props} />;
      case "history": return <ScreenHistory {...props} />;
      case "settings": return <ScreenSettings {...props} />;
      default: return <ScreenDashboard {...props} />;
    }
  };

  // Decide if bottom nav shows
  const showNav = APP_SCREENS.has(screen) && !HIDE_NAV.has(screen);
  const activeTab = TABS.find(tab => tab.key === screen)?.key || null;

  // Apply vibe class
  React.useEffect(() => {
    document.documentElement.classList.toggle("vibe-serio", t.vibe === "serio");
  }, [t.vibe]);

  const isDev = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV);

  return (
    <div className={"app-canvas " + (t.vibe === "serio" ? "vibe-serio" : "")}>
      <div className="frame-wrap">
        <ResponsiveShell>
          {renderScreen()}
          {showNav && <BottomNav active={activeTab} onChange={go} />}
        </ResponsiveShell>
      </div>

      {isDev && (
      <TweaksPanel>
        <TweakSection label="Variações" />
        <TweakRadio label="Layout do dashboard"
          value={t.dashLayout}
          options={[
            { value: "cards", label: "Cards" },
            { value: "rows", label: "Linhas" },
            { value: "game", label: "Jogo" },
          ]}
          onChange={(v) => { setTweak('dashLayout', v); go("dashboard"); }} />
        <TweakRadio label="Visual do streak"
          value={t.streakViz}
          options={[
            { value: "flame", label: "Chama" },
            { value: "chart", label: "Gráfico" },
            { value: "calendar", label: "Calend." },
          ]}
          onChange={(v) => setTweak('streakViz', v)} />
        <TweakRadio label="Visual conquistas"
          value={t.achVisual}
          options={[
            { value: "cards", label: "Cards" },
            { value: "medals", label: "Medalhas" },
            { value: "shelf", label: "Prateleira" },
          ]}
          onChange={(v) => { setTweak('achVisual', v); go("achievements"); }} />
        <TweakSection label="Tom geral" />
        <TweakRadio label="Vibe"
          value={t.vibe}
          options={[
            { value: "ludico", label: "Lúdico" },
            { value: "serio", label: "Sério" },
          ]}
          onChange={(v) => setTweak('vibe', v)} />
        <TweakSection label="Pular para" />
        {SCREEN_GROUPS.flatMap(g => g.screens).map(s => (
          <TweakButton key={s.k}
            label={(screen === s.k ? "→ " : "  ") + s.label}
            onClick={() => go(s.k)}
            secondary={screen !== s.k}
          />
        ))}
      </TweaksPanel>
      )}
    </div>
  );
}

// Responsive shell: stretches to viewport on mobile, framed (max-width) on desktop.
function ResponsiveShell({ children }) {
  return (
    <div className="ia-shell">
      <div className="ia-app">
        {children}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// iPhone shell — uses IOSDevice but replaces inner with absolute layer
// ────────────────────────────────────────────────
function IPhoneShell({ children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48,
      background: "#000", padding: 0,
      position: "relative", overflow: "hidden",
      boxShadow: "0 30px 60px rgba(21,16,46,0.18), 0 0 0 12px #1a1a1a, 0 0 0 13px #2a2a2a",
    }}>
      {/* Dynamic island */}
      <div style={{
        position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)",
        width: 120, height: 35, borderRadius: 22, background: "#000", zIndex: 100,
      }} />
      {/* status bar overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 60,
        padding: "16px 28px 0", display: "flex", justifyContent: "space-between",
        fontFamily: "-apple-system, system-ui", fontWeight: 600, fontSize: 15,
        color: "var(--ink)",
        pointerEvents: "none",
      }}>
        <span>9:41</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4.5" y="5" width="3" height="6" rx="0.6"/><rect x="9" y="3" width="3" height="8" rx="0.6"/><rect x="13.5" y="0" width="3" height="11" rx="0.6"/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
            <path d="M7 3a6 6 0 014 1.5l1-1A8 8 0 002 4.5l1 1A6 6 0 017 3z" fill="currentColor"/>
            <path d="M7 6a3 3 0 012 1l1-1a5 5 0 00-6 0l1 1a3 3 0 012-1z" fill="currentColor"/>
            <circle cx="7" cy="9" r="1.2" fill="currentColor"/>
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
            <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
            <rect x="2" y="2" width="18" height="7" rx="1.5" fill="currentColor"/>
            <rect x="22.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.5"/>
          </svg>
        </span>
      </div>
      {/* Home indicator */}
      <div style={{
        position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
        width: 134, height: 5, borderRadius: 100, background: "rgba(0,0,0,0.3)", zIndex: 100,
      }} />
      {/* App content area */}
      <div className="ia-app">
        <div className="ia-status-pad" />
        {children}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Screen jump sidebar (dev/preview aid)
// ────────────────────────────────────────────────
function ScreenJump({ current, onPick }) {
  return (
    <div className="screen-jump">
      <h4>Telas</h4>
      {SCREEN_GROUPS.map(g => (
        <div key={g.label}>
          <div className="sj-sect">{g.label}</div>
          {g.screens.map(s => (
            <button key={s.k}
              className={current === s.k ? "active" : ""}
              onClick={() => onPick(s.k)}>
              <span className="sj-dot" />
              {s.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Expose to bridge — main.tsx mounts the React tree
Object.assign(window, { IAChatApp: App, ResponsiveShell, ScreenJump });

export {};
