import React, { useEffect, useMemo, useRef, useState } from "react";

// Jei nori viso puslapio perkrovimo po generavimo, pakeisk į true
const HARD_RELOAD_ON_GENERATE_DONE = false;

/**
 * Workouts.js – savarankiškas, vieno failo komponentas
 * ---------------------------------------------------
 * Tikslas: po "Generate" paspaudimo AUTOMATIŠKAI atsinaujinti planų sąrašą,
 * kai tik backendas baigia generuoti planą (be puslapio perkrovimo).
 *
 * Priklausomybės: tik React. Jokio i18n, next-auth ar UI bibliotekų –
 * kad būtų galima nukopijuoti į „tuščią aplanką“.
 *
 * API endpoint’ai (pakeisk pagal savo realius):
 *  - POST  /api/generate-workout    → pradeda generuoti planą; gali grąžinti { plan }
 *  - GET   /api/archive-plans       → grąžina { plans: [...] } (naujausi viršuje arba apačioje – nesvarbu)
 *  - GET   /api/last-workout        → (nebūtina) metrikoms atnaujinti { stats }
 *
 * „Polling“ logika:
 *  1) Paspaudus Generate, išsisaugom dabartinį naujausio plano laiką (createdAt) – newestBefore.
 *  2) Jei /api/generate-workout NEgrąžino naujo plano, paleidžiam kas 2 s tikrinti /api/archive-plans
 *     kol atsiras įrašas su createdAt > newestBefore (max 2 min). Tada sustabdom „polling“,
 *     įkeliame naują planą į būseną ir parenkam jį automatiškai.
 */

// ---------- Pagalbiniai įrankiai ----------

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  // Bandome JSON – net ir esant klaidai backend dažnai grąžina JSON
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // paliekam null – be JSON
  }
  if (!res.ok) {
    const msg = body?.error || body?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

function toTime(value) {
  const d = value ? new Date(value) : null;
  const t = d?.getTime?.() ?? NaN;
  return Number.isFinite(t) ? t : 0;
}

function newestCreatedAt(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return 0;
  // Ieškome max createdAt (jei nėra – bandome updatedAt)
  return plans.reduce((mx, p) => Math.max(mx, toTime(p?.createdAt) || toTime(p?.updatedAt)), 0);
}

function sortByCreatedDesc(list) {
  return (list || [])
    .slice()
    .sort((a, b) => (toTime(b?.createdAt) || toTime(b?.updatedAt)) - (toTime(a?.createdAt) || toTime(a?.updatedAt)));
}

function fmtDate(value) {
  const t = toTime(value);
  if (!t) return "—";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return String(value ?? "—");
  }
}

// Mažas trijų taškų loader’is
function DotLoader({ active }) {
  return (
    <span className="dot-loader" aria-hidden>
      <span className={active ? "dot d1 on" : "dot d1"} />
      <span className={active ? "dot d2 on" : "dot d2"} />
      <span className={active ? "dot d3 on" : "dot d3"} />
      <style>{`
        .dot-loader { display:inline-flex; gap:6px; align-items:center; }
        .dot { width:6px; height:6px; border-radius:50%; background: currentColor; opacity:.35; }
        @keyframes pulse { 0%{opacity:.2} 50%{opacity:1} 100%{opacity:.2} }
        .on.d1 { animation: pulse 900ms ease-in-out infinite; animation-delay: 0ms; }
        .on.d2 { animation: pulse 900ms ease-in-out infinite; animation-delay: 150ms; }
        .on.d3 { animation: pulse 900ms ease-in-out infinite; animation-delay: 300ms; }
      `}</style>
    </span>
  );
}

export default function Workouts() {
  // ---------- Būsenos ----------
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, calories: 0 });

  const pollRef = useRef(null);

  // Stebime, kada animacija baigiasi (loadingGenerate -> false)
  const prevLoadingRef = useRef(false);
  const lastGenerateOkRef = useRef(false);

  // ---------- Inicialus planų užkrovimas ----------
  useEffect(() => {
    refreshPlans();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Kai tik animacija baigiasi (loadingGenerate nuo true -> false), atnaujinam sąrašą arba perkraunam puslapį
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !loadingGenerate) {
      if (lastGenerateOkRef.current) {
        if (HARD_RELOAD_ON_GENERATE_DONE) {
          try { window.location.reload(); } catch (_) {}
        } else {
          // „Soft“ refresh – persikraunam planų sąrašą ir automatiškai parenkam naujausią
          refreshPlans().then((list) => {
            if (Array.isArray(list) && list.length > 0) {
              setSelected(list[0]);
            }
          });
        }
      }
    }
    prevLoadingRef.current = loadingGenerate;
  }, [loadingGenerate]);

// ---------- Pagalbinės funkcijos ----------
  const refreshPlans = async () => {
    try {
      setError("");
      const data = await fetchJSON("/api/archive-plans");
      const list = Array.isArray(data?.plans) ? data.plans : [];
      const sorted = sortByCreatedDesc(list);
      setPlans(sorted);
      // Jei niekas neparinkta – parenkam naujausią
      setSelected((prev) => prev ?? sorted[0] ?? null);
      return sorted;
    } catch (e) {
      setPlans([]);
      setSelected(null);
      setError(e?.message || "Nepavyko įkelti planų.");
      return [];
    }
  };

  const refreshStats = async () => {
    try {
      const s = await fetchJSON("/api/last-workout");
      setStats(s?.stats || { totalWorkouts: 0, totalTime: 0, calories: 0 });
    } catch {
      /* optional */
    }
  };

  // ---------- Pagrindinė – Generate + Polling ----------
  const handleGenerate = async () => {
    if (loadingGenerate) return;
    setLoadingGenerate(true);
    setError("");

    // Fiksuojam kas buvo iki dabar – pagal tai spręsim, ar atsirado NAUJAS
    const beforeTs = newestCreatedAt(plans);

    try {
      const data = await fetchJSON("/api/generate-workout", { method: "POST" });

      // 1) Jei backendas iškart grąžino planą – super, integruojam be „polling“
      if (data?.plan?.id) {
        const next = sortByCreatedDesc([data.plan, ...plans]);
        setPlans(next);
        setSelected(next[0] || data.plan);
        lastGenerateOkRef.current = true;
        setLoadingGenerate(false);
        refreshStats();
        return;
      }

      // 2) Kitaip – paleidžiam „polling“ kol atsiras NAUJAS įrašas
      if (pollRef.current) clearInterval(pollRef.current);
      const deadline = Date.now() + 2 * 60 * 1000; // max 2 min

      pollRef.current = setInterval(async () => {
        const latest = await refreshPlans();
        const nowTs = newestCreatedAt(latest);
        const hasNew = nowTs > beforeTs;

        if (hasNew) {
          lastGenerateOkRef.current = true;
          clearInterval(pollRef.current);
          pollRef.current = null;
          setLoadingGenerate(false);
          setSelected(latest[0] || null); // automatiškai parenkam naujausią
          refreshStats();
        } else if (Date.now() > deadline) {
          lastGenerateOkRef.current = false;
          clearInterval(pollRef.current);
          pollRef.current = null;
          setLoadingGenerate(false);
          // Gal planas dar generuojamas – naudotojui paliekam sprendimą
        }
      }, 2000);
    } catch (e) {
      setLoadingGenerate(false);
      lastGenerateOkRef.current = false;
      setError(e?.message || "Nepavyko sugeneruoti plano.");
    }
  };

  const hasPlans = plans?.length > 0;

  // ---------- UI ----------
  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Workout Plans</h1>
          <p style={styles.subtitle}>Automatinis atsinaujinimas vos tik planas paruoštas.</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={refreshPlans} style={styles.ghostBtn} aria-label="Refresh plans">
            ↻ Refresh
          </button>
          <button onClick={handleGenerate} style={styles.primaryBtn} disabled={loadingGenerate}>
            {loadingGenerate ? (
              <>
                Generuojama&nbsp;<DotLoader active={true} />
              </>
            ) : (
              "Generate plan"
            )}
          </button>
        </div>
      </header>

      {error ? (
        <div style={styles.errorBox} role="alert">{error}</div>
      ) : null}

      <section style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>Planų sąrašas</h2>
            <span style={styles.count}>{plans.length}</span>
          </div>

          {!hasPlans ? (
            <div style={styles.empty}>
              <p>Planų nėra. Paspausk „Generate plan“.</p>
            </div>
          ) : (
            <ul style={styles.list}>
              {plans.map((p) => {
                const isActive = selected?.id === p?.id;
                const label = p?.title || p?.name || `Plan #${p?.id ?? "—"}`;
                return (
                  <li key={p?.id ?? `${toTime(p?.createdAt)}-${Math.random()}`}
                      onClick={() => setSelected(p)}
                      style={isActive ? { ...styles.item, ...styles.itemActive } : styles.item}
                      title={label}>
                    <div style={styles.itemTitle}>{label}</div>
                    <div style={styles.itemMeta}>
                      <span>{fmtDate(p?.createdAt || p?.updatedAt)}</span>
                      {p?.id ? <span style={styles.badge}>ID: {p.id}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main style={styles.main}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>Plano informacija</h2>
          </div>

          {!selected ? (
            <div style={styles.empty}><p>Pasirink planą iš kairės.</p></div>
          ) : (
            <div style={styles.card}>
              <div style={styles.rowBetween}>
                <h3 style={styles.h3}>{selected?.title || selected?.name || `Plan #${selected?.id ?? "—"}`}</h3>
                <span style={styles.dim}>{fmtDate(selected?.createdAt || selected?.updatedAt)}</span>
              </div>

              {/* Greita metrika (pasirinktinai iš /api/last-workout) */}
              <div style={styles.kpisWrap}>
                <KPI label="Total workouts" value={stats?.totalWorkouts ?? 0} />
                <KPI label="Total time (min)" value={stats?.totalTime ?? 0} />
                <KPI label="Calories" value={stats?.calories ?? 0} />
              </div>

              {/* Pateikiam struktūrą – prisitaiko prie bet kokio plano formato */}
              <div style={styles.jsonBox}>
                <pre style={styles.pre}>{JSON.stringify(selected, null, 2)}</pre>
              </div>
            </div>
          )}
        </main>
      </section>

      {/* Minimalistinis stilius */}
      <style>{globalCSS}</style>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiValue}>{String(value)}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  );
}

// ---------- Stiliai ----------
const styles = {
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 24, margin: 0 },
  subtitle: { margin: "6px 0 0", opacity: 0.7, fontSize: 14 },
  headerActions: { display: "flex", gap: 8 },
  primaryBtn: {
    appearance: "none",
    background: "#2563eb",
    color: "white",
    border: 0,
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  ghostBtn: {
    appearance: "none",
    background: "transparent",
    color: "#2563eb",
    border: "1px solid #c7d2fe",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: 12,
    borderRadius: 12,
    margin: "8px 0 16px",
    fontSize: 14,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 360px) 1fr",
    gap: 16,
  },
  sidebar: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    minHeight: 400,
  },
  main: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    minHeight: 400,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  h2: { fontSize: 16, margin: 0 },
  h3: { fontSize: 18, margin: "0 0 6px" },
  count: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  item: {
    border: "1px solid #e2e8f0",
    padding: 10,
    borderRadius: 12,
    cursor: "pointer",
    background: "white",
  },
  itemActive: {
    borderColor: "#c7d2fe",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
  },
  itemTitle: { fontWeight: 700, fontSize: 14, marginBottom: 4 },
  itemMeta: { display: "flex", gap: 8, alignItems: "center", fontSize: 12, opacity: 0.7 },
  badge: { background: "#f1f5f9", borderRadius: 999, padding: "2px 6px" },
  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    minHeight: 120,
    display: "grid",
    placeItems: "center",
    color: "#475569",
    fontSize: 14,
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
  },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  dim: { opacity: 0.7, fontSize: 13 },
  kpisWrap: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 6 },
  kpi: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
  },
  kpiValue: { fontSize: 20, fontWeight: 800 },
  kpiLabel: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  jsonBox: {
    marginTop: 12,
    background: "#0b1020",
    color: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #111827",
  },
  pre: {
    margin: 0,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.55,
    overflowX: "auto",
    tabSize: 2,
  },
};

const globalCSS = `
  :root { color-scheme: light; }
  html, body, #root { height: 100%; }
  * { box-sizing: border-box; }
`;
