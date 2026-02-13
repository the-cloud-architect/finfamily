import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ComposedChart } from "recharts";
import { fmt } from './utils';
import { YEARS, START_YEAR, COLORS } from './constants';

export const Charts = ({ enriched, retireAge, age, retirementAnalysis }) => {
  // Guard against empty enriched data
  if (!enriched || enriched.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
        <p style={{ fontSize: "16px" }}>No forecast data to chart. Configure your variables first.</p>
      </div>
    );
  }

  const retireYear = START_YEAR + (retireAge - age);
  const isRet = yr => (yr - START_YEAR + age) >= retireAge;
  const retireYearIdx = retireAge - age;

  // Compute stats safely from enriched data (don't rely on retirementAnalysis having all fields)
  const preRetire = enriched.filter((_, i) => i < retireYearIdx);
  const postRetire = enriched.filter((_, i) => i >= retireYearIdx);
  const avgCashFlowPre = preRetire.length > 0 ? preRetire.reduce((s, r) => s + r.cashFlow, 0) / preRetire.length : 0;
  const avgCashFlowPost = postRetire.length > 0 ? postRetire.reduce((s, r) => s + r.cashFlow, 0) / postRetire.length : 0;
  const totalExpYear1 = enriched[0]?.exp ?? 0;
  const retireStartNW = retirementAnalysis?.retireStartNetWorth ?? (retireYearIdx < enriched.length ? enriched[retireYearIdx]?.netWorth ?? 0 : 0);
  const maxRetireSpend = postRetire.length > 0 ? Math.max(0, (retireStartNW - 1000000) / Math.max(1, postRetire.length)) : 0;

  const lastIdx = enriched.length - 1;

  const statsData = [
    { l: `Start NW (${enriched[0].year})`, v: enriched[0].netWorth, c: "#a78bfa" },
    { l: `End NW (${enriched[lastIdx].year})`, v: enriched[lastIdx].netWorth, c: "#22c55e" },
    { l: "NW Growth", v: enriched[lastIdx].netWorth - enriched[0].netWorth, c: "#60a5fa", p: ((enriched[lastIdx].netWorth - enriched[0].netWorth) / Math.max(1, enriched[0].netWorth) * 100).toFixed(0) + "%" },
    { l: "Avg CF Pre-Retire", v: avgCashFlowPre, c: "#4ade80" },
    { l: "Avg CF Post-Retire", v: avgCashFlowPost, c: "#fb923c" },
    { l: "Year 1 Expenses", v: totalExpYear1, c: "#ef4444" },
    { l: "NW at Retirement", v: retireStartNW, c: "#06b6d4" },
    { l: "Max Retire Spend (keep $1M)", v: maxRetireSpend, c: "#f472b6" },
  ];
  const statsRow1 = statsData.slice(0, 4);
  const statsRow2 = statsData.slice(4, 8);

  // Card animation styles
  const cardStyle = (x, i) => ({
    background: "rgba(30,41,59,0.8)",
    borderRadius: "10px",
    padding: "16px",
    border: `1px solid ${x.c}40`,
    textAlign: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "default",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Summary Stats Grid - Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        {statsRow1.map((x, i) => (
          <div
            key={i}
            style={cardStyle(x, i)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${x.c}30`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{x.l}</div>
            <div style={{ color: x.c, fontSize: "22px", fontWeight: "bold" }}>{fmt(x.v)}</div>
            {x.p && <div style={{ color: "#4ade80", fontSize: "12px", marginTop: "2px" }}>+{x.p}</div>}
          </div>
        ))}
      </div>
      {/* Summary Stats Grid - Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        {statsRow2.map((x, i) => (
          <div
            key={i}
            style={cardStyle(x, i)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${x.c}30`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{x.l}</div>
            <div style={{ color: x.c, fontSize: "22px", fontWeight: "bold" }}>{fmt(x.v)}</div>
            {x.p && <div style={{ color: "#4ade80", fontSize: "12px", marginTop: "2px" }}>+{x.p}</div>}
          </div>
        ))}
      </div>

      {/* Timeline Header - Ages in TWO ROWS */}
      <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(148,163,184,0.2)", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: "4px", minWidth: "max-content" }}>
          {enriched.map((r) => {
            const deps = [];
            for (let d = 1; d <= r.dependents; d++) {
              if (r[`dep${d}Age`] > 0) deps.push({ age: r[`dep${d}Age`], isMinor: r[`dep${d}Age`] < 18 });
            }
            // Chunk deps into rows of 3
            const depRows = [];
            for (let ci = 0; ci < deps.length; ci += 3) {
              depRows.push(deps.slice(ci, ci + 3));
            }
            return (
              <div key={r.year} style={{ textAlign: "center", padding: "5px 7px", background: isRet(r.year) ? "rgba(251,146,60,0.2)" : "rgba(99,102,241,0.1)", borderRadius: "4px", minWidth: "68px", fontSize: "13px" }}>
                <div style={{ color: isRet(r.year) ? "#fb923c" : "#a78bfa", fontWeight: "bold" }}>{r.year}</div>
                <div style={{ color: "#64748b" }}>You: {r.age}</div>
                <div style={{ color: "#64748b" }}>Sp: {r.spouseAge}</div>
                {depRows.map((row, rowIdx) => (
                  <div key={rowIdx}>
                    {rowIdx === 0 ? "K:" : "\u00A0\u00A0\u00A0"}
                    {row.map((d, idx) => (
                      <span key={idx} style={{ color: d.isMinor ? "#ec4899" : "#e2e8f0" }}>
                        {d.age}{idx < row.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Income vs Expenses Chart */}
      <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#60a5fa" }}>📈 Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={enriched.map(r => ({ year: r.year, income: r.gross, expenses: r.exp }))}>
            <defs>
              <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="year" stroke="#64748b" fontSize={11}/>
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={fmt}/>
            <Tooltip 
              contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "13px" }} 
              formatter={fmt}
            />
            <Legend wrapperStyle={{ fontSize: "13px" }}/>
            <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" label={{ value: `Retire`, fill: '#fb923c', fontSize: 11 }} />
            <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#ig)" name="Income"/>
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#eg)" name="Expenses"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Cash Flow Chart */}
      <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#06b6d4" }}>💵 Net Cash Flow</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={enriched.map(r => ({ year: r.year, cf: r.cashFlow }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="year" stroke="#64748b" fontSize={11}/>
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={fmt}/>
            <Tooltip 
              contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "13px" }} 
              formatter={fmt}
            />
            <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" />
            <Bar dataKey="cf" name="Cash Flow" fill="#06b6d4" radius={[2, 2, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Net Worth, Mortgages & Ratios - ALL IN ONE */}
      <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(148,163,184,0.1)" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#a78bfa" }}>🏦 Net Worth, Mortgages & Financial Ratios</h3>
        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", lineHeight: 1.8 }}>
          <span style={{ color: "#a78bfa" }}>━━</span> Net Worth (left $) &nbsp;&nbsp;
          <span style={{ color: "#f97316" }}>━━</span> Primary Mtg (right $) &nbsp;&nbsp;
          <span style={{ color: "#f59e0b" }}>━━</span> Rental Mtg (right $) &nbsp;&nbsp;
          <br/>
          <span style={{ color: "#f472b6" }}>┅┅</span> Expense/Income % (far right) &nbsp;&nbsp;
          <span style={{ color: "#22d3ee" }}>┅┅</span> Liabilities/Assets % (far right) &nbsp;&nbsp;
          <span style={{ color: "#4ade80" }}>┅┅</span> Savings Rate % (far right)
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={enriched.map(r => ({ 
            year: r.year, 
            nw: r.netWorth, 
            primaryMtg: r.mortgageBalEnd, 
            rentalMtg: r.rentalMortgageBalEnd,
            expenseToIncome: Math.min(r.expenseToIncome || 0, 300),
            liabToAsset: Math.min(r.liabToAsset || 0, 300),
            savingsRate: Math.max(Math.min(r.savingsRate || 0, 300), -300),
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="year" stroke="#64748b" fontSize={11}/>
            {/* Left axis: Net Worth */}
            <YAxis yAxisId="nw" stroke="#a78bfa" fontSize={11} tickFormatter={fmt} orientation="left"/>
            {/* Right axis: Mortgages (own scale) */}
            <YAxis yAxisId="mtg" stroke="#f97316" fontSize={11} tickFormatter={fmt} orientation="right"/>
            {/* Far right: Ratios % — hidden axis, shares right side but with own domain */}
            <YAxis yAxisId="pct" stroke="#f472b6" fontSize={10} tickFormatter={(v) => v.toFixed(0) + '%'} orientation="right" hide/>
            <Tooltip 
              contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "13px" }} 
              formatter={(v, name) => {
                if (name.includes('%')) return v.toFixed(1) + '%';
                return fmt(v);
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }}/>
            <ReferenceLine yAxisId="nw" x={retireYear} stroke="#fb923c" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#fb923c', fontSize: 11 }} />
            {/* Net Worth */}
            <Line yAxisId="nw" type="monotone" dataKey="nw" stroke="#a78bfa" strokeWidth={3} dot={false} name="Net Worth"/>
            {/* Mortgages on their own scale */}
            <Line yAxisId="mtg" type="monotone" dataKey="primaryMtg" stroke="#f97316" strokeWidth={2} dot={false} name="Primary Mortgage"/>
            <Line yAxisId="mtg" type="monotone" dataKey="rentalMtg" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rental Mortgage"/>
            {/* Ratios as dashed lines */}
            <Line yAxisId="pct" type="monotone" dataKey="expenseToIncome" stroke="#f472b6" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Expense/Income %"/>
            <Line yAxisId="pct" type="monotone" dataKey="liabToAsset" stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Liabilities/Assets %"/>
            <Line yAxisId="pct" type="monotone" dataKey="savingsRate" stroke="#4ade80" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Savings Rate %"/>
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", textAlign: "center", fontStyle: "italic" }}>
          Ratio values clamped to ±300% for readability. Dashed lines = ratios (%).
        </div>
      </div>
    </div>
  );
};
