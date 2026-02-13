import React, { useState, useMemo, useEffect } from "react";
import { supabase } from './supabaseClient';
import Auth from './Auth';
import { AnimatedTitle, Cell, ScrollTable } from './components.jsx';
import { Charts } from './Charts.jsx';
import { VariablesTablePart2Sections } from './VariablesTablePart2.jsx';
import { fmt, calcCumulative, initData, calcMonthlyPayment } from './utils.js';
import { YEARS, START_YEAR, COLORS } from './constants.js';

export default function FourCast() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // App state
  const [age, setAge] = useState(45);
  const [spouseAge, setSpouseAge] = useState(43);
  const [retireAge, setRetireAge] = useState(65);
  const [depAges, setDepAges] = useState([10, 8, 5]);
  const [data, setData] = useState(() => initData(45, 43, [10, 8, 5], 65));
  const [tab, setTab] = useState("variables");
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [sections, setSections] = useState({ 
    income: true, 
    dependents: true, 
    housing: true, 
    expenses: true, 
    cashflow: true, 
    assets: true, 
    liabilities: true, 
    purchases: true, 
    summary: true,
    ratios: true  // NEW: ratios section
  });
  
  const toggleSection = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Set document title
  useEffect(() => {
    document.title = "4cast";
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load scenarios and auto-load last used scenario when user logs in
  useEffect(() => {
    if (user) {
      loadScenariosFromDB();
    } else {
      setScenarios([]);
      setActiveScenario(null);
      setActiveScenarioId(null);
    }
  }, [user]);

  const loadScenariosFromDB = async () => {
    setLoadingScenarios(true);
    try {
      const { data: scenarioData, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const transformedScenarios = (scenarioData || []).map(s => ({
        id: s.id,
        name: s.name,
        data: s.data.data,
        age: s.data.age,
        spouseAge: s.data.spouseAge,
        retireAge: s.data.retireAge,
        depAges: s.data.depAges,
        sections: s.data.sections, // Save section state
        updated_at: s.updated_at
      }));
      
      setScenarios(transformedScenarios);
      
      // AUTO-LOAD: Load the most recently updated scenario automatically
      if (transformedScenarios.length > 0) {
        const lastScenario = transformedScenarios[0]; // Already sorted by updated_at desc
        loadScenario(lastScenario);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
      alert('Error loading scenarios: ' + error.message);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const enriched = useMemo(() => calcCumulative(data, retireAge), [data, retireAge]);
  const retireYearIdx = retireAge - age;
  
  const retirementAnalysis = useMemo(() => {
    const preRetire = enriched.filter(r => !r.isRetired);
    const postRetire = enriched.filter(r => r.isRetired);
    const avgCashFlowPre = preRetire.length > 0 ? preRetire.reduce((s, r) => s + r.cashFlow, 0) / preRetire.length : 0;
    const avgCashFlowPost = postRetire.length > 0 ? postRetire.reduce((s, r) => s + r.cashFlow, 0) / postRetire.length : 0;
    const totalExpYear1 = enriched[0]?.exp || 0;
    const retireStartNetWorth = preRetire.length > 0 ? preRetire[preRetire.length - 1]?.netWorth : enriched[0]?.netWorth || 0;
    const g = (data[0]?.stockGrowthRate || 7) / 100;
    const n = postRetire.length;
    let maxRetireSpend = 0;
    if (n > 0 && g > 0) {
      const growthFactor = Math.pow(1 + g, n);
      const sumFactor = (growthFactor - 1) / g;
      maxRetireSpend = Math.max(0, (retireStartNetWorth * growthFactor - 1000000) / sumFactor);
    }
    return { avgCashFlowPre, avgCashFlowPost, totalExpYear1, maxRetireSpend, retireStartNetWorth };
  }, [enriched, data]);
  
  const update = (idx, field, value) => setData(prev => { 
    const next = [...prev]; 
    const endIdx = Math.min(YEARS, retireYearIdx); 
    for (let i = idx; i < endIdx; i++) next[i] = { ...next[i], [field]: value }; 
    return next; 
  });
  
  const updateYear0 = (field, value) => setData(prev => { 
    const next = [...prev]; 
    next[0] = { ...next[0], [field]: value }; 
    return next; 
  });
  
  const updateHelocUsed = (idx, value) => setData(prev => { 
    const next = [...prev]; 
    for (let i = idx; i < YEARS; i++) next[i] = { ...next[i], helocUsed: value }; 
    return next; 
  });
  
  const updateSingleYear = (idx, field, value) => setData(prev => { 
    const next = [...prev]; 
    next[idx] = { ...next[idx], [field]: value }; 
    return next; 
  });
  
  const updateMortgage = (field, value) => {
    setData(prev => {
      const next = [...prev]; 
      next[0] = { ...next[0], [field]: value };
      const bal = field === 'mortgageBalance' ? value : next[0].mortgageBalance;
      const rate = field === 'mortgageRate' ? value : next[0].mortgageRate;
      const yrs = field === 'mortgageYears' ? value : next[0].mortgageYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { 
        next[i] = { ...next[i], mortgagePayment: payment, mortgageRate: rate, mortgageYears: yrs }; 
        if (i === 0) next[i].mortgageBalance = bal; 
      }
      return next;
    });
  };
  
  const updateRentalMortgage = (field, value) => {
    setData(prev => {
      const next = [...prev]; 
      next[0] = { ...next[0], [field]: value };
      const bal = field === 'rentalMortgageBalance' ? value : next[0].rentalMortgageBalance;
      const rate = field === 'rentalMortgageRate' ? value : next[0].rentalMortgageRate;
      const yrs = field === 'rentalMortgageYears' ? value : next[0].rentalMortgageYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { 
        next[i] = { ...next[i], rentalMortgagePayment: payment, rentalMortgageRate: rate, rentalMortgageYears: yrs }; 
        if (i === 0) next[i].rentalMortgageBalance = bal; 
      }
      return next;
    });
  };
  
  const updateCarLoan = (field, value) => {
    setData(prev => {
      const next = [...prev]; 
      next[0] = { ...next[0], [field]: value };
      const bal = field === 'carLoanBalance' ? value : next[0].carLoanBalance;
      const rate = field === 'carLoanRate' ? value : next[0].carLoanRate;
      const yrs = field === 'carLoanYears' ? value : next[0].carLoanYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { 
        next[i] = { ...next[i], carLoanPayment: payment, carLoanRate: rate, carLoanYears: yrs }; 
        if (i === 0) next[i].carLoanBalance = bal; 
      }
      return next;
    });
  };
  
  const updateDeps = (count) => {
    const newCount = Math.min(10, Math.max(0, count));
    const newAges = [...depAges]; 
    while (newAges.length < newCount) newAges.push(5); 
    while (newAges.length > newCount) newAges.pop();
    setDepAges(newAges);
    setData(prev => prev.map((r, i) => { 
      const updated = { ...r, dependents: newCount }; 
      for (let d = 1; d <= 10; d++) updated[`dep${d}Age`] = newAges[d-1] ? newAges[d-1] + i : 0; 
      return updated; 
    }));
  };
  
  const updateDepAge = (depIdx, newAge) => { 
    const newAges = [...depAges]; 
    newAges[depIdx] = newAge; 
    setDepAges(newAges); 
    setData(prev => prev.map((r, i) => ({ ...r, [`dep${depIdx+1}Age`]: newAge + i }))); 
  };
  
  const updateAges = (newAge, newSpouseAge) => { 
    setAge(newAge); 
    setSpouseAge(newSpouseAge); 
    setData(prev => prev.map((r, i) => ({ ...r, age: newAge + i, spouseAge: newSpouseAge + i }))); 
  };
  
  const saveScenario = async () => {
    if (!scenarioName.trim()) { alert('Please enter a scenario name'); return; }
    setSaving(true);
    try {
      const existingScenario = scenarios.find(s => s.name === scenarioName);
      // Include sections state in saved data
      const scenarioPayload = { data: JSON.parse(JSON.stringify(data)), age, spouseAge, retireAge, depAges, sections };
      if (existingScenario) {
        const { error } = await supabase.from('scenarios').update({ data: scenarioPayload, updated_at: new Date().toISOString() }).eq('id', existingScenario.id);
        if (error) throw error;
        setActiveScenarioId(existingScenario.id);
      } else {
        const { data: newScenario, error } = await supabase.from('scenarios').insert([{ user_id: user.id, name: scenarioName, data: scenarioPayload }]).select().single();
        if (error) throw error;
        setActiveScenarioId(newScenario.id);
      }
      setActiveScenario(scenarioName);
      await loadScenariosFromDB();
    } catch (error) { console.error('Error saving scenario:', error); alert('Error saving scenario: ' + error.message); }
    finally { setSaving(false); }
  };

  const saveCurrentScenario = async () => {
    if (!activeScenarioId) return;
    setSaving(true);
    try {
      // Include sections state in saved data
      const scenarioPayload = { data: JSON.parse(JSON.stringify(data)), age, spouseAge, retireAge, depAges, sections };
      const { error } = await supabase.from('scenarios').update({ data: scenarioPayload, updated_at: new Date().toISOString() }).eq('id', activeScenarioId);
      if (error) throw error;
      await loadScenariosFromDB();
    } catch (error) { console.error('Error saving scenario:', error); alert('Error saving scenario: ' + error.message); }
    finally { setSaving(false); }
  };

  const loadScenario = (s) => {
    setData(s.data); 
    setAge(s.age); 
    setSpouseAge(s.spouseAge || 43);
    setRetireAge(s.retireAge); 
    setDepAges(s.depAges || [10, 8, 5]);
    // Restore section state if saved
    if (s.sections) {
      setSections(s.sections);
    }
    setActiveScenario(s.name); 
    setActiveScenarioId(s.id); 
    setScenarioName(s.name);
  };

  const deleteScenario = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (error) throw error;
      if (activeScenarioId === id) { setActiveScenario(null); setActiveScenarioId(null); }
      await loadScenariosFromDB();
    } catch (error) { console.error('Error deleting scenario:', error); alert('Error deleting scenario: ' + error.message); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setScenarios([]); setActiveScenario(null); setActiveScenarioId(null);
    setAge(45); setSpouseAge(43); setRetireAge(65); setDepAges([10, 8, 5]);
    setData(initData(45, 43, [10, 8, 5], 65));
  };

  const isRet = yr => (yr - START_YEAR + age) >= retireAge;
  const retireYear = START_YEAR + (retireAge - age);
  const stickyTh = { padding: "7px 4px", textAlign: "left", borderBottom: "2px solid #6366f1", fontSize: "11px", minWidth: "144px", position: "sticky", left: 0, background: "#1e293b", zIndex: 10 };
  const stickyTd = { position: "sticky", left: 0, background: "#1e293b", padding: "5px 7px", zIndex: 5, textAlign: "left", fontSize: "11px" };
  const cellStyle = { padding: "4px", textAlign: "center", fontSize: "11px" };
  const bg = (yr, i) => isRet(yr) ? "rgba(251,146,60,0.08)" : i % 5 === 0 ? "rgba(99,102,241,0.05)" : "transparent";
  const thStyle = { padding: "7px 4px", textAlign: "center", borderBottom: "2px solid #6366f1", fontSize: "11px", minWidth: "84px" };

  // UPDATED: Ages in TWO ROWS
  const ageHeader = (r) => {
    const deps = [];
    for (let d = 1; d <= r.dependents; d++) if (r[`dep${d}Age`] > 0) deps.push({ age: r[`dep${d}Age`], isMinor: r[`dep${d}Age`] < 18 });
    return (
      <>
        {/* AGES ON SEPARATE ROWS */}
        <span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "10px", display: "block" }}>You: {r.age}</span>
        <span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "10px", display: "block" }}>Sp: {r.spouseAge}</span>
        {deps.length > 0 && (
          <span style={{ fontSize: "11px", display: "block" }}>
            K:{deps.map((d, idx) => (
              <span key={idx} style={{ color: d.isMinor ? "#ec4899" : "#e2e8f0" }}>{d.age}{idx < deps.length - 1 ? ',' : ''}</span>
            ))}
          </span>
        )}
      </>
    );
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#e2e8f0", fontSize: "22px" }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth onAuthSuccess={setUser} />;

  const tableProps = {
    enriched, data, sections, toggleSection, update, updateYear0, updateSingleYear,
    updateHelocUsed, updateMortgage, updateRentalMortgage, updateCarLoan, updateDeps,
    isRet, bg, stickyTh, stickyTd, cellStyle, thStyle, ageHeader, depAges
  };

  const ratioColor = (value, thresholds) => {
    if (thresholds.higherIsBad) return value > thresholds.danger ? "#f87171" : value > thresholds.warn ? "#fbbf24" : "#4ade80";
    return value < thresholds.danger ? "#f87171" : value < thresholds.warn ? "#fbbf24" : "#4ade80";
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'SF Mono', monospace", color: "#e2e8f0", padding: "12px" }}>
      <header style={{ textAlign: "center", marginBottom: "16px", position: "relative" }}>
        <div style={{ position: "absolute", right: "0", top: "0", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>{user.email}</span>
          <button onClick={handleSignOut} style={{ padding: "4px 10px", background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", borderRadius: "4px", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>Sign Out</button>
        </div>
        <AnimatedTitle />
        <p style={{ color: "#64748b", fontSize: "13px", margin: "5px 0 0", letterSpacing: "2px" }}>40-YEAR HOUSEHOLD PROJECTION</p>
      </header>
      
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px", justifyContent: "center", alignItems: "center" }}>
        {[["You:", age, v => updateAges(v, spouseAge)], ["Spouse:", spouseAge, v => updateAges(age, v)], ["Retire:", retireAge, setRetireAge], ["#Kids:", depAges.length, updateDeps]].map(([l, v, fn], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 10px", borderRadius: "6px" }}>
            <label style={{ fontSize: "12px", color: "#94a3b8" }}>{l}</label>
            <input type="number" value={v} onChange={e => fn(parseInt(e.target.value) || 0)} style={{ width: "40px", padding: "3px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "12px", textAlign: "center" }} />
          </div>
        ))}
        {depAges.map((a, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(236,72,153,0.2)", padding: "4px 8px", borderRadius: "6px" }}>
            <label style={{ fontSize: "11px", color: "#ec4899" }}>K{idx+1}:</label>
            <input type="number" value={a} onChange={e => updateDepAge(idx, parseInt(e.target.value) || 0)} style={{ width: "30px", padding: "2px", background: "#1e293b", border: "1px solid #475569", borderRadius: "3px", color: "#fff", fontSize: "12px", textAlign: "center" }} />
          </div>
        ))}
        {activeScenario && (
          <button onClick={saveCurrentScenario} disabled={saving} style={{ padding: "6px 12px", background: saving ? "#475569" : "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: "4px", color: "#fff", fontSize: "11px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "bold" }}>
            {saving ? "Saving..." : `💾 Save "${activeScenario}"`}
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 10px", borderRadius: "6px" }}>
          <input type="text" placeholder="New Scenario" value={scenarioName} onChange={e => setScenarioName(e.target.value)} style={{ width: "90px", padding: "3px 6px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "10px" }} />
          <button onClick={saveScenario} disabled={saving} style={{ padding: "3px 8px", background: saving ? "#475569" : "#22c55e", border: "none", borderRadius: "4px", color: "#fff", fontSize: "11px", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "..." : "Save As"}</button>
        </div>
        {loadingScenarios ? (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Loading scenarios...</span>
        ) : (
          scenarios.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "4px", background: activeScenarioId === s.id ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.2)", padding: "3px 8px", borderRadius: "4px", border: activeScenarioId === s.id ? "1px solid #22c55e" : "none" }}>
              <button onClick={() => loadScenario(s)} style={{ background: "none", border: "none", color: activeScenarioId === s.id ? "#4ade80" : "#a78bfa", fontSize: "11px", cursor: "pointer" }}>{s.name}</button>
              <button onClick={() => deleteScenario(s.id, s.name)} style={{ background: "none", border: "none", color: "#f87171", fontSize: "11px", cursor: "pointer" }}>×</button>
            </div>
          ))
        )}
      </div>
      
      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "center" }}>
        {[["variables", "⚙️ Forecast"], ["charts", "📈 Charts"]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 19px", background: tab === k ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent", border: tab === k ? "none" : "1px solid rgba(148,163,184,0.2)", borderRadius: "5px", color: tab === k ? "#fff" : "#94a3b8", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>{v}</button>
        ))}
      </div>

      {tab === "variables" && (
        <>
          {/* Key Ratios & Net Worth */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "10px" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Expense/Income</div>
                <div style={{ color: ratioColor(enriched[0].expenseToIncome, { higherIsBad: true, danger: 90, warn: 70 }), fontSize: "20px", fontWeight: "bold" }}>{enriched[0].expenseToIncome.toFixed(0)}%</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Expense/After-Tax</div>
                <div style={{ color: ratioColor(enriched[0].expenseToAfterTax, { higherIsBad: true, danger: 100, warn: 80 }), fontSize: "20px", fontWeight: "bold" }}>{enriched[0].expenseToAfterTax.toFixed(0)}%</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Liabilities/Assets</div>
                <div style={{ color: ratioColor(enriched[0].liabToAsset, { higherIsBad: true, danger: 50, warn: 30 }), fontSize: "20px", fontWeight: "bold" }}>{enriched[0].liabToAsset.toFixed(0)}%</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(74,222,128,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Savings Rate</div>
                <div style={{ color: ratioColor(enriched[0].savingsRate, { higherIsBad: false, danger: 10, warn: 20 }), fontSize: "20px", fontWeight: "bold" }}>{enriched[0].savingsRate.toFixed(0)}%</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(167,139,250,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Net Worth (Start)</div>
                <div style={{ color: "#a78bfa", fontSize: "20px", fontWeight: "bold" }}>{fmt(enriched[0].netWorth)}</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Net Worth (End)</div>
                <div style={{ color: "#22c55e", fontSize: "20px", fontWeight: "bold" }}>{fmt(enriched[YEARS-1].netWorth)}</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(96,165,250,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>Total Growth</div>
                <div style={{ color: "#60a5fa", fontSize: "20px", fontWeight: "bold" }}>{((enriched[YEARS-1].netWorth - enriched[0].netWorth) / Math.max(1, enriched[0].netWorth) * 100).toFixed(0)}%</div>
              </div>
              <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(6,182,212,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>NW at Retirement</div>
                <div style={{ color: "#06b6d4", fontSize: "20px", fontWeight: "bold" }}>{fmt(retirementAnalysis.retireStartNetWorth)}</div>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <ScrollTable>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr>
                    <th style={stickyTh}>Category</th>
                    {enriched.map((r, i) => (
                      <th key={r.year} style={{ ...thStyle, background: isRet(r.year) ? "rgba(251,146,60,0.15)" : i % 5 === 0 ? "rgba(99,102,241,0.1)" : "transparent" }}>
                        {r.year}<br/>{ageHeader(r)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <VariablesTablePart2Sections {...tableProps} />
                </tbody>
              </table>
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
