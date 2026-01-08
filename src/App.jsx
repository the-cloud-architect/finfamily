import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

const YEARS = 35, START_YEAR = 2025;

const initData = (age = 45) => Array.from({length: YEARS}, (_, i) => ({
  year: START_YEAR + i, age: age + i,
  cashIncome: 280000, rsuIncome: 50000, match401k: 20000, investmentIncome: 5000, rentalIncome: 0, taxRate: 32,
  stockGrowthRate: 7, homeGrowthRate: 3, rentalGrowthRate: 3, carDepreciation: 15, machineDepreciation: 10,
  housingExpense: 36000, utilitiesExpense: 4800, foodExpense: 18000, clothingExpense: 4500, entertainmentExpense: 6000,
  vacationBudget: 12000, educationExpense: 15000, healthcareExpense: 8000, healthInsurance: 12000, carInsurance: 3600,
  homeInsurance: 4200, transportExpense: 9600, miscExpense: 6000, dependents: 3,
  cashBalance: 50000, stocksBonds: 400000, retirement401k: 200000, primaryHomeValue: 650000, rentalPropertyValue: 0,
  carValue: 45000, otherMachines: 10000, mortgageBalance: 450000, rentalMortgage: 0, carLoan: 25000, otherDebt: 10000,
  helocLimit: 150000, helocUsed: 0,
}));

const fmt = v => { if (!v && v !== 0) return "$0"; const a = Math.abs(v); return (v < 0 ? "-$" : "$") + (a >= 1e6 ? (a/1e6).toFixed(2)+"M" : a >= 1e3 ? (a/1e3).toFixed(0)+"K" : v.toFixed(0)); };

const calcCumulative = data => {
  const res = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const gross = r.cashIncome + r.rsuIncome + r.match401k + r.investmentIncome + r.rentalIncome;
    const tax = (r.cashIncome + r.rsuIncome + r.investmentIncome) * (r.taxRate / 100);
    const afterTax = gross - tax;
    const depCost = r.dependents * 1500;
    const exp = r.housingExpense + r.utilitiesExpense + r.foodExpense + r.clothingExpense + r.entertainmentExpense + r.vacationBudget + r.educationExpense + r.healthcareExpense + r.healthInsurance + r.carInsurance + r.homeInsurance + r.transportExpense + r.miscExpense + depCost;
    const cashFlow = afterTax - exp;
    
    let stocks, home, rental, car, mach;
    if (i === 0) { stocks = r.stocksBonds; home = r.primaryHomeValue; rental = r.rentalPropertyValue; car = r.carValue; mach = r.otherMachines; }
    else { const p = res[i-1]; stocks = p.stocks * (1 + r.stockGrowthRate/100) + p.cashFlow; home = p.home * (1 + r.homeGrowthRate/100); rental = p.rental * (1 + r.rentalGrowthRate/100); car = p.car * (1 - r.carDepreciation/100); mach = p.mach * (1 - r.machineDepreciation/100); }
    
    const assets = r.cashBalance + stocks + r.retirement401k + home + rental + car + mach;
    const debt = r.mortgageBalance + r.rentalMortgage + r.carLoan + r.otherDebt + r.helocUsed;
    const cashRes = r.cashBalance + (r.helocLimit - r.helocUsed);
    
    res.push({ ...r, gross, tax, afterTax, depCost, exp, cashFlow, stocks, home, rental, car, mach, assets, debt, netWorth: assets - debt, cashRes,
      dti: gross > 0 ? (exp/gross)*100 : 0, dtiPost: afterTax > 0 ? (exp/afterTax)*100 : 0, lar: assets > 0 ? (debt/assets)*100 : 0,
      alr: debt > 0 ? assets/debt : 999, yrs: exp > 0 ? cashRes/exp : 0, save: gross > 0 ? (cashFlow/gross)*100 : 0 });
  }
  return res;
};

const Cell = ({ value, onChange, pct, ret }) => {
  const [ed, setEd] = useState(false), [tmp, setTmp] = useState(value);
  const done = () => { setEd(false); onChange(Math.max(0, pct ? parseFloat(tmp) : parseInt(tmp) || 0)); };
  if (ed) return <input type="number" value={tmp} onChange={e => setTmp(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} autoFocus style={{ width: "60px", padding: "2px", border: "2px solid #3b82f6", borderRadius: "3px", background: "#1e293b", color: "#fff", fontSize: "10px", textAlign: "right" }} />;
  return <span onClick={() => { setTmp(value); setEd(true); }} style={{ cursor: "pointer", padding: "2px 4px", borderRadius: "3px", fontSize: "10px", background: ret ? "rgba(251,146,60,0.15)" : "rgba(59,130,246,0.1)", border: ret ? "1px dashed rgba(251,146,60,0.4)" : "1px dashed rgba(59,130,246,0.3)", display: "inline-block", minWidth: "50px", textAlign: "right" }}>{pct ? value+"%" : fmt(value)}</span>;
};

const ScrollTable = ({ children }) => {
  const topRef = React.useRef(null), bottomRef = React.useRef(null);
  const [sw, setSw] = useState(0);
  React.useEffect(() => { if (bottomRef.current) setSw(bottomRef.current.scrollWidth); }, [children]);
  const sync = src => { if (src === 'top' && bottomRef.current && topRef.current) bottomRef.current.scrollLeft = topRef.current.scrollLeft; else if (src === 'bottom' && topRef.current && bottomRef.current) topRef.current.scrollLeft = bottomRef.current.scrollLeft; };
  return <div><div ref={topRef} onScroll={() => sync('top')} style={{ overflowX: "auto", height: "14px" }}><div style={{ width: sw, height: "1px" }} /></div><div ref={bottomRef} onScroll={() => sync('bottom')} style={{ overflowX: "auto" }}>{children}</div></div>;
};

export default function FinFamily() {
  const [age, setAge] = useState(45), [retireAge, setRetireAge] = useState(65), [data, setData] = useState(() => initData(45)), [tab, setTab] = useState("variables"), [scenarios, setScenarios] = useState([]), [scenarioName, setScenarioName] = useState("");
  const enriched = useMemo(() => calcCumulative(data), [data]);
  const update = (idx, field, value) => setData(prev => { const next = [...prev]; for (let i = idx; i < YEARS; i++) next[i] = { ...next[i], [field]: value, age: age + i }; return next; });
  const updateAge = newAge => { setAge(newAge); setData(prev => prev.map((r, i) => ({ ...r, age: newAge + i }))); };
  const saveScenario = () => { if (!scenarioName.trim()) return; setScenarios(prev => [...prev.filter(s => s.name !== scenarioName), { name: scenarioName, data: JSON.parse(JSON.stringify(data)), age, retireAge }]); setScenarioName(""); };
  const loadScenario = s => { setData(s.data); setAge(s.age); setRetireAge(s.retireAge); };
  const isRet = yr => (yr - START_YEAR + age) >= retireAge;
  const th = { padding: "6px 3px", textAlign: "center", borderBottom: "2px solid #6366f1", fontSize: "9px", minWidth: "70px" };
  const stickyTh = { ...th, position: "sticky", left: 0, background: "#1e293b", zIndex: 10, textAlign: "left", minWidth: "120px" };
  const stickyTd = { position: "sticky", left: 0, background: "#1e293b", padding: "4px 6px", zIndex: 5 };
  const bg = (yr, i) => isRet(yr) ? "rgba(251,146,60,0.08)" : i % 5 === 0 ? "rgba(99,102,241,0.05)" : "transparent";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'SF Mono', monospace", color: "#e2e8f0", padding: "12px" }}>
      <header style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", margin: 0, background: "linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FinFamily</h1>
        <p style={{ color: "#64748b", fontSize: "11px", margin: "4px 0 0", letterSpacing: "2px" }}>35-YEAR HOUSEHOLD PROJECTION</p>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 12px", borderRadius: "6px" }}>
          <label style={{ fontSize: "11px", color: "#94a3b8" }}>Age:</label>
          <input type="number" value={age} onChange={e => updateAge(parseInt(e.target.value) || 45)} style={{ width: "45px", padding: "3px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "11px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 12px", borderRadius: "6px" }}>
          <label style={{ fontSize: "11px", color: "#94a3b8" }}>Retire:</label>
          <input type="number" value={retireAge} onChange={e => setRetireAge(parseInt(e.target.value) || 65)} style={{ width: "45px", padding: "3px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "11px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 12px", borderRadius: "6px" }}>
          <input type="text" placeholder="Scenario" value={scenarioName} onChange={e => setScenarioName(e.target.value)} style={{ width: "100px", padding: "3px 6px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "11px" }} />
          <button onClick={saveScenario} style={{ padding: "3px 10px", background: "#22c55e", border: "none", borderRadius: "4px", color: "#fff", fontSize: "10px", cursor: "pointer" }}>Save</button>
        </div>
        {scenarios.map(s => <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(99,102,241,0.2)", padding: "3px 8px", borderRadius: "4px" }}><button onClick={() => loadScenario(s)} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: "10px", cursor: "pointer" }}>{s.name}</button><button onClick={() => setScenarios(p => p.filter(x => x.name !== s.name))} style={{ background: "none", border: "none", color: "#f87171", fontSize: "10px", cursor: "pointer" }}>×</button></div>)}
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "center" }}>
        {[["variables", "⚙️ Variables"], ["summary", "📊 Summary"], ["charts", "📈 Charts"]].map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "6px 16px", background: tab === k ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent", border: tab === k ? "none" : "1px solid rgba(148,163,184,0.2)", borderRadius: "5px", color: tab === k ? "#fff" : "#94a3b8", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{v}</button>)}
      </div>

      {tab === "variables" && (
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
          <p style={{ fontSize: "10px", color: "#64748b", marginBottom: "10px" }}>💡 Click values to edit. Changes cascade forward. Blue = calculated growth, Red = calculated depreciation.</p>
          <ScrollTable>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead><tr><th style={stickyTh}>Category</th>{enriched.map((r, i) => <th key={r.year} style={{ ...th, background: isRet(r.year) ? "rgba(251,146,60,0.15)" : i % 5 === 0 ? "rgba(99,102,241,0.1)" : "transparent" }}>{r.year}<br/><span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "8px" }}>Age {r.age}</span></th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #22c55e20, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#22c55e", fontSize: "10px" }}>💰 INCOME</td></tr>
                {[["cashIncome", "Cash"], ["rsuIncome", "RSU"], ["match401k", "401k Match"], ["investmentIncome", "Investment"], ["rentalIncome", "Rental"], ["taxRate", "Tax Rate %", true]].map(([k, l, pct]) => <tr key={k}><td style={stickyTd}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i][k]} onChange={v => update(i, k, v)} pct={pct} ret={isRet(r.year)} /></td>)}</tr>)}
                <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#22c55e" }}>Total Income</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#22c55e", background: bg(r.year, i) }}>{fmt(r.gross)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #ec489920, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#ec4899", fontSize: "10px" }}>👨‍👩‍👧‍👦 DEPENDENTS</td></tr>
                <tr><td style={stickyTd}># Dependents</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].dependents} onChange={v => update(i, "dependents", v)} ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={{ ...stickyTd, color: "#ec4899" }}>Cost ($1500/ea)</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", color: "#ec4899", background: bg(r.year, i) }}>{fmt(r.depCost)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #ef444420, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#ef4444", fontSize: "10px" }}>💸 EXPENSES</td></tr>
                {[["housingExpense", "Housing"], ["utilitiesExpense", "Utilities"], ["foodExpense", "Food"], ["clothingExpense", "Clothing"], ["entertainmentExpense", "Entertainment"], ["vacationBudget", "Vacation"], ["educationExpense", "Education"], ["healthcareExpense", "Healthcare"], ["healthInsurance", "Health Ins"], ["carInsurance", "Car Ins"], ["homeInsurance", "Home Ins"], ["transportExpense", "Transport"], ["miscExpense", "Misc"]].map(([k, l]) => <tr key={k}><td style={stickyTd}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i][k]} onChange={v => update(i, k, v)} ret={isRet(r.year)} /></td>)}</tr>)}
                <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#ef4444" }}>Total Expenses</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#ef4444", background: bg(r.year, i) }}>{fmt(r.exp)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #06b6d420, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#06b6d4", fontSize: "10px" }}>💵 CASH FLOW</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Net Cash Flow</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: r.cashFlow >= 0 ? "#4ade80" : "#f87171", background: bg(r.year, i) }}>{fmt(r.cashFlow)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #3b82f620, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#3b82f6", fontSize: "10px" }}>🏦 ASSETS</td></tr>
                <tr><td style={stickyTd}>Cash</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].cashBalance} onChange={v => update(i, "cashBalance", v)} ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>Stocks/Bonds</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].stocksBonds} onChange={v => update(i, "stocksBonds", v)} ret={isRet(r.year)} /> : <span style={{color:"#60a5fa"}}>{fmt(r.stocks)}</span>}</td>)}</tr>
                <tr><td style={stickyTd}>↳ Growth %</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].stockGrowthRate} onChange={v => update(i, "stockGrowthRate", v)} pct ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>401k</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].retirement401k} onChange={v => update(i, "retirement401k", v)} ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>Primary Home</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].primaryHomeValue} onChange={v => update(i, "primaryHomeValue", v)} ret={isRet(r.year)} /> : <span style={{color:"#60a5fa"}}>{fmt(r.home)}</span>}</td>)}</tr>
                <tr><td style={stickyTd}>↳ Growth %</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].homeGrowthRate} onChange={v => update(i, "homeGrowthRate", v)} pct ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>Rental Property</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].rentalPropertyValue} onChange={v => update(i, "rentalPropertyValue", v)} ret={isRet(r.year)} /> : <span style={{color:"#60a5fa"}}>{fmt(r.rental)}</span>}</td>)}</tr>
                <tr><td style={stickyTd}>↳ Growth %</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].rentalGrowthRate} onChange={v => update(i, "rentalGrowthRate", v)} pct ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>Car</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].carValue} onChange={v => update(i, "carValue", v)} ret={isRet(r.year)} /> : <span style={{color:"#f87171"}}>{fmt(r.car)}</span>}</td>)}</tr>
                <tr><td style={stickyTd}>↳ Deprec %</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].carDepreciation} onChange={v => update(i, "carDepreciation", v)} pct ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>Machines</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].otherMachines} onChange={v => update(i, "otherMachines", v)} ret={isRet(r.year)} /> : <span style={{color:"#f87171"}}>{fmt(r.mach)}</span>}</td>)}</tr>
                <tr><td style={stickyTd}>↳ Deprec %</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].machineDepreciation} onChange={v => update(i, "machineDepreciation", v)} pct ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={stickyTd}>HELOC Limit</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i].helocLimit} onChange={v => update(i, "helocLimit", v)} ret={isRet(r.year)} /></td>)}</tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#3b82f6" }}>Total Assets</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#3b82f6", background: bg(r.year, i) }}>{fmt(r.assets)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #f9731620, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#f97316", fontSize: "10px" }}>📉 LIABILITIES</td></tr>
                {[["mortgageBalance", "Mortgage"], ["rentalMortgage", "Rental Mtg"], ["carLoan", "Car Loan"], ["otherDebt", "Other Debt"], ["helocUsed", "HELOC Used"]].map(([k, l]) => <tr key={k}><td style={stickyTd}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", background: bg(r.year, i) }}><Cell value={data[i][k]} onChange={v => update(i, k, v)} ret={isRet(r.year)} /></td>)}</tr>)}
                <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#f97316" }}>Total Liabilities</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#f97316", background: bg(r.year, i) }}>{fmt(r.debt)}</td>)}</tr>

                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #a78bfa20, transparent)", padding: "5px 8px", fontWeight: "bold", color: "#a78bfa", fontSize: "10px" }}>💎 SUMMARY</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#a78bfa" }}>Net Worth</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#a78bfa", background: "rgba(167,139,250,0.1)" }}>{fmt(r.netWorth)}</td>)}</tr>
                <tr><td style={{ ...stickyTd, color: "#06b6d4" }}>Cash Reserve</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "3px", textAlign: "center", color: "#06b6d4", background: bg(r.year, i) }}>{fmt(r.cashRes)}</td>)}</tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      )}

      {tab === "summary" && (
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
          <ScrollTable>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead><tr><th style={stickyTh}>Metric</th>{enriched.map((r, i) => <th key={r.year} style={{ ...th, background: isRet(r.year) ? "rgba(251,146,60,0.15)" : i % 5 === 0 ? "rgba(99,102,241,0.1)" : "transparent" }}>{r.year}<br/><span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "8px" }}>Age {r.age}</span></th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #22c55e20, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#22c55e", fontSize: "10px" }}>💰 INCOME</td></tr>
                {[["gross", "Gross Income", true], ["tax", "Taxes", false, true], ["afterTax", "After Tax", true]].map(([k, l, bold, neg]) => <tr key={k}><td style={{ ...stickyTd, fontWeight: bold ? "bold" : "normal" }}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", fontWeight: bold ? "bold" : "normal", color: neg ? "#f87171" : "#e2e8f0", background: bg(r.year, i) }}>{fmt(r[k])}</td>)}</tr>)}
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #ef444420, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#ef4444", fontSize: "10px" }}>💸 EXPENSES</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Total Expenses</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", fontWeight: "bold", color: "#f87171", background: bg(r.year, i) }}>{fmt(r.exp)}</td>)}</tr>
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #06b6d420, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#06b6d4", fontSize: "10px" }}>💵 CASH FLOW</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Net Cash Flow</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", fontWeight: "bold", color: r.cashFlow >= 0 ? "#4ade80" : "#f87171", background: bg(r.year, i) }}>{fmt(r.cashFlow)}</td>)}</tr>
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #3b82f620, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#3b82f6", fontSize: "10px" }}>🏦 BALANCE SHEET</td></tr>
                {[["assets", "Total Assets", true], ["debt", "Total Liabilities", false, true], ["netWorth", "Net Worth", true, false, true], ["cashRes", "Cash Reserve", false]].map(([k, l, bold, neg, hl]) => <tr key={k}><td style={{ ...stickyTd, background: hl ? "#1e3a5f" : "#1e293b", fontWeight: bold ? "bold" : "normal" }}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", fontWeight: bold ? "bold" : "normal", color: neg ? "#f87171" : hl ? "#60a5fa" : "#e2e8f0", background: hl ? "rgba(59,130,246,0.2)" : bg(r.year, i) }}>{fmt(r[k])}</td>)}</tr>)}
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #f59e0b20, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#f59e0b", fontSize: "10px" }}>📐 RATIOS</td></tr>
                <tr><td style={stickyTd}>Exp/Income</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.dti > 90 ? "#f87171" : r.dti > 70 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.dti.toFixed(1)}%</td>)}</tr>
                <tr><td style={stickyTd}>Exp/Income Post-Tax</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.dtiPost > 100 ? "#f87171" : r.dtiPost > 80 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.dtiPost.toFixed(1)}%</td>)}</tr>
                <tr><td style={stickyTd}>Liability/Asset</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.lar > 50 ? "#f87171" : r.lar > 30 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.lar.toFixed(1)}%</td>)}</tr>
                <tr><td style={stickyTd}>Asset/Liability</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.alr < 2 ? "#f87171" : r.alr < 3 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.alr > 100 ? "∞" : r.alr.toFixed(2) + "x"}</td>)}</tr>
                <tr><td style={stickyTd}>Years Cash Reserve</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.yrs < 0.5 ? "#f87171" : r.yrs < 1 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.yrs.toFixed(2)}</td>)}</tr>
                <tr><td style={stickyTd}>Savings Rate</td>{enriched.map((r, i) => <td key={r.year} style={{ padding: "4px", textAlign: "right", color: r.save < 10 ? "#f87171" : r.save < 20 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.save.toFixed(1)}%</td>)}</tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      )}

      {tab === "charts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#60a5fa" }}>📈 Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={enriched.map(r => ({ year: r.year, income: r.gross, expenses: r.exp }))}>
                <defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/><Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/><Legend wrapperStyle={{ fontSize: "10px" }}/><Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#ig)" name="Income"/><Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#eg)" name="Expenses"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#06b6d4" }}>💵 Net Cash Flow</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={enriched.map(r => ({ year: r.year, cf: r.cashFlow }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/><Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/><Bar dataKey="cf" name="Cash Flow" fill="#06b6d4" radius={[2, 2, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#a78bfa" }}>🏦 Net Worth</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enriched.map(r => ({ year: r.year, assets: r.assets, debt: r.debt, nw: r.netWorth }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/><Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/><Legend wrapperStyle={{ fontSize: "10px" }}/><Line type="monotone" dataKey="assets" stroke="#3b82f6" strokeWidth={2} dot={false} name="Assets"/><Line type="monotone" dataKey="debt" stroke="#f97316" strokeWidth={2} dot={false} name="Debt"/><Line type="monotone" dataKey="nw" stroke="#a78bfa" strokeWidth={3} dot={false} name="Net Worth"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {[{ l: `Start (${enriched[0].year})`, v: enriched[0].netWorth, c: "#a78bfa" }, { l: `End (${enriched[YEARS-1].year})`, v: enriched[YEARS-1].netWorth, c: "#22c55e" }, { l: "Growth", v: enriched[YEARS-1].netWorth - enriched[0].netWorth, c: "#60a5fa", p: ((enriched[YEARS-1].netWorth - enriched[0].netWorth) / Math.max(1, enriched[0].netWorth) * 100).toFixed(0) + "%" }, { l: "Avg Cash Flow", v: enriched.reduce((s, r) => s + r.cashFlow, 0) / YEARS, c: "#06b6d4" }].map((x, i) => <div key={i} style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", border: `1px solid ${x.c}40`, textAlign: "center" }}><div style={{ color: "#94a3b8", fontSize: "9px", marginBottom: "4px", textTransform: "uppercase" }}>{x.l}</div><div style={{ color: x.c, fontSize: "18px", fontWeight: "bold" }}>{fmt(x.v)}</div>{x.p && <div style={{ color: "#4ade80", fontSize: "10px" }}>+{x.p}</div>}</div>)}
          </div>
        </div>
      )}
      <footer style={{ marginTop: "24px", textAlign: "center", color: "#475569", fontSize: "9px" }}>FinFamily • Orange = Retirement Years • Blue = Growth • Red = Depreciation</footer>
    </div>
  );
}
