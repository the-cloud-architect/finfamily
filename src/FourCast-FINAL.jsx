import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import { AnimatedTitle, ScrollTable } from "./components.jsx";
import { Charts } from "./Charts.jsx";
import { VariablesTablePart2Sections } from "./VariablesTablePart2.jsx";
import { fmt, calcCumulative, initData, calcMonthlyPayment } from "./utils.js";
import { YEARS, START_YEAR } from "./constants.js";

// --- Scenario payload normalization (prevents "white screen" on legacy/corrupt rows) ---
const DEFAULT_SECTIONS = {
  income: false,
  dependents: false,
  housing: false,
  expenses: false,
  cashflow: false,
  assets: false,
  liabilities: false,
  purchases: false,
  summary: false,
  ratios: false,
};

function _safeJsonParse(v) {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function _looksLikeForecastData(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const r0 = arr[0];
  if (!r0 || typeof r0 !== "object") return false;
  // Minimal shape check: if these exist, calcCumulative/render won't explode.
  return "year" in r0 && "age" in r0 && "cashIncome" in r0 && "stocksBonds" in r0;
}

function _normalizeSections(saved) {
  if (!saved || typeof saved !== "object") return { ...DEFAULT_SECTIONS };
  return { ...DEFAULT_SECTIONS, ...saved };
}

/**
 * Accepts multiple historical shapes:
 *  - array of rows (legacy)
 *  - { data: rows, age, spouseAge, retireAge, depAges, sections }
 *  - { data: { data: rows, ... } } (older wrapper)
 */
function normalizeScenarioPayload(raw) {
  const p = _safeJsonParse(raw);

  let dataArr = null;
  let age = 45;
  let spouseAge = 43;
  let retireAge = 65;
  let depAges = [10, 8, 5];
  let sections = null;

  if (Array.isArray(p)) {
    dataArr = p;
  } else if (p && typeof p === "object") {
    if (Array.isArray(p.data)) {
      dataArr = p.data;
    } else if (p.data && typeof p.data === "object" && Array.isArray(p.data.data)) {
      dataArr = p.data.data;
    }

    const src = p.data && typeof p.data === "object" && !Array.isArray(p.data) ? p.data : p;

    if (Array.isArray(src.depAges)) depAges = src.depAges;
    if (src.sections) sections = src.sections;

    // Prefer explicit fields, otherwise infer from year-0 row if available.
    age = Number(src.age ?? (dataArr?.[0]?.age ?? age));
    spouseAge = Number(src.spouseAge ?? (dataArr?.[0]?.spouseAge ?? spouseAge));
    retireAge = Number(src.retireAge ?? retireAge);
  }

  const ok = _looksLikeForecastData(dataArr);
  return {
    ok,
    data: ok ? dataArr : null,
    age,
    spouseAge,
    retireAge,
    depAges,
    sections: _normalizeSections(sections),
  };
}

export default function FourCast() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Scenario state
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarioName, setScenarioName] = useState("");
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [saving, setSaving] = useState(false);

  // App state
  const [age, setAge] = useState(45);
  const [spouseAge, setSpouseAge] = useState(43);
  const [retireAge, setRetireAge] = useState(65);
  const [depAges, setDepAges] = useState([10, 8, 5]);
  const [tab, setTab] = useState("variables");

  // Collapsible sections state
  const [sections, setSections] = useState(() => ({ ...DEFAULT_SECTIONS }));

  const [data, setData] = useState(() => initData(45, 43, [10, 8, 5], 65));

  // Undo history - stores previous data snapshots
  const [undoStack, setUndoStack] = useState([]);
  const MAX_UNDO = 50;

  // Wrap setData to push current state onto undo stack
  const setDataWithUndo = (newData) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(data))];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
    setData(newData);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setData(prev);
  };

  // Auth initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load scenarios when user changes
  useEffect(() => {
    if (user) loadScenariosFromDB();
  }, [user]);

  const enriched = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    try {
      return calcCumulative(data, retireAge);
    } catch (e) {
      console.error("calcCumulative failed (bad scenario data?)", e);
      return [];
    }
  }, [data, retireAge]);

  // IMPORTANT: never assume enriched.length === YEARS
  const firstEnriched = enriched[0] ?? null;
  const lastEnriched = enriched.length ? enriched[enriched.length - 1] : null;

  const retirementAnalysis = useMemo(() => {
    const retireYearIndex = retireAge - age;
    if (retireYearIndex < 0 || retireYearIndex >= enriched.length) {
      return { retireStartNetWorth: 0 };
    }
    return { retireStartNetWorth: enriched[retireYearIndex]?.netWorth || 0 };
  }, [enriched, retireAge, age]);

  const toggleSection = (sectionKey) => {
    setSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const updateAges = (newAge, newSpouseAge) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(data))];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
    setAge(newAge);
    setSpouseAge(newSpouseAge);
    setData(initData(newAge, newSpouseAge, depAges, retireAge));
  };

  const updateDepAge = (index, newAge) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(data))];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
    const newDepAges = [...depAges];
    newDepAges[index] = newAge;
    setDepAges(newDepAges);
    setData(initData(age, spouseAge, newDepAges, retireAge));
  };

  const updateDeps = (count) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(data))];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
    const newCount = Math.max(0, Math.min(10, count));
    const newDepAges = depAges.slice(0, newCount);
    while (newDepAges.length < newCount) newDepAges.push(10);
    setDepAges(newDepAges);
    setData(initData(age, spouseAge, newDepAges, retireAge));
  };

  const update = (yearIndex, key, value) => {
    const newData = [...data];
    newData[yearIndex] = { ...newData[yearIndex], [key]: value };
    setDataWithUndo(newData);
  };

  const updateYear0 = (key, value) => {
    const newData = [...data];
    newData[0] = { ...newData[0], [key]: value };

    const cascadeKeys = [
      "taxRate",
      "stockGrowthRate",
      "homeGrowthRate",
      "rentalGrowthRate",
      "retirement401kGrowthRate",
      "carDepreciation",
      "machineDepreciation",
      "expenseInflationRate",
      "homeTaxGrowthRate",
      "rentalTaxGrowthRate",
      "carMaintenanceRate",
      "helocRate",
    ];

    if (cascadeKeys.includes(key)) {
      for (let i = 1; i < newData.length; i++) {
        newData[i] = { ...newData[i], [key]: value };
      }
    }

    setDataWithUndo(newData);
  };

  const updateSingleYear = (yearIndex, key, value) => update(yearIndex, key, value);

  const updateHelocUsed = (yearIndex, value) => {
    const clamped = Math.min(value, data[yearIndex].helocLimit);
    const newData = [...data];
    for (let i = yearIndex; i < newData.length; i++) {
      newData[i] = { ...newData[i], helocUsed: Math.min(clamped, newData[i].helocLimit) };
    }
    setDataWithUndo(newData);
  };

  const updateMortgage = (yearIndex, principal, rate, years) => {
    const payment = calcMonthlyPayment(principal, rate, years) * 12;
    const newData = [...data];
    newData[yearIndex] = {
      ...newData[yearIndex],
      mortgageBalance: principal,
      mortgageRate: rate,
      mortgageYears: years,
      mortgagePayment: payment,
    };
    setDataWithUndo(newData);
  };

  const updateRentalMortgage = (yearIndex, principal, rate, years) => {
    const payment = calcMonthlyPayment(principal, rate, years) * 12;
    const newData = [...data];
    newData[yearIndex] = {
      ...newData[yearIndex],
      rentalMortgageBalance: principal,
      rentalMortgageRate: rate,
      rentalMortgageYears: years,
      rentalMortgagePayment: payment,
    };
    setDataWithUndo(newData);
  };

  const updateCarLoan = (yearIndex, principal, rate, years) => {
    const payment = calcMonthlyPayment(principal, rate, years) * 12;
    const newData = [...data];
    newData[yearIndex] = {
      ...newData[yearIndex],
      carLoanBalance: principal,
      carLoanRate: rate,
      carLoanYears: years,
      carLoanPayment: payment,
    };
    setDataWithUndo(newData);
  };

  const loadScenariosFromDB = async () => {
    setLoadingScenarios(true);
    try {
      const { data: scenarioData, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const transformed = (scenarioData || []).map((row) => {
        const payload = normalizeScenarioPayload(row.data);
        return {
          id: row.id,
          name: row.name,
          data: payload.data, // array or null
          age: payload.age,
          spouseAge: payload.spouseAge,
          retireAge: payload.retireAge,
          depAges: payload.depAges,
          sections: payload.sections,
          updated_at: row.updated_at,
          _isValid: payload.ok,
        };
      });

      setScenarios(transformed);

      // Auto-load most recent VALID scenario
      const firstValid = transformed.find((s) => s._isValid);
      if (firstValid) loadScenario(firstValid);
    } catch (e) {
      console.error("Error loading scenarios:", e);
      alert("Error loading scenarios: " + e.message);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const saveScenario = async () => {
    if (!scenarioName.trim()) return alert("Enter a scenario name");
    setSaving(true);
    try {
      const scenarioPayload = {
        data: JSON.parse(JSON.stringify(data)),
        age,
        spouseAge,
        retireAge,
        depAges,
        sections,
      };

      const existing = scenarios.find((s) => s.name === scenarioName);
      if (existing) {
        const { error } = await supabase
          .from("scenarios")
          .update({ data: scenarioPayload, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        setActiveScenarioId(existing.id);
      } else {
        const { data: newScenario, error } = await supabase
          .from("scenarios")
          .insert([{ user_id: user.id, name: scenarioName, data: scenarioPayload }])
          .select()
          .single();
        if (error) throw error;
        setActiveScenarioId(newScenario.id);
      }

      setActiveScenario(scenarioName);
      await loadScenariosFromDB();
    } catch (e) {
      console.error("Error saving scenario:", e);
      alert("Error saving scenario: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCurrentScenario = async () => {
    if (!activeScenarioId) return;
    setSaving(true);
    try {
      const scenarioPayload = {
        data: JSON.parse(JSON.stringify(data)),
        age,
        spouseAge,
        retireAge,
        depAges,
        sections,
      };

      const { error } = await supabase
        .from("scenarios")
        .update({ data: scenarioPayload, updated_at: new Date().toISOString() })
        .eq("id", activeScenarioId);

      if (error) throw error;
      await loadScenariosFromDB();
    } catch (e) {
      console.error("Error saving scenario:", e);
      alert("Error saving scenario: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForecast = (opts = {}) => {
    const nextAge = Number(opts.age ?? 45);
    const nextSpouseAge = Number(opts.spouseAge ?? 43);
    const nextRetireAge = Number(opts.retireAge ?? 65);
    const nextDepAges = Array.isArray(opts.depAges) ? opts.depAges : [10, 8, 5];

    setAge(nextAge);
    setSpouseAge(nextSpouseAge);
    setRetireAge(nextRetireAge);
    setDepAges(nextDepAges);
    setSections({ ...DEFAULT_SECTIONS });
    setData(initData(nextAge, nextSpouseAge, nextDepAges, nextRetireAge));
    setUndoStack([]);

    if (opts.clearScenarioSelection) {
      setActiveScenario(null);
      setActiveScenarioId(null);
      setScenarioName("");
    }
  };

  // KEY FIX: loadScenario normalizes length to YEARS by overlaying on fresh initData
  const loadScenario = (s) => {
    const payload = normalizeScenarioPayload(s?.data);
    const dataArr = Array.isArray(s?.data) ? s.data : payload.data;

    const nextAge = Number(s?.age ?? payload.age ?? 45);
    const nextSpouseAge = Number(s?.spouseAge ?? payload.spouseAge ?? 43);
    const nextRetireAge = Number(s?.retireAge ?? payload.retireAge ?? 65);
    const nextDepAges = Array.isArray(s?.depAges) ? s.depAges : payload.depAges;

    if (!_looksLikeForecastData(dataArr)) {
      console.error("[scenarios] Invalid scenario payload for", s?.name, s);
      alert('That scenario is missing required fields. Resetting to defaults.');
      resetForecast({ clearScenarioSelection: true });
      return;
    }

    // Build a fresh full-length base, then overlay saved rows
    const base = initData(
      nextAge,
      nextSpouseAge || 43,
      Array.isArray(nextDepAges) ? nextDepAges : [10, 8, 5],
      nextRetireAge
    );

    const merged = base.map((row, i) => {
      const savedRow = dataArr?.[i];
      return savedRow && typeof savedRow === "object" ? { ...row, ...savedRow } : row;
    });

    setData(merged);
    setAge(nextAge);
    setSpouseAge(nextSpouseAge || 43);
    setRetireAge(nextRetireAge);
    setDepAges(Array.isArray(nextDepAges) ? nextDepAges : [10, 8, 5]);

    setSections(_normalizeSections(s?.sections ?? payload.sections));

    setActiveScenario(s.name);
    setActiveScenarioId(s.id);
    setScenarioName(s.name);
    setUndoStack([]);
  };

  const deleteScenario = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from("scenarios").delete().eq("id", id);
      if (error) throw error;
      if (activeScenarioId === id) {
        setActiveScenario(null);
        setActiveScenarioId(null);
      }
      await loadScenariosFromDB();
    } catch (e) {
      console.error("Error deleting scenario:", e);
      alert("Error deleting scenario: " + e.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setScenarios([]);
    resetForecast({ clearScenarioSelection: true });
  };

  const isRet = (yr) => yr - START_YEAR + age >= retireAge;
  const retireYear = START_YEAR + (retireAge - age);

  const stickyTh = {
    padding: "7px 4px",
    textAlign: "left",
    borderBottom: "2px solid #6366f1",
    fontSize: "11px",
    minWidth: "144px",
    position: "sticky",
    left: 0,
    background: "#1e293b",
    zIndex: 10,
  };

  const stickyTd = {
    position: "sticky",
    left: 0,
    background: "#1e293b",
    padding: "5px 7px",
    zIndex: 5,
    textAlign: "left",
    fontSize: "11px",
  };

  const cellStyle = { padding: "4px", textAlign: "center", fontSize: "11px" };

  const bg = (yr, i) =>
    isRet(yr)
      ? "rgba(251,146,60,0.08)"
      : i % 5 === 0
        ? "rgba(99,102,241,0.05)"
        : "transparent";

  const thStyle = {
    padding: "7px 4px",
    textAlign: "center",
    borderBottom: "2px solid #6366f1",
    fontSize: "11px",
    minWidth: "84px",
  };

  const ageHeader = (r) => {
    const deps = [];
    for (let d = 1; d <= r.dependents; d++) {
      if (r[`dep${d}Age`] > 0) deps.push({ age: r[`dep${d}Age`], isMinor: r[`dep${d}Age`] < 18 });
    }
    // Chunk deps into rows of 3
    const depRows = [];
    for (let i = 0; i < deps.length; i += 3) {
      depRows.push(deps.slice(i, i + 3));
    }
    return (
      <>
        <span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "10px", display: "block" }}>
          You: {r.age}
        </span>
        <span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "10px", display: "block" }}>
          Sp: {r.spouseAge}
        </span>
        {depRows.map((row, rowIdx) => (
          <span key={rowIdx} style={{ fontSize: "10px", display: "block" }}>
            {rowIdx === 0 ? "K:" : "\u00A0\u00A0\u00A0"}
            {row.map((d, idx) => (
              <span key={idx} style={{ color: d.isMinor ? "#ec4899" : "#e2e8f0" }}>
                {d.age}{idx < row.length - 1 ? "," : ""}
              </span>
            ))}
          </span>
        ))}
      </>
    );
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#e2e8f0", fontSize: "22px" }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth onAuthSuccess={setUser} />;

  // If forecast math can't run, don't crash the whole app.
  if (!Array.isArray(data) || data.length === 0 || enriched.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'SF Mono', monospace",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            background: "rgba(30,41,59,0.8)",
            borderRadius: "14px",
            padding: "22px",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>
            Render failed after login
          </div>
          <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5, marginBottom: "14px" }}>
            A saved scenario is missing required fields or is in an older format.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => resetForecast({ clearScenarioSelection: true })}
              style={{
                padding: "10px 14px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Forecast
            </button>
            <button
              onClick={handleSignOut}
              style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.2)",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIX: compute end-of-horizon safely (never index YEARS-1 blindly)
  const startNW = firstEnriched?.netWorth ?? 0;
  const endNW = lastEnriched?.netWorth ?? 0;
  const totalGrowthPct = startNW > 0 ? ((endNW - startNW) / startNW) * 100 : 0;

  const tableProps = {
    enriched,
    data,
    sections,
    toggleSection,
    update,
    updateYear0,
    updateSingleYear,
    updateHelocUsed,
    updateMortgage,
    updateRentalMortgage,
    updateCarLoan,
    updateDeps,
    isRet,
    bg,
    stickyTh,
    stickyTd,
    cellStyle,
    thStyle,
    ageHeader,
    depAges,
  };

  const ratioColor = (value, thresholds) => {
    if (thresholds.higherIsBad)
      return value > thresholds.danger ? "#f87171" : value > thresholds.warn ? "#fbbf24" : "#4ade80";
    return value < thresholds.danger ? "#f87171" : value < thresholds.warn ? "#fbbf24" : "#4ade80";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "'SF Mono', monospace",
        color: "#e2e8f0",
        padding: "12px",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "16px" }}>
        <AnimatedTitle />
        <p style={{ color: "#64748b", fontSize: "13px", margin: "5px 0 0", letterSpacing: "2px" }}>
          40-YEAR HOUSEHOLD PROJECTION
        </p>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "10px", 
          marginTop: "10px",
          flexWrap: "wrap"
        }}>
          <span style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px", whiteSpace: "nowrap" }}>{user.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: "4px 12px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "6px",
              color: "#f87171",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; e.currentTarget.style.borderColor = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px", justifyContent: "center", alignItems: "center" }}>
        {[
          ["You:", age, (v) => updateAges(v, spouseAge)],
          ["Spouse:", spouseAge, (v) => updateAges(age, v)],
          ["Retire:", retireAge, (v) => { setRetireAge(v); setData(initData(age, spouseAge, depAges, v)); }],
          ["#Kids:", depAges.length, updateDeps],
        ].map(([l, v, fn], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 10px", borderRadius: "6px" }}>
            <label style={{ fontSize: "12px", color: "#94a3b8" }}>{l}</label>
            <input
              type="number"
              value={v}
              onChange={(e) => fn(parseInt(e.target.value) || 0)}
              style={{ width: "40px", padding: "3px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "12px", textAlign: "center", fontFamily: "inherit" }}
            />
          </div>
        ))}
        {depAges.map((a, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(236,72,153,0.2)", padding: "4px 8px", borderRadius: "6px" }}>
            <label style={{ fontSize: "11px", color: "#ec4899" }}>K{idx + 1}:</label>
            <input
              type="number"
              value={a}
              onChange={(e) => updateDepAge(idx, parseInt(e.target.value) || 0)}
              style={{ width: "30px", padding: "2px", background: "#1e293b", border: "1px solid #475569", borderRadius: "3px", color: "#fff", fontSize: "12px", textAlign: "center" }}
            />
          </div>
        ))}

        {/* Reset to Defaults Button */}
        <button
          onClick={() => {
            if (confirm("Reset all inputs to default values?")) {
              resetForecast({ clearScenarioSelection: true });
            }
          }}
          style={{
            padding: "6px 14px",
            background: "rgba(251, 191, 36, 0.15)",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            borderRadius: "6px",
            color: "#fbbf24",
            fontSize: "11px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)'; e.currentTarget.style.borderColor = '#fbbf24'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'; e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)'; }}
        >
          🔄 Reset
        </button>

        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          style={{
            padding: "6px 14px",
            background: undoStack.length === 0 ? "rgba(71, 85, 105, 0.3)" : "rgba(99, 102, 241, 0.15)",
            border: undoStack.length === 0 ? "1px solid rgba(71, 85, 105, 0.3)" : "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: "6px",
            color: undoStack.length === 0 ? "#475569" : "#a78bfa",
            fontSize: "11px",
            fontWeight: "700",
            cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            opacity: undoStack.length === 0 ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (undoStack.length > 0) { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'; e.currentTarget.style.borderColor = '#6366f1'; } }}
          onMouseLeave={e => { if (undoStack.length > 0) { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; } }}
        >
          ↩ Undo{undoStack.length > 0 ? ` (${undoStack.length})` : ''}
        </button>

        {activeScenario && (
          <button
            onClick={saveCurrentScenario}
            disabled={saving}
            style={{
              padding: "6px 12px",
              background: saving ? "#475569" : "linear-gradient(135deg, #3b82f6, #2563eb)",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "11px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "Saving..." : `💾 Save "${activeScenario}"`}
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 10px", borderRadius: "6px" }}>
          <input
            type="text"
            placeholder="New Scenario"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            style={{ width: "90px", padding: "3px 6px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "10px" }}
          />
          <button
            onClick={saveScenario}
            disabled={saving}
            style={{ padding: "3px 8px", background: saving ? "#475569" : "#22c55e", border: "none", borderRadius: "4px", color: "#fff", fontSize: "11px", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "..." : "Save As"}
          </button>
        </div>

        {loadingScenarios ? (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Loading scenarios...</span>
        ) : (
          scenarios.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: activeScenarioId === s.id ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.2)",
                padding: "3px 8px",
                borderRadius: "4px",
                border: activeScenarioId === s.id ? "1px solid #22c55e" : "none",
              }}
            >
              <button
                onClick={() => loadScenario(s)}
                style={{ background: "none", border: "none", color: activeScenarioId === s.id ? "#4ade80" : "#a78bfa", fontSize: "11px", cursor: "pointer" }}
              >
                {s.name}
              </button>
              <button
                onClick={() => deleteScenario(s.id, s.name)}
                style={{ background: "none", border: "none", color: "#f87171", fontSize: "11px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", justifyContent: "center" }}>
        <style>{`
          @keyframes tabGlow { 0%, 100% { box-shadow: 0 0 12px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); } }
          .tab-btn { position: relative; overflow: hidden; }
          .tab-btn::after { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-50%, -50%); transition: width 0.4s ease, height 0.4s ease; }
          .tab-btn:hover::after { width: 200px; height: 200px; }
          @keyframes iconBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          @keyframes iconSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .tab-icon-active { display: inline-block; animation: iconBounce 1s ease-in-out infinite; }
          .tab-icon-inactive { display: inline-block; transition: transform 0.3s ease; }
          .tab-btn:hover .tab-icon-inactive { transform: scale(1.2); }
        `}</style>
        {[
          ["variables", "Forecast", "⚙️"],
          ["charts", "Charts", "📊"],
        ].map(([k, label, icon]) => (
          <button
            key={k}
            className="tab-btn"
            onClick={() => setTab(k)}
            style={{
              padding: "10px 28px",
              background: tab === k ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(30, 41, 59, 0.8)",
              border: tab === k ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid rgba(148,163,184,0.2)",
              borderRadius: "10px",
              color: tab === k ? "#fff" : "#94a3b8",
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "inherit",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: tab === k ? "scale(1.02)" : "scale(1)",
              animation: tab === k ? "tabGlow 2s ease-in-out infinite" : "none",
              boxShadow: tab === k ? "0 4px 16px rgba(99, 102, 241, 0.35)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={e => { if (tab !== k) { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.transform = 'scale(1.03)'; } }}
            onMouseLeave={e => { if (tab !== k) { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; } }}
          >
            <span className={tab === k ? "tab-icon-active" : "tab-icon-inactive"} style={{ fontSize: "18px" }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {tab === "variables" && (
        <>
          {/* Key Ratios & Net Worth */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "10px" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Expense/Income</div>
                <div style={{ color: ratioColor(firstEnriched?.expenseToIncome ?? 0, { higherIsBad: true, danger: 90, warn: 70 }), fontSize: "20px", fontWeight: "bold" }}>
                  {(firstEnriched?.expenseToIncome ?? 0).toFixed(0)}%
                </div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Expense/After-Tax</div>
                <div style={{ color: ratioColor(firstEnriched?.expenseToAfterTax ?? 0, { higherIsBad: true, danger: 100, warn: 80 }), fontSize: "20px", fontWeight: "bold" }}>
                  {(firstEnriched?.expenseToAfterTax ?? 0).toFixed(0)}%
                </div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Liabilities/Assets</div>
                <div style={{ color: ratioColor(firstEnriched?.liabToAsset ?? 0, { higherIsBad: true, danger: 50, warn: 30 }), fontSize: "20px", fontWeight: "bold" }}>
                  {(firstEnriched?.liabToAsset ?? 0).toFixed(0)}%
                </div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(74,222,128,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Savings Rate</div>
                <div style={{ color: ratioColor(firstEnriched?.savingsRate ?? 0, { higherIsBad: false, danger: 10, warn: 20 }), fontSize: "20px", fontWeight: "bold" }}>
                  {(firstEnriched?.savingsRate ?? 0).toFixed(0)}%
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(167,139,250,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Net Worth (Start)</div>
                <div style={{ color: "#a78bfa", fontSize: "20px", fontWeight: "bold" }}>{fmt(startNW)}</div>
              </div>

              {/* FIXED: Net Worth (End) uses lastEnriched */}
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Net Worth (End)</div>
                <div style={{ color: "#22c55e", fontSize: "20px", fontWeight: "bold" }}>{fmt(endNW)}</div>
              </div>

              {/* FIXED: Total Growth uses start/end safely */}
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(96,165,250,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Total Growth</div>
                <div style={{ color: "#60a5fa", fontSize: "20px", fontWeight: "bold" }}>{totalGrowthPct.toFixed(0)}%</div>
              </div>

              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(6,182,212,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>NW at Retirement</div>
                <div style={{ color: "#06b6d4", fontSize: "20px", fontWeight: "bold" }}>{fmt(retirementAnalysis.retireStartNetWorth)}</div>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <ScrollTable>
              <div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr>
                      <th style={stickyTh}>Category</th>
                      {enriched.map((r, i) => (
                        <th
                          key={r.year}
                          style={{
                            ...thStyle,
                            background: isRet(r.year)
                              ? "rgba(251,146,60,0.15)"
                              : i % 5 === 0
                                ? "rgba(99,102,241,0.1)"
                                : "transparent",
                          }}
                        >
                          {r.year}
                          <br />
                          {ageHeader(r)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <VariablesTablePart2Sections {...tableProps} sectionGroup="upper" />
                  </tbody>
                </table>

                {/* Mid-table scrollbar indicator */}
                <div style={{ 
                  position: "sticky", 
                  left: 0, 
                  padding: "6px 0", 
                  background: "linear-gradient(90deg, rgba(99,102,241,0.15), transparent 50%, rgba(99,102,241,0.15))",
                  borderTop: "1px solid rgba(99,102,241,0.3)",
                  borderBottom: "1px solid rgba(99,102,241,0.3)",
                  textAlign: "center",
                  color: "#6366f1",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1px"
                }}>
                  ◆ HOUSING & BELOW ◆
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr>
                      <th style={stickyTh}>Category</th>
                      {enriched.map((r, i) => (
                        <th
                          key={r.year}
                          style={{
                            ...thStyle,
                            background: isRet(r.year)
                              ? "rgba(251,146,60,0.15)"
                              : i % 5 === 0
                                ? "rgba(99,102,241,0.1)"
                                : "transparent",
                          }}
                        >
                          {r.year}
                          <br />
                          {ageHeader(r)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <VariablesTablePart2Sections {...tableProps} sectionGroup="lower" />
                  </tbody>
                </table>
              </div>
            </ScrollTable>
          </div>
        </>
      )}

      {tab === "charts" && (
        <Charts
          enriched={enriched}
          retireAge={retireAge}
          age={age}
          retirementAnalysis={retirementAnalysis}
        />
      )}

      <footer style={{ marginTop: "24px", textAlign: "center", color: "#475569", fontSize: "11px" }}>
        4Cast • {START_YEAR}-{START_YEAR + YEARS - 1} • Retire: {retireYear} (Age {retireAge}) • ☁️ Synced to Cloud
      </footer>
    </div>
  );
}
