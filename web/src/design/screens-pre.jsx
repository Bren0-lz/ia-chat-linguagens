// screens-pre.jsx — Landing, Auth, Onboarding, Placement test
// Pre-authenticated flow (also re-enterable from settings).

// ────────────────────────────────────────────────
// LANDING — marketing hero (mobile)
// ────────────────────────────────────────────────
function ScreenLanding({ go }) {
  return (
    <div className="ia-screen" style={{ background: "var(--paper)" }}>
      {/* hero block */}
      <div style={{ padding: "32px 24px 24px", position: "relative", overflow: "hidden" }}>
        {/* decorative shapes */}
        <div style={{
          position: "absolute", top: -40, right: -60, width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, var(--brand-soft), transparent 70%)", opacity: 0.9,
        }} />
        <div style={{
          position: "absolute", top: 60, right: 12, width: 64, height: 64, borderRadius: 20,
          background: "var(--gold)", transform: "rotate(18deg)",
          boxShadow: "0 8px 18px rgba(217,147,10,0.3)",
        }} />
        <div style={{
          position: "absolute", top: 130, right: 60, width: 28, height: 28, borderRadius: "50%",
          background: "var(--mint)", boxShadow: "0 4px 10px rgba(16,150,86,0.3)",
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 50 }}>
            <Logo size={36} />
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
              letterSpacing: "0.04em", color: "var(--ink)",
            }}>IA CHAT</span>
          </div>

          <div className="chip" style={{ marginBottom: 16, background: "var(--mint-soft)", color: "var(--mint-deep)", border: "1px solid var(--mint)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)" }} />
            Funciona direto no Telegram
          </div>

          <h1 className="h-display" style={{ fontSize: 40, margin: 0, color: "var(--ink)" }}>
            Aprenda inglês <span style={{
              background: "linear-gradient(90deg, var(--brand) 30%, var(--violet))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>conversando</span> com IA.
          </h1>

          <p style={{
            margin: "16px 0 24px", fontSize: 15.5, lineHeight: 1.55,
            color: "var(--ink-soft)", maxWidth: 320,
          }}>
            Sem decoreba. Você conversa em tempo real com nosso bot no Telegram, faz exercícios curtos e vê seu progresso aqui no painel.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => go("onboarding")}
              style={{ width: "100%", height: 54, fontSize: 16 }}>
              Começar grátis
              {I.arrowRight(18)}
            </button>
            <button className="btn btn-secondary" onClick={() => go("auth")}
              style={{ width: "100%", height: 50 }}>
              Já tenho conta
            </button>
          </div>
        </div>
      </div>

      {/* how it works */}
      <div style={{ padding: "24px 24px 8px" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Como funciona</div>
        <h2 className="h-section" style={{ fontSize: 22, margin: "0 0 16px" }}>
          Três passos para começar
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { n: 1, icon: I.telegram(22, "white"), bg: "var(--telegram)", title: "Conecte o Telegram", body: "Em 10 segundos. Sem instalar nada." },
            { n: 2, icon: I.pencil(22), bg: "var(--brand)", title: "Faça o nivelamento", body: "10 perguntas para descobrir seu nível CEFR." },
            { n: 3, icon: I.flame(22, "white"), bg: "var(--flame)", title: "Pratique 10 min/dia", body: "Mantenha o streak e suba de liga." },
          ].map(s => (
            <div key={s.n} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: s.bg, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{s.body}</div>
              </div>
              <div style={{
                marginLeft: "auto", fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 28, color: "var(--ink-faint)", paddingRight: 4,
              }}>0{s.n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* hub preview teaser */}
      <div style={{ padding: "28px 24px 40px" }}>
        <div style={{
          background: "var(--surface-ink)", color: "white",
          borderRadius: 24, padding: 22, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(91,71,255,0.4), transparent 70%)",
          }} />
          <div style={{ position: "relative" }}>
            <div className="eyebrow" style={{ color: "var(--brand-soft)", marginBottom: 6 }}>
              O painel
            </div>
            <h3 className="h-section" style={{ fontSize: 22, margin: "0 0 8px", color: "white" }}>
              Veja seu progresso em tempo real
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>
              Streak, conquistas, ranking entre amigos, histórico — tudo aqui.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {["Streak", "XP", "Conquistas", "Amigos", "Liga"].map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 600,
                  background: "rgba(255,255,255,0.1)", color: "white",
                  padding: "4px 10px", borderRadius: 999,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// IA CHAT logo: speech bubble + brain-like wave dot
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 14a8 8 0 018-8h20a8 8 0 018 8v14a8 8 0 01-8 8h-9l-7 6v-6h-4a8 8 0 01-8-8V14z"
        fill="var(--brand)"/>
      <circle cx="16" cy="21" r="2.6" fill="white"/>
      <circle cx="24" cy="21" r="2.6" fill="var(--gold)"/>
      <circle cx="32" cy="21" r="2.6" fill="white"/>
    </svg>
  );
}

// ────────────────────────────────────────────────
// AUTH — Login / Cadastro toggle
// ────────────────────────────────────────────────
function ScreenAuth({ go }) {
  const [mode, setMode] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const tgMountRef = React.useRef(null);

  // Mount the real Telegram Login Widget. On auth, redirect to /api/auth/telegram
  // which validates the hash and sets the JWT cookie.
  React.useEffect(() => {
    const botName = import.meta.env && import.meta.env.VITE_TELEGRAM_BOT_NAME;
    if (!botName || !tgMountRef.current) return;
    window.TelegramLoginCallback = (user) => {
      const params = new URLSearchParams();
      Object.keys(user || {}).forEach((k) => params.set(k, String(user[k])));
      window.location.href = "/api/auth/telegram?" + params.toString();
    };
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "14");
    script.setAttribute("data-onauth", "TelegramLoginCallback(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    const node = tgMountRef.current;
    node.appendChild(script);
    return () => {
      if (node.contains(script)) node.removeChild(script);
      delete window.TelegramLoginCallback;
    };
  }, []);

  return (
    <div className="ia-screen" style={{ background: "var(--paper)", padding: "24px 24px 40px" }}>
      <button onClick={() => go("landing")} style={{
        width: 38, height: 38, borderRadius: 12,
        border: "1px solid var(--line)", background: "var(--surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink)", cursor: "pointer", marginBottom: 20,
      }}>{I.arrowLeft(18)}</button>

      <Logo size={44} />

      <h1 className="h-display" style={{ fontSize: 32, margin: "20px 0 6px" }}>
        {mode === "login" ? "Bem-vindo de volta!" : "Vamos criar sua conta"}
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-soft)" }}>
        {mode === "login" ? "Entre para continuar de onde parou." : "Em 30 segundos você já está praticando."}
      </p>

      {/* Telegram primary — real widget mounts here when VITE_TELEGRAM_BOT_NAME is set */}
      <div ref={tgMountRef} style={{ display: "flex", justifyContent: "center", marginBottom: 14 }} />
      {/* Fallback button when the widget cannot mount (e.g. missing bot name in dev) */}
      <button className="btn btn-telegram" onClick={() => go("onboarding")}
        style={{ width: "100%", height: 54, marginBottom: 14 }}>
        {I.telegram(20)}
        {mode === "login" ? "Entrar com Telegram" : "Continuar com Telegram"}
      </button>

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        color: "var(--ink-muted)", fontSize: 12, fontWeight: 600,
        margin: "8px 0 18px",
      }}>
        <div style={{ flex: 1, height: 1, background: "var(--line-strong)" }} />
        OU COM E-MAIL
        <div style={{ flex: 1, height: 1, background: "var(--line-strong)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {mode === "signup" && (
          <Field label="Nome" placeholder="Como podemos te chamar?" />
        )}
        <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
        <Field label="Senha" type="password" value={pass} onChange={setPass} placeholder="Mínimo 8 caracteres" />
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: -4 }}>
            <a href="#" onClick={e => e.preventDefault()} style={{
              fontSize: 13, color: "var(--brand)", fontWeight: 600, textDecoration: "none",
            }}>Esqueci a senha</a>
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={() => go(mode === "login" ? "dashboard" : "onboarding")}
        style={{ width: "100%", height: 54 }}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </button>

      <div style={{
        marginTop: 24, textAlign: "center", fontSize: 13.5, color: "var(--ink-soft)",
      }}>
        {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
        <a href="#" onClick={e => { e.preventDefault(); setMode(mode === "login" ? "signup" : "login"); }}
          style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
          {mode === "login" ? "Cadastre-se" : "Entrar"}
        </a>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value = "", onChange = () => {}, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6, letterSpacing: 0.2 }}>
        {label}
      </div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", height: 50, padding: "0 16px",
          border: "1.5px solid var(--line-strong)", borderRadius: 14,
          background: "var(--surface)", fontSize: 15, color: "var(--ink)",
          fontFamily: "var(--font-sans)", outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = "var(--brand)"}
        onBlur={e => e.target.style.borderColor = "var(--line-strong)"}
      />
    </label>
  );
}

// ────────────────────────────────────────────────
// ONBOARDING — 4 steps (welcome → language → telegram → goal)
// ────────────────────────────────────────────────
function ScreenOnboarding({ go }) {
  const [step, setStep] = React.useState(0);
  const [lang, setLang] = React.useState("en");
  const [goal, setGoal] = React.useState(10);
  const steps = ["Boas-vindas", "Idioma", "Telegram", "Meta diária"];

  return (
    <div className="ia-screen" style={{ background: "var(--paper)", display: "flex", flexDirection: "column", padding: "24px 24px 24px" }}>
      {/* progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i <= step ? "var(--brand)" : "var(--brand-soft)",
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      <div style={{ flex: 1 }}>
        {step === 0 && <OnbWelcome />}
        {step === 1 && <OnbLang value={lang} onChange={setLang} />}
        {step === 2 && <OnbTelegram />}
        {step === 3 && <OnbGoal value={goal} onChange={setGoal} />}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)}
            style={{ flex: "0 0 auto", padding: "14px 20px" }}>
            {I.arrowLeft(18)}
          </button>
        )}
        <button className="btn btn-primary" onClick={() => {
          if (step < steps.length - 1) { setStep(step + 1); return; }
          // Finishing onboarding — persist mode (idioma + meta) if authenticated
          const auth = window.__iaAuth;
          if (auth && auth.student) {
            fetch("/api/profile/me", {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: `${lang}-goal${goal}` }),
            }).then(() => auth.refetch && auth.refetch()).catch(() => {});
          }
          go("placement");
        }} style={{ flex: 1, height: 54 }}>
          {step === steps.length - 1 ? "Fazer nivelamento" : "Continuar"}
          {I.arrowRight(18)}
        </button>
      </div>
    </div>
  );
}

function OnbWelcome() {
  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{
        width: 96, height: 96, borderRadius: 28,
        background: "linear-gradient(135deg, var(--brand), var(--violet))",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28, boxShadow: "0 10px 30px rgba(91,71,255,0.3)",
        color: "white",
      }}>
        {I.chat(48)}
      </div>
      <h1 className="h-display" style={{ fontSize: 34, margin: "0 0 12px" }}>
        Que bom ter você aqui!
      </h1>
      <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>
        Vamos configurar tudo em <strong style={{ color: "var(--ink)" }}>menos de 2 minutos</strong>:
        seu idioma, conectar o Telegram e descobrir seu nível atual.
      </p>
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          ["🌍", "Escolha seu idioma"],
          ["💬", "Conecte com o Telegram"],
          ["🎯", "Defina sua meta diária"],
        ].map(([emoji, text]) => (
          <div key={text} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 14px", background: "var(--surface)",
            borderRadius: 16, border: "1px solid var(--line)",
          }}>
            <div style={{ fontSize: 22 }}>{emoji}</div>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnbLang({ value, onChange }) {
  const langs = [
    { code: "en", flag: "🇺🇸", name: "Inglês", sub: "Disponível agora", available: true },
    { code: "es", flag: "🇪🇸", name: "Espanhol", sub: "Em breve", available: false },
    { code: "fr", flag: "🇫🇷", name: "Francês", sub: "Em breve", available: false },
    { code: "it", flag: "🇮🇹", name: "Italiano", sub: "Em breve", available: false },
    { code: "de", flag: "🇩🇪", name: "Alemão", sub: "Em breve", available: false },
  ];
  return (
    <div style={{ paddingTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Passo 2 de 4</div>
      <h2 className="h-section" style={{ fontSize: 28, margin: "0 0 8px" }}>
        Qual idioma você quer aprender?
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 22px" }}>
        Começamos com o inglês. Outros idiomas chegam em breve.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {langs.map(l => {
          const sel = value === l.code;
          return (
            <button key={l.code}
              onClick={() => l.available && onChange(l.code)}
              disabled={!l.available}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px",
                background: sel ? "var(--brand-soft)" : "var(--surface)",
                border: `2px solid ${sel ? "var(--brand)" : "var(--line)"}`,
                borderRadius: 16, cursor: l.available ? "pointer" : "not-allowed",
                opacity: l.available ? 1 : 0.5,
                textAlign: "left", width: "100%",
                fontFamily: "var(--font-sans)",
                transition: "all 0.12s",
              }}>
              <div style={{ fontSize: 28 }}>{l.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{l.name}</div>
                <div style={{ fontSize: 12, color: l.available ? "var(--mint-deep)" : "var(--ink-muted)" }}>
                  {l.sub}
                </div>
              </div>
              {sel && (
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", background: "var(--brand)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{I.check(15)}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OnbTelegram() {
  return (
    <div style={{ paddingTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Passo 3 de 4</div>
      <h2 className="h-section" style={{ fontSize: 28, margin: "0 0 8px" }}>
        Conecte com o Telegram
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 22px" }}>
        Toda a prática acontece lá. Você usa o painel para acompanhar.
      </p>

      <div style={{
        background: "var(--telegram-soft)", border: "1.5px solid var(--telegram)",
        borderRadius: 24, padding: 22, marginBottom: 16, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: "var(--telegram)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          boxShadow: "0 8px 20px rgba(34,158,217,0.3)",
        }}>{I.telegram(34, "white")}</div>

        {/* QR placeholder */}
        <div style={{
          width: 160, height: 160, margin: "10px auto", background: "white",
          borderRadius: 18, padding: 14, position: "relative",
        }}>
          <FakeQR />
        </div>

        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          Aponte a câmera ou abra no app
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
          @iachat_bot
        </div>
      </div>

      <button className="btn btn-telegram" style={{ width: "100%", height: 50, marginBottom: 8 }}>
        {I.telegram(18)} Abrir no Telegram
      </button>
      <button className="btn-ghost" style={{ width: "100%", padding: 10, fontWeight: 600 }}>
        Já conectei →
      </button>
    </div>
  );
}

function FakeQR() {
  // Generate a pseudo-random QR pattern (just for hi-fi look)
  const cells = 21;
  const seed = (x, y) => ((x * 19 + y * 31 + x * y) % 7) < 3;
  const corner = (cx, cy) => (
    <g>
      <rect x={cx} y={cy} width={7} height={7} fill="black"/>
      <rect x={cx + 1} y={cy + 1} width={5} height={5} fill="white"/>
      <rect x={cx + 2} y={cy + 2} width={3} height={3} fill="black"/>
    </g>
  );
  return (
    <svg viewBox="0 0 21 21" width="100%" height="100%">
      {Array.from({ length: cells }).map((_, x) =>
        Array.from({ length: cells }).map((_, y) => {
          // skip corner finder positions
          if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return null;
          if (Math.abs(x - 10) < 2 && Math.abs(y - 10) < 2) return null;
          return seed(x, y) ? <rect key={x+","+y} x={x} y={y} width={1} height={1} fill="black"/> : null;
        })
      )}
      {corner(0, 0)}
      {corner(14, 0)}
      {corner(0, 14)}
      {/* center logo */}
      <rect x="8" y="8" width="5" height="5" fill="white"/>
      <rect x="9" y="9" width="3" height="3" rx="0.5" fill="var(--brand)"/>
    </svg>
  );
}

function OnbGoal({ value, onChange }) {
  const goals = [
    { v: 5, label: "Casual", desc: "5 min/dia", emoji: "🌱" },
    { v: 10, label: "Regular", desc: "10 min/dia", emoji: "💪" },
    { v: 20, label: "Sério", desc: "20 min/dia", emoji: "🔥" },
    { v: 30, label: "Intenso", desc: "30 min/dia", emoji: "🚀" },
  ];
  return (
    <div style={{ paddingTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Passo 4 de 4</div>
      <h2 className="h-section" style={{ fontSize: 28, margin: "0 0 8px" }}>
        Qual sua meta diária?
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 22px" }}>
        Dá pra ajustar depois. O importante é manter o streak.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {goals.map(g => {
          const sel = value === g.v;
          return (
            <button key={g.v} onClick={() => onChange(g.v)}
              style={{
                padding: "20px 14px",
                background: sel ? "var(--brand-soft)" : "var(--surface)",
                border: `2px solid ${sel ? "var(--brand)" : "var(--line)"}`,
                borderRadius: 18, cursor: "pointer",
                fontFamily: "var(--font-sans)", textAlign: "left",
              }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{g.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{g.label}</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{g.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// PLACEMENT TEST — multiple choice with progress
// ────────────────────────────────────────────────
const PLACEMENT_QUESTIONS = [
  {
    type: "grammar", prompt: "Choose the correct form:",
    sentence: ["She ", "___", " coffee every morning."],
    options: ["drink", "drinks", "drinking", "is drink"],
    correct: 1, level: "A1",
  },
  {
    type: "vocab", prompt: "What does 'tiny' mean?",
    options: ["very small", "very large", "very fast", "very tired"],
    correct: 0, level: "A2",
  },
  {
    type: "grammar", prompt: "Pick the correct sentence:",
    options: [
      "I have been to Paris last year.",
      "I went to Paris last year.",
      "I am gone to Paris last year.",
      "I goes to Paris last year.",
    ],
    correct: 1, level: "B1",
  },
  {
    type: "vocab", prompt: "Which word fits best?",
    sentence: ["The deadline is tomorrow, so we need to ", "___", " our priorities."],
    options: ["fall", "shuffle", "reassess", "spell"],
    correct: 2, level: "B2",
  },
  {
    type: "grammar", prompt: "Choose the correct sentence:",
    options: [
      "Had I known earlier, I would call you.",
      "Had I known earlier, I would have called you.",
      "If I would have known earlier, I called you.",
      "I have known earlier, I would have called you.",
    ],
    correct: 1, level: "C1",
  },
];

function ScreenPlacement({ go }) {
  const [i, setI] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [answers, setAnswers] = React.useState([]);
  const [done, setDone] = React.useState(false);
  const q = PLACEMENT_QUESTIONS[i];

  if (done) return <PlacementResult go={go} answers={answers} />;

  const next = () => {
    if (picked == null) return;
    const newAnswers = [...answers, { picked, correct: q.correct, level: q.level }];
    setAnswers(newAnswers);
    if (i < PLACEMENT_QUESTIONS.length - 1) {
      setI(i + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="ia-screen" style={{ background: "var(--paper)", display: "flex", flexDirection: "column", padding: "20px 20px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => go("onboarding")} style={{
          width: 36, height: 36, borderRadius: 12, border: 0,
          background: "var(--surface)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{I.close(18)}</button>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--brand-soft)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${((i + 1) / PLACEMENT_QUESTIONS.length) * 100}%`,
            background: "linear-gradient(90deg, var(--brand), var(--violet))", transition: "width 0.3s",
          }} />
        </div>
        <div className="tabular" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>
          {i + 1}/{PLACEMENT_QUESTIONS.length}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 6, color: "var(--brand)" }}>
          {q.type === "grammar" ? "Gramática" : "Vocabulário"} · Nível {q.level}
        </div>
        <h2 className="h-section" style={{ fontSize: 24, margin: "0 0 16px" }}>
          {q.prompt}
        </h2>

        {q.sentence && (
          <div style={{
            background: "var(--surface-soft)", border: "1px solid var(--brand-soft)",
            borderRadius: 18, padding: 22, marginBottom: 20,
            fontSize: 20, lineHeight: 1.4, color: "var(--ink)",
            fontFamily: "var(--font-display)", fontWeight: 500,
          }}>
            {q.sentence[0]}
            <span style={{
              display: "inline-block", minWidth: 80, padding: "2px 14px",
              background: picked != null ? "var(--brand)" : "white",
              color: picked != null ? "white" : "transparent",
              borderRadius: 10, border: "2px dashed var(--brand)",
              margin: "0 4px", fontWeight: 700,
            }}>{picked != null ? q.options[picked] : "___"}</span>
            {q.sentence[2]}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, idx) => {
            const sel = picked === idx;
            return (
              <button key={idx} onClick={() => setPicked(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", textAlign: "left", width: "100%",
                  background: sel ? "var(--brand-soft)" : "var(--surface)",
                  border: `2px solid ${sel ? "var(--brand)" : "var(--line)"}`,
                  borderRadius: 16, cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600,
                  color: "var(--ink)", transition: "all 0.1s",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: sel ? "var(--brand)" : "var(--surface-soft)",
                  color: sel ? "white" : "var(--ink-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 13,
                  border: sel ? "0" : "1px solid var(--line)",
                  flexShrink: 0,
                }}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn btn-primary" disabled={picked == null} onClick={next}
        style={{
          width: "100%", height: 54, marginTop: 16,
          opacity: picked == null ? 0.5 : 1,
          cursor: picked == null ? "not-allowed" : "pointer",
        }}>
        {i === PLACEMENT_QUESTIONS.length - 1 ? "Ver resultado" : "Próxima"}
        {I.arrowRight(18)}
      </button>
    </div>
  );
}

function PlacementResult({ go, answers }) {
  // Calculate level — simple: count correct, map ranges
  const correct = answers.filter(a => a.picked === a.correct).length;
  const level = correct >= 5 ? "C1" : correct >= 4 ? "B2" : correct >= 3 ? "B1" : correct >= 2 ? "A2" : "A1";

  // Persist the level via PATCH /api/profile/me when the user is authenticated.
  React.useEffect(() => {
    const auth = window.__iaAuth;
    if (!auth || !auth.student) return;
    fetch("/api/profile/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    }).then(() => auth.refetch && auth.refetch()).catch(() => {});
  }, [level]);
  const levelDesc = {
    A1: "Iniciante", A2: "Básico", B1: "Intermediário",
    B2: "Intermediário avançado", C1: "Avançado", C2: "Proficiente",
  }[level];
  const colorMap = {
    A1: "var(--lv-a1)", A2: "var(--lv-a2)", B1: "var(--lv-b1)",
    B2: "var(--lv-b2)", C1: "var(--lv-c1)", C2: "var(--lv-c2)",
  };
  return (
    <div className="ia-screen" style={{ background: "var(--paper)", padding: "30px 24px 30px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, textAlign: "center", paddingTop: 28 }}>
        <div className="eyebrow" style={{ color: "var(--brand)", marginBottom: 10 }}>Resultado do nivelamento</div>
        <h1 className="h-display" style={{ fontSize: 32, margin: "0 0 28px" }}>
          Seu nível é
        </h1>

        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{
            width: 180, height: 180, borderRadius: "50%",
            background: `radial-gradient(circle, ${colorMap[level]}, ${colorMap[level]}cc)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 20px 40px ${colorMap[level]}55`,
            position: "relative",
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 80,
              color: "white", letterSpacing: "-0.05em",
            }}>{level}</span>
            <div style={{
              position: "absolute", top: -8, right: -8,
              background: "white", borderRadius: "50%", padding: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}>{I.star(20, "var(--gold)")}</div>
          </div>
          <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>
            {levelDesc}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
            {correct} de {PLACEMENT_QUESTIONS.length} respostas certas
          </div>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 18, padding: 18, textAlign: "left",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            ✨ O que isso significa
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
            Você {level.startsWith("A") ? "está começando a jornada — vamos focar em conversas do dia-a-dia." :
              level.startsWith("B") ? "já se vira em conversas — vamos refinar fluência e vocabulário." :
              "domina o idioma — vamos para nuances, idioms e situações complexas."}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => go("dashboard")} style={{ width: "100%", height: 54, marginTop: 20 }}>
        Ir para o painel
        {I.arrowRight(18)}
      </button>
    </div>
  );
}

Object.assign(window, {
  ScreenLanding, ScreenAuth, ScreenOnboarding, ScreenPlacement, Logo,
});

export {};
