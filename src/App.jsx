import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from "recharts";
import { supabase } from './supabaseClient';
import Auth from './Auth';

const YEARS = 35, START_YEAR = 2025;

const AnimatedTitle = () => {
  const [hover, setHover] = useState(false);
  return (
    <h1 onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ fontSize: "32px", fontWeight: "800", margin: 0, cursor: "pointer", display: "inline-block" }}>
      {["4", "C", "a", "s", "t"].map((char, idx) => (
        <span key={idx} style={{
          background: `linear-gradient(135deg, ${["#60a5fa", "#a78bfa", "#f472b6", "#22c55e", "#60a5fa"][idx]}, ${["#a78bfa", "#f472b6", "#22c55e", "#60a5fa", "#a78bfa"][idx]})`,
          backgroundSize: hover ? "300% 300%" : "100% 100%",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: hover ? `gradient 2s ease infinite ${idx * 0.1}s` : `${idx % 2 === 0 ? 'pulse' : 'float'} ${3 + idx * 0.5}s ease-in-out infinite`,
          display: "inline-block"
        }}>{char}</span>
      ))}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </h1>
  );
};

const calcMonthlyPayment = (principal, annualRate, years) => {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = (annualRate / 100) / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const initData = (age = 45, spouseAge = 43, depAges = [10, 8, 5], retireAge = 65) => {
  const data = [];
  const retireYearIdx = retireAge - age;
  const primaryMtgPayment = calcMonthlyPayment(200000, 6.5, 25) * 12;
  const rentalMtgPayment = calcMonthlyPayment(100000, 6.5, 20) * 12;
  
  for (let i = 0; i < YEARS; i++) {
    const yr = START_YEAR + i;
    const isRetired = i >= retireYearIdx;
    const incomeMultiplier = isRetired ? 1 : Math.pow(1.1, Math.floor(i / 5));
    const carPurchase = (yr >= 2028 && (yr - 2028) % 5 === 0) ? 20000 : 0;
    
    data.push({
      year: yr, age: age + i, spouseAge: spouseAge + i, dependents: depAges.length,
      dep1Age: depAges[0] ? depAges[0] + i : 0, dep2Age: depAges[1] ? depAges[1] + i : 0,
      dep3Age: depAges[2] ? depAges[2] + i : 0, dep4Age: depAges[3] ? depAges[3] + i : 0,
      dep5Age: depAges[4] ? depAges[4] + i : 0, dep6Age: depAges[5] ? depAges[5] + i : 0,
      dep7Age: depAges[6] ? depAges[6] + i : 0, dep8Age: depAges[7] ? depAges[7] + i : 0,
      dep9Age: depAges[8] ? depAges[8] + i : 0, dep10Age: depAges[9] ? depAges[9] + i : 0,
      cashIncome: isRetired ? 70000 : Math.round(280000 * incomeMultiplier),
      rsuIncome: isRetired ? 0 : Math.round(50000 * incomeMultiplier),
      match401k: isRetired ? 0 : Math.round(20000 * incomeMultiplier),
      investmentIncome: 0, rentalIncome: 0, taxRate: isRetired ? 15 : 24,
      stockGrowthRate: 7, homeGrowthRate: 3, rentalGrowthRate: 3, retirement401kGrowthRate: 3,
      carDepreciation: 15, machineDepreciation: 10, expenseInflationRate: 3,
      mortgagePayment: primaryMtgPayment, mortgageRate: 6.5, mortgageYears: 25,
      rentalMortgagePayment: rentalMtgPayment, rentalMortgageRate: 6.5, rentalMortgageYears: 20,
      homeTaxes: 4000, homeTaxGrowthRate: 3, rentalTaxes: 2000, rentalTaxGrowthRate: 3, hoaFees: 0,
      utilitiesExpense: 4800, foodExpense: 18000, clothingExpense: 4500, entertainmentExpense: 6000,
      vacationBudget: isRetired ? 50000 : 12000, educationExpense: 15000, healthcareExpense: 8000,
      healthInsurance: 12000, carInsurance: 3600, homeInsurance: 4200, transportExpense: 9600, miscExpense: 6000,
      carMaintenanceRate: 5,
      cashBalance: 50000, stocksBonds: 400000, retirement401k: 200000, 
      primaryHomeValue: 650000, rentalPropertyValue: 0, carValue: 45000, otherMachines: 10000,
      mortgageBalance: 200000, rentalMortgageBalance: 100000,
      carLoanBalance: 0, carLoanRate: 7, carLoanYears: 5, carLoanPayment: 0,
      otherDebt: 10000, helocLimit: 150000, helocUsed: 0, helocRate: 10,
      majorPurchase: 0, carPurchase: carPurchase,
    });
  }
  return data;
};

const fmt = v => { if (!v && v !== 0) return "$0"; const a = Math.abs(v); return (v < 0 ? "-$" : "$") + (a >= 1e6 ? (a/1e6).toFixed(2)+"M" : a >= 1e3 ? (a/1e3).toFixed(0)+"K" : v.toFixed(0)); };

const calcCumulative = (data, retireAge) => {
  const res = [];
  const baseExpenseInflation = data[0].expenseInflationRate;
  const baseHomeTaxGrowth = data[0].homeTaxGrowthRate;
  const baseRentalTaxGrowth = data[0].rentalTaxGrowthRate;
  const baseStockGrowth = data[0].stockGrowthRate;
  const baseHomeGrowth = data[0].homeGrowthRate;
  const baseRentalGrowth = data[0].rentalGrowthRate;
  const base401kGrowth = data[0].retirement401kGrowthRate;
  const baseCarDeprec = data[0].carDepreciation;
  const baseMachDeprec = data[0].machineDepreciation;
  const baseCarMaintRate = data[0].carMaintenanceRate;
  const baseHelocRate = data[0].helocRate;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const isRetired = (r.age >= retireAge);
    
    let depCost = 0;
    for (let d = 1; d <= r.dependents; d++) {
      const depAge = r[`dep${d}Age`];
      if (depAge > 0) {
        if (depAge < 18) depCost += 1500;
        else if (depAge >= 18 && depAge < 23) depCost += 3000;
      }
    }

    const gross = r.cashIncome + r.rsuIncome + r.match401k + r.investmentIncome + r.rentalIncome;
    const tax = (r.cashIncome + r.rsuIncome + r.investmentIncome) * (r.taxRate / 100);
    const afterTax = gross - tax;
    
    let mortgageBal = i === 0 ? r.mortgageBalance : res[i-1].mortgageBalEnd;
    let rentalMortgageBal = i === 0 ? r.rentalMortgageBalance : res[i-1].rentalMortgageBalEnd;
    let carLoanBal = i === 0 ? r.carLoanBalance : res[i-1].carLoanBalEnd;
    
    const mortgageInterest = mortgageBal > 0 ? mortgageBal * (r.mortgageRate / 100) : 0;
    const effectiveMtgPayment = mortgageBal > 0 ? Math.min(r.mortgagePayment, mortgageBal + mortgageInterest) : 0;
    const mortgagePrincipal = Math.max(0, effectiveMtgPayment - mortgageInterest);
    const mortgageBalEnd = Math.max(0, mortgageBal - mortgagePrincipal);
    
    const rentalInterest = rentalMortgageBal > 0 ? rentalMortgageBal * (r.rentalMortgageRate / 100) : 0;
    const effectiveRentalPayment = rentalMortgageBal > 0 ? Math.min(r.rentalMortgagePayment, rentalMortgageBal + rentalInterest) : 0;
    const rentalPrincipal = Math.max(0, effectiveRentalPayment - rentalInterest);
    const rentalMortgageBalEnd = Math.max(0, rentalMortgageBal - rentalPrincipal);
    
    const carLoanInterest = carLoanBal > 0 ? carLoanBal * (data[0].carLoanRate / 100) : 0;
    const carLoanPaymentEffective = carLoanBal > 0 ? Math.min(data[0].carLoanPayment, carLoanBal + carLoanInterest) : 0;
    const carLoanPrincipal = Math.max(0, carLoanPaymentEffective - carLoanInterest);
    const carLoanBalEnd = Math.max(0, carLoanBal - carLoanPrincipal);
    
    const homeTaxes = data[0].homeTaxes * Math.pow(1 + baseHomeTaxGrowth / 100, i);
    const rentalTaxes = data[0].rentalTaxes * Math.pow(1 + baseRentalTaxGrowth / 100, i);
    const helocUsed = r.helocUsed;
    const helocInterest = helocUsed * (baseHelocRate / 100);
    
    const inflationMult = Math.pow(1 + baseExpenseInflation / 100, i);
    const baseExpenses = (data[0].utilitiesExpense + data[0].foodExpense + data[0].clothingExpense + 
      data[0].entertainmentExpense + data[0].educationExpense + data[0].healthcareExpense + 
      data[0].healthInsurance + data[0].carInsurance + data[0].homeInsurance + 
      data[0].transportExpense + data[0].miscExpense) * inflationMult;
    const vacationBudget = r.vacationBudget * inflationMult;
    const carMaint = (i === 0 ? r.carValue : res[i-1].car) * (baseCarMaintRate / 100);
    
    const housingCost = effectiveMtgPayment + homeTaxes + r.hoaFees + effectiveRentalPayment + rentalTaxes + helocInterest;
    const exp = housingCost + baseExpenses + vacationBudget + depCost + carLoanPaymentEffective + carMaint;
    const cashFlow = afterTax - exp;
    
    let stocks, home, rental, car, mach, ret401k;
    if (i === 0) {
      stocks = r.stocksBonds; home = r.primaryHomeValue; rental = r.rentalPropertyValue;
      car = r.carValue + r.carPurchase; mach = r.otherMachines; ret401k = r.retirement401k;
    } else {
      const p = res[i-1];
      stocks = p.stocks * (1 + baseStockGrowth/100) + p.cashFlow;
      home = p.home * (1 + baseHomeGrowth/100);
      rental = p.rental * (1 + baseRentalGrowth/100);
      ret401k = p.ret401k * (1 + base401kGrowth/100);
      car = p.car * (1 - baseCarDeprec/100) + r.carPurchase;
      mach = p.mach * (1 - baseMachDeprec/100);
      
      let remaining = data[i-1].majorPurchase + data[i-1].carPurchase;
      if (remaining > 0) {
        if (stocks >= remaining) stocks -= remaining;
        else { remaining -= stocks; stocks = 0; ret401k = Math.max(0, ret401k - remaining); }
      }
    }
    
    const assets = r.cashBalance + stocks + ret401k + home + rental + car + mach;
    const debt = mortgageBalEnd + rentalMortgageBalEnd + carLoanBalEnd + r.otherDebt + helocUsed;
    
    res.push({ 
      ...r, gross, tax, afterTax, depCost, exp, cashFlow, stocks, home, rental, car, mach, ret401k,
      mortgageBal, mortgageInterest, mortgagePrincipal, mortgageBalEnd, effectiveMtgPayment,
      rentalMortgageBal, rentalInterest, rentalPrincipal, rentalMortgageBalEnd, effectiveRentalPayment,
      carLoanBalEnd, carLoanPaymentEffective, homeTaxes, rentalTaxes, helocInterest, housingCost, 
      baseExpenses, vacationBudget, carMaint, assets, debt, netWorth: assets - debt,
      cashRes: r.cashBalance + (r.helocLimit - helocUsed), isRetired,
      expenseToIncome: gross > 0 ? (exp/gross)*100 : 0,
      expenseToAfterTax: afterTax > 0 ? (exp/afterTax)*100 : 0,
      liabToAsset: assets > 0 ? (debt/assets)*100 : 0,
      savingsRate: gross > 0 ? (cashFlow/gross)*100 : 0,
    });
  }
  return res;
};

const Cell = ({ value, onChange, pct, num, isYear0 }) => {
  const [ed, setEd] = useState(false), [tmp, setTmp] = useState(value);
  const done = () => { setEd(false); onChange(pct || num ? parseFloat(tmp) || 0 : parseInt(tmp) || 0); };
  const textColor = isYear0 ? "#4ade80" : "#fff";
  if (ed) return <input type="number" value={tmp} onChange={e => setTmp(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} autoFocus style={{ width: "55px", padding: "2px", border: "2px solid #3b82f6", borderRadius: "3px", background: "#1e293b", color: textColor, fontSize: "10px", textAlign: "center" }} />;
  return <span onClick={() => { setTmp(value); setEd(true); }} style={{ cursor: "pointer", padding: "2px 4px", borderRadius: "3px", fontSize: "10px", background: "rgba(59,130,246,0.1)", border: "1px dashed rgba(59,130,246,0.3)", display: "inline-block", minWidth: "45px", textAlign: "center", color: textColor }}>{num ? value : pct ? value+"%" : fmt(value)}</span>;
};

const ScrollTable = ({ children }) => {
  const topRef = React.useRef(null), bottomRef = React.useRef(null);
  const [sw, setSw] = useState(0);
  React.useEffect(() => { if (bottomRef.current) setSw(bottomRef.current.scrollWidth); }, [children]);
  const sync = src => { if (src === 'top' && bottomRef.current && topRef.current) bottomRef.current.scrollLeft = topRef.current.scrollLeft; else if (src === 'bottom' && topRef.current && bottomRef.current) topRef.current.scrollLeft = bottomRef.current.scrollLeft; };
  return <div><div ref={topRef} onScroll={() => sync('top')} style={{ overflowX: "auto", height: "14px" }}><div style={{ width: sw, height: "1px" }} /></div><div ref={bottomRef} onScroll={() => sync('bottom')} style={{ overflowX: "auto" }}>{children}</div></div>;
};

const AccordionSection = ({ title, icon, color, isOpen, onToggle, children }) => (
  <>{<tr onClick={onToggle} style={{ cursor: "pointer" }}><td colSpan={YEARS + 1} style={{ background: `linear-gradient(90deg, ${color}20, transparent)`, padding: "5px 8px", fontWeight: "bold", color: color, fontSize: "10px" }}><span style={{ marginRight: "8px", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }}>▶</span>{icon} {title}</td></tr>}{isOpen && children}</>
);

export default function FourCast() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // App state
  const [age, setAge] = useState(45), [spouseAge, setSpouseAge] = useState(43), [retireAge, setRetireAge] = useState(65);
  const [depAges, setDepAges] = useState([10, 8, 5]);
  const [data, setData] = useState(() => initData(45, 43, [10, 8, 5], 65));
  const [tab, setTab] = useState("variables"), [scenarios, setScenarios] = useState([]), [scenarioName, setScenarioName] = useState("");
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [sections, setSections] = useState({ income: true, dependents: true, housing: true, expenses: true, cashflow: true, assets: true, liabilities: true, purchases: true, summary: true });
  const toggleSection = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Check if user is already logged in
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

  // Load scenarios from Supabase when user logs in
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
      
      // Transform database scenarios to app format
      const transformedScenarios = (scenarioData || []).map(s => ({
        id: s.id,
        name: s.name,
        data: s.data.data,
        age: s.data.age,
        spouseAge: s.data.spouseAge,
        retireAge: s.data.retireAge,
        depAges: s.data.depAges,
        updated_at: s.updated_at
      }));
      
      setScenarios(transformedScenarios);
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
  
  const update = (idx, field, value) => setData(prev => { const next = [...prev]; const endIdx = Math.min(YEARS, retireYearIdx); for (let i = idx; i < endIdx; i++) next[i] = { ...next[i], [field]: value }; return next; });
  const updateYear0 = (field, value) => setData(prev => { const next = [...prev]; next[0] = { ...next[0], [field]: value }; return next; });
  const updateHelocUsed = (idx, value) => setData(prev => { const next = [...prev]; for (let i = idx; i < YEARS; i++) next[i] = { ...next[i], helocUsed: value }; return next; });
  const updateSingleYear = (idx, field, value) => setData(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next; });
  
  const updateMortgage = (field, value) => {
    setData(prev => {
      const next = [...prev]; next[0] = { ...next[0], [field]: value };
      const bal = field === 'mortgageBalance' ? value : next[0].mortgageBalance;
      const rate = field === 'mortgageRate' ? value : next[0].mortgageRate;
      const yrs = field === 'mortgageYears' ? value : next[0].mortgageYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { next[i] = { ...next[i], mortgagePayment: payment, mortgageRate: rate, mortgageYears: yrs }; if (i === 0) next[i].mortgageBalance = bal; }
      return next;
    });
  };
  
  const updateRentalMortgage = (field, value) => {
    setData(prev => {
      const next = [...prev]; next[0] = { ...next[0], [field]: value };
      const bal = field === 'rentalMortgageBalance' ? value : next[0].rentalMortgageBalance;
      const rate = field === 'rentalMortgageRate' ? value : next[0].rentalMortgageRate;
      const yrs = field === 'rentalMortgageYears' ? value : next[0].rentalMortgageYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { next[i] = { ...next[i], rentalMortgagePayment: payment, rentalMortgageRate: rate, rentalMortgageYears: yrs }; if (i === 0) next[i].rentalMortgageBalance = bal; }
      return next;
    });
  };
  
  const updateCarLoan = (field, value) => {
    setData(prev => {
      const next = [...prev]; next[0] = { ...next[0], [field]: value };
      const bal = field === 'carLoanBalance' ? value : next[0].carLoanBalance;
      const rate = field === 'carLoanRate' ? value : next[0].carLoanRate;
      const yrs = field === 'carLoanYears' ? value : next[0].carLoanYears;
      const payment = calcMonthlyPayment(bal, rate, yrs) * 12;
      for (let i = 0; i < YEARS; i++) { next[i] = { ...next[i], carLoanPayment: payment, carLoanRate: rate, carLoanYears: yrs }; if (i === 0) next[i].carLoanBalance = bal; }
      return next;
    });
  };
  
  const updateDeps = (count) => {
    const newCount = Math.min(10, Math.max(0, count));
    const newAges = [...depAges]; while (newAges.length < newCount) newAges.push(5); while (newAges.length > newCount) newAges.pop();
    setDepAges(newAges);
    setData(prev => prev.map((r, i) => { const updated = { ...r, dependents: newCount }; for (let d = 1; d <= 10; d++) updated[`dep${d}Age`] = newAges[d-1] ? newAges[d-1] + i : 0; return updated; }));
  };
  
  const updateDepAge = (depIdx, newAge) => { const newAges = [...depAges]; newAges[depIdx] = newAge; setDepAges(newAges); setData(prev => prev.map((r, i) => ({ ...r, [`dep${depIdx+1}Age`]: newAge + i }))); };
  const updateAges = (newAge, newSpouseAge) => { setAge(newAge); setSpouseAge(newSpouseAge); setData(prev => prev.map((r, i) => ({ ...r, age: newAge + i, spouseAge: newSpouseAge + i }))); };
  
  // Save new scenario to Supabase
  const saveScenario = async () => {
    if (!scenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }
    
    setSaving(true);
    try {
      // Check if scenario with this name already exists
      const existingScenario = scenarios.find(s => s.name === scenarioName);
      
      const scenarioPayload = {
        data: JSON.parse(JSON.stringify(data)),
        age,
        spouseAge,
        retireAge,
        depAges
      };

      if (existingScenario) {
        // Update existing scenario
        const { error } = await supabase
          .from('scenarios')
          .update({
            data: scenarioPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingScenario.id);

        if (error) throw error;
        setActiveScenarioId(existingScenario.id);
      } else {
        // Create new scenario
        const { data: newScenario, error } = await supabase
          .from('scenarios')
          .insert([{
            user_id: user.id,
            name: scenarioName,
            data: scenarioPayload
          }])
          .select()
          .single();

        if (error) throw error;
        setActiveScenarioId(newScenario.id);
      }

      setActiveScenario(scenarioName);
      await loadScenariosFromDB();
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Error saving scenario: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save current active scenario
  const saveCurrentScenario = async () => {
    if (!activeScenarioId) return;
    
    setSaving(true);
    try {
      const scenarioPayload = {
        data: JSON.parse(JSON.stringify(data)),
        age,
        spouseAge,
        retireAge,
        depAges
      };

      const { error } = await supabase
        .from('scenarios')
        .update({
          data: scenarioPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeScenarioId);

      if (error) throw error;
      await loadScenariosFromDB();
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Error saving scenario: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Load a scenario
  const loadScenario = (s) => {
    setData(s.data);
    setAge(s.age);
    setSpouseAge(s.spouseAge || 43);
    setRetireAge(s.retireAge);
    setDepAges(s.depAges || [10, 8, 5]);
    setActiveScenario(s.name);
    setActiveScenarioId(s.id);
    setScenarioName(s.name);
  };

  // Delete a scenario
  const deleteScenario = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (activeScenarioId === id) {
        setActiveScenario(null);
        setActiveScenarioId(null);
      }
      
      await loadScenariosFromDB();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert('Error deleting scenario: ' + error.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setScenarios([]);
    setActiveScenario(null);
    setActiveScenarioId(null);
    // Reset to default data
    setAge(45);
    setSpouseAge(43);
    setRetireAge(65);
    setDepAges([10, 8, 5]);
    setData(initData(45, 43, [10, 8, 5], 65));
  };

  const isRet = yr => (yr - START_YEAR + age) >= retireAge;
  const retireYear = START_YEAR + (retireAge - age);
  const stickyTh = { padding: "6px 3px", textAlign: "left", borderBottom: "2px solid #6366f1", fontSize: "9px", minWidth: "120px", position: "sticky", left: 0, background: "#1e293b", zIndex: 10 };
  const stickyTd = { position: "sticky", left: 0, background: "#1e293b", padding: "4px 6px", zIndex: 5, textAlign: "left" };
  const cellStyle = { padding: "3px", textAlign: "center" };
  const bg = (yr, i) => isRet(yr) ? "rgba(251,146,60,0.08)" : i % 5 === 0 ? "rgba(99,102,241,0.05)" : "transparent";
  const thStyle = { padding: "6px 3px", textAlign: "center", borderBottom: "2px solid #6366f1", fontSize: "9px", minWidth: "70px" };

  const ageHeader = (r) => {
    const deps = [];
    for (let d = 1; d <= r.dependents; d++) if (r[`dep${d}Age`] > 0) deps.push({ age: r[`dep${d}Age`], isMinor: r[`dep${d}Age`] < 18 });
    return <><span style={{ color: isRet(r.year) ? "#fb923c" : "#64748b", fontSize: "8px" }}>You:{r.age} Sp:{r.spouseAge}</span><br/>{deps.length > 0 && <span style={{ fontSize: "7px" }}>K:{deps.map((d, idx) => <span key={idx} style={{ color: d.isMinor ? "#ec4899" : "#e2e8f0" }}>{d.age}{idx < deps.length - 1 ? ',' : ''}</span>)}</span>}</>;
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#e2e8f0", fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'SF Mono', monospace", color: "#e2e8f0", padding: "12px" }}>
      {/* Header with user info */}
      <header style={{ textAlign: "center", marginBottom: "16px", position: "relative" }}>
        <div style={{ position: "absolute", right: "0", top: "0", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{user.email}</span>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: "4px 10px", 
              background: "rgba(239,68,68,0.2)", 
              border: "1px solid #ef4444", 
              borderRadius: "4px", 
              color: "#ef4444", 
              fontSize: "10px", 
              cursor: "pointer" 
            }}
          >
            Sign Out
          </button>
        </div>
        <AnimatedTitle />
        <p style={{ color: "#64748b", fontSize: "11px", margin: "4px 0 0", letterSpacing: "2px" }}>35-YEAR HOUSEHOLD PROJECTION</p>
      </header>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px", justifyContent: "center", alignItems: "center" }}>
        {[["You:", age, v => updateAges(v, spouseAge)], ["Spouse:", spouseAge, v => updateAges(age, v)], ["Retire:", retireAge, setRetireAge], ["#Kids:", depAges.length, updateDeps]].map(([l, v, fn], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30,41,59,0.8)", padding: "6px 10px", borderRadius: "6px" }}>
            <label style={{ fontSize: "10px", color: "#94a3b8" }}>{l}</label>
            <input type="number" value={v} onChange={e => fn(parseInt(e.target.value) || 0)} style={{ width: "40px", padding: "3px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "10px", textAlign: "center" }} />
          </div>
        ))}
        {depAges.map((a, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(236,72,153,0.2)", padding: "4px 8px", borderRadius: "6px" }}>
            <label style={{ fontSize: "9px", color: "#ec4899" }}>K{idx+1}:</label>
            <input type="number" value={a} onChange={e => updateDepAge(idx, parseInt(e.target.value) || 0)} style={{ width: "30px", padding: "2px", background: "#1e293b", border: "1px solid #475569", borderRadius: "3px", color: "#fff", fontSize: "10px", textAlign: "center" }} />
          </div>
        ))}
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
              fontSize: "9px", 
              cursor: saving ? "not-allowed" : "pointer", 
              fontWeight: "bold" 
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
            onChange={e => setScenarioName(e.target.value)} 
            style={{ width: "90px", padding: "3px 6px", background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", color: "#fff", fontSize: "10px" }} 
          />
          <button 
            onClick={saveScenario} 
            disabled={saving}
            style={{ 
              padding: "3px 8px", 
              background: saving ? "#475569" : "#22c55e", 
              border: "none", 
              borderRadius: "4px", 
              color: "#fff", 
              fontSize: "9px", 
              cursor: saving ? "not-allowed" : "pointer" 
            }}
          >
            {saving ? "..." : "Save As"}
          </button>
        </div>
        {loadingScenarios ? (
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>Loading scenarios...</span>
        ) : (
          scenarios.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "4px", background: activeScenarioId === s.id ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.2)", padding: "3px 8px", borderRadius: "4px", border: activeScenarioId === s.id ? "1px solid #22c55e" : "none" }}>
              <button onClick={() => loadScenario(s)} style={{ background: "none", border: "none", color: activeScenarioId === s.id ? "#4ade80" : "#a78bfa", fontSize: "9px", cursor: "pointer" }}>{s.name}</button>
              <button onClick={() => deleteScenario(s.id, s.name)} style={{ background: "none", border: "none", color: "#f87171", fontSize: "9px", cursor: "pointer" }}>×</button>
            </div>
          ))
        )}
      </div>
      
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "center" }}>
        {[["variables", "⚙️ Variables"], ["summary", "📊 Summary"], ["charts", "📈 Charts"]].map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "6px 16px", background: tab === k ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent", border: tab === k ? "none" : "1px solid rgba(148,163,184,0.2)", borderRadius: "5px", color: tab === k ? "#fff" : "#94a3b8", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{v}</button>)}
      </div>

      <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", border: "1px solid rgba(148,163,184,0.2)", marginBottom: "12px", fontSize: "9px", color: "#94a3b8" }}>
        <strong style={{ color: "#a78bfa" }}>📋 Tips:</strong> <span style={{ color: "#4ade80" }}>Green</span>=Year 1 inputs | <span style={{ color: "#60a5fa" }}>Blue</span>=calculated | <span style={{ color: "#fb923c" }}>Orange</span>=retirement | Click headers to expand/collapse | <span style={{ color: "#22c55e" }}>☁️ Cloud synced</span>
      </div>

      {tab === "variables" && (
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
          <ScrollTable>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead><tr><th style={stickyTh}>Category</th>{enriched.map((r, i) => <th key={r.year} style={{ ...thStyle, background: isRet(r.year) ? "rgba(251,146,60,0.15)" : i % 5 === 0 ? "rgba(99,102,241,0.1)" : "transparent" }}>{r.year}<br/>{ageHeader(r)}</th>)}</tr></thead>
              <tbody>
                <AccordionSection title="INCOME" icon="💰" color="#22c55e" isOpen={sections.income} onToggle={() => toggleSection('income')}>
                  {[["cashIncome", "Cash"], ["rsuIncome", "RSU"], ["match401k", "401k Match"], ["investmentIncome", "Investment Income"], ["rentalIncome", "Rental Income"], ["taxRate", "Tax Rate %", true]].map(([k, l, pct]) => <tr key={k}><td style={stickyTd}>{l}</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i][k]} onChange={v => update(i, k, v)} pct={pct} isYear0={i === 0} /></td>)}</tr>)}
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#22c55e" }}>Total Income</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#22c55e", background: bg(r.year, i) }}>{fmt(r.gross)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#4ade80" }}>After Tax</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#4ade80", background: bg(r.year, i) }}>{fmt(r.afterTax)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="DEPENDENTS" icon="👨‍👩‍👧‍👦" color="#ec4899" isOpen={sections.dependents} onToggle={() => toggleSection('dependents')}>
                  <tr><td style={stickyTd}># Dependents</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].dependents} onChange={v => updateDeps(v)} num isYear0={true} /> : <span>{r.dependents}</span>}</td>)}</tr>
                  {depAges.map((_, idx) => (<tr key={`dep${idx}`}><td style={stickyTd}>Kid {idx+1} Age</td>{enriched.map((r, i) => { const a = r[`dep${idx+1}Age`]; return <td key={r.year} style={{ ...cellStyle, color: a && a < 18 ? "#ec4899" : "#e2e8f0", background: bg(r.year, i) }}>{a || '-'}</td>; })}</tr>))}
                  <tr><td style={{ ...stickyTd, color: "#ec4899" }}>Dep Cost</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#ec4899", background: bg(r.year, i) }}>{fmt(r.depCost)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="HOUSING COSTS" icon="🏠" color="#f97316" isOpen={sections.housing} onToggle={() => toggleSection('housing')}>
                  <tr><td style={{ ...stickyTd, color: "#60a5fa" }}>Primary Mtg Pmt</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#60a5fa", background: bg(r.year, i) }}>{fmt(r.effectiveMtgPayment)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#64748b" }}>↳ Interest</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>{fmt(r.mortgageInterest)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#64748b" }}>↳ Principal</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#4ade80", background: bg(r.year, i) }}>{fmt(r.mortgagePrincipal)}</td>)}</tr>
                  <tr><td style={stickyTd}>Home Taxes</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].homeTaxes} onChange={v => updateYear0("homeTaxes", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.homeTaxes)}</span>}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#60a5fa" }}>Rental Mtg Pmt</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#60a5fa", background: bg(r.year, i) }}>{fmt(r.effectiveRentalPayment)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#64748b" }}>↳ Interest</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>{fmt(r.rentalInterest)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#64748b" }}>↳ Principal</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#4ade80", background: bg(r.year, i) }}>{fmt(r.rentalPrincipal)}</td>)}</tr>
                  <tr><td style={stickyTd}>Rental Taxes</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].rentalTaxes} onChange={v => updateYear0("rentalTaxes", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.rentalTaxes)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>HOA</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].hoaFees} onChange={v => updateYear0("hoaFees", v)} isYear0={true} /> : <span>{fmt(data[0].hoaFees)}</span>}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#f87171" }}>HELOC Interest</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.helocInterest > 0 ? "#f87171" : "#64748b", background: bg(r.year, i) }}>{fmt(r.helocInterest)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#f97316" }}>Total Housing</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#f97316", background: bg(r.year, i) }}>{fmt(r.housingCost)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title={`OTHER EXPENSES (${data[0].expenseInflationRate}% inflation)`} icon="💸" color="#ef4444" isOpen={sections.expenses} onToggle={() => toggleSection('expenses')}>
                  <tr><td style={stickyTd}>Inflation %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].expenseInflationRate} onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#64748b", background: bg(r.year, i+1) }}></td>)}</tr>
                  {[["utilitiesExpense", "Utilities"], ["foodExpense", "Food"], ["clothingExpense", "Clothing"], ["entertainmentExpense", "Entertainment"], ["vacationBudget", "Vacation"], ["educationExpense", "Education"], ["healthcareExpense", "Healthcare"], ["healthInsurance", "Health Ins"], ["carInsurance", "Car Ins"], ["homeInsurance", "Home Ins"], ["transportExpense", "Transport"], ["miscExpense", "Misc"]].map(([k, l]) => (
                    <tr key={k}><td style={stickyTd}>{l}</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>{k === 'vacationBudget' ? <Cell value={data[0][k]} onChange={v => update(0, k, v)} isYear0={true} /> : <Cell value={data[0][k]} onChange={v => updateYear0(k, v)} isYear0={true} />}</td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#64748b", background: bg(r.year, i+1) }}>{k === 'vacationBudget' ? fmt(r.vacationBudget) : fmt(data[0][k] * Math.pow(1 + data[0].expenseInflationRate / 100, i+1))}</td>)}</tr>
                  ))}
                  <tr><td style={stickyTd}>Car Maint %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].carMaintenanceRate} onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#8b5cf6" }}>Car Maintenance</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#8b5cf6", background: bg(r.year, i) }}>{fmt(r.carMaint)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#60a5fa" }}>Car Loan Pmt</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.carLoanPaymentEffective > 0 ? "#60a5fa" : "#64748b", background: bg(r.year, i) }}>{fmt(r.carLoanPaymentEffective)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#ef4444" }}>Total Expenses</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#ef4444", background: bg(r.year, i) }}>{fmt(r.exp)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="CASH FLOW" icon="💵" color="#06b6d4" isOpen={sections.cashflow} onToggle={() => toggleSection('cashflow')}>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Net Cash Flow</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: r.cashFlow >= 0 ? "#4ade80" : "#f87171", background: bg(r.year, i) }}>{fmt(r.cashFlow)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="ASSETS" icon="🏦" color="#3b82f6" isOpen={sections.assets} onToggle={() => toggleSection('assets')}>
                  <tr><td style={stickyTd}>Cash</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i].cashBalance} onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0} /></td>)}</tr>
                  <tr><td style={stickyTd}>Stocks/Bonds</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].stocksBonds} onChange={v => updateYear0("stocksBonds", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.stocks)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Growth %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].stockGrowthRate} onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>401k</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].retirement401k} onChange={v => updateYear0("retirement401k", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.ret401k)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Growth %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].retirement401kGrowthRate} onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Home</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].primaryHomeValue} onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.home)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Growth %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].homeGrowthRate} onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Rental</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].rentalPropertyValue} onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true} /> : <span style={{color:"#60a5fa"}}>{fmt(r.rental)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>Car</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].carValue} onChange={v => updateYear0("carValue", v)} isYear0={true} /> : <span style={{color:"#f87171"}}>{fmt(r.car)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Deprec %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].carDepreciation} onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Machines</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].otherMachines} onChange={v => updateYear0("otherMachines", v)} isYear0={true} /> : <span style={{color:"#f87171"}}>{fmt(r.mach)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>HELOC Limit</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[i].helocLimit} onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true} /> : <span>{fmt(data[0].helocLimit)}</span>}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#3b82f6" }}>Total Assets</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#3b82f6", background: bg(r.year, i) }}>{fmt(r.assets)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="LIABILITIES" icon="📉" color="#f97316" isOpen={sections.liabilities} onToggle={() => toggleSection('liabilities')}>
                  <tr><td style={stickyTd}>Primary Mtg Bal</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].mortgageBalance} onChange={v => updateMortgage("mortgageBalance", v)} isYear0={true} /> : <span style={{color: r.mortgageBalEnd > 0 ? "#f97316" : "#4ade80"}}>{fmt(r.mortgageBalEnd)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Rate%/Yrs</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].mortgageRate} onChange={v => updateMortgage("mortgageRate", v)} pct isYear0={true} /> <Cell value={data[0].mortgageYears} onChange={v => updateMortgage("mortgageYears", v)} num isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Rental Mtg Bal</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].rentalMortgageBalance} onChange={v => updateRentalMortgage("rentalMortgageBalance", v)} isYear0={true} /> : <span style={{color: r.rentalMortgageBalEnd > 0 ? "#f97316" : "#4ade80"}}>{fmt(r.rentalMortgageBalEnd)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Rate%/Yrs</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].rentalMortgageRate} onChange={v => updateRentalMortgage("rentalMortgageRate", v)} pct isYear0={true} /> <Cell value={data[0].rentalMortgageYears} onChange={v => updateRentalMortgage("rentalMortgageYears", v)} num isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Car Loan Bal</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>{i === 0 ? <Cell value={data[0].carLoanBalance} onChange={v => updateCarLoan("carLoanBalance", v)} isYear0={true} /> : <span style={{color: r.carLoanBalEnd > 0 ? "#f97316" : "#4ade80"}}>{fmt(r.carLoanBalEnd)}</span>}</td>)}</tr>
                  <tr><td style={stickyTd}>↳ Rate%/Yrs</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].carLoanRate} onChange={v => updateCarLoan("carLoanRate", v)} pct isYear0={true} /> <Cell value={data[0].carLoanYears} onChange={v => updateCarLoan("carLoanYears", v)} num isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={stickyTd}>Other Debt</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i].otherDebt} onChange={v => updateSingleYear(i, "otherDebt", v)} isYear0={i === 0} /></td>)}</tr>
                  <tr><td style={stickyTd}>HELOC Used</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i].helocUsed} onChange={v => updateHelocUsed(i, v)} isYear0={i === 0} /></td>)}</tr>
                  <tr><td style={stickyTd}>↳ Rate %</td><td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}><Cell value={data[0].helocRate} onChange={v => updateYear0("helocRate", v)} pct isYear0={true} /></td>{enriched.slice(1).map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>)}</tr>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#f97316" }}>Total Liabilities</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#f97316", background: bg(r.year, i) }}>{fmt(r.debt)}</td>)}</tr>
                </AccordionSection>

                <AccordionSection title="MAJOR PURCHASES" icon="🛒" color="#8b5cf6" isOpen={sections.purchases} onToggle={() => toggleSection('purchases')}>
                  <tr><td style={stickyTd}>Major Purchase</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i].majorPurchase} onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0} /></td>)}</tr>
                  <tr><td style={stickyTd}>Car Purchase</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}><Cell value={data[i].carPurchase} onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0} /></td>)}</tr>
                </AccordionSection>

                <AccordionSection title="SUMMARY" icon="💎" color="#a78bfa" isOpen={sections.summary} onToggle={() => toggleSection('summary')}>
                  <tr><td style={{ ...stickyTd, fontWeight: "bold", color: "#a78bfa" }}>Net Worth</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#a78bfa", background: "rgba(167,139,250,0.1)" }}>{fmt(r.netWorth)}</td>)}</tr>
                  <tr><td style={{ ...stickyTd, color: "#06b6d4" }}>Cash Reserve</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#06b6d4", background: bg(r.year, i) }}>{fmt(r.cashRes)}</td>)}</tr>
                </AccordionSection>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      )}

      {tab === "summary" && (
        <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
          <ScrollTable>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead><tr><th style={stickyTh}>Metric</th>{enriched.map((r, i) => <th key={r.year} style={{ ...thStyle, background: isRet(r.year) ? "rgba(251,146,60,0.15)" : i % 5 === 0 ? "rgba(99,102,241,0.1)" : "transparent" }}>{r.year}<br/>{ageHeader(r)}</th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #22c55e20, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#22c55e", fontSize: "10px" }}>💰 INCOME</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Gross Income</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", background: bg(r.year, i) }}>{fmt(r.gross)}</td>)}</tr>
                <tr><td style={stickyTd}>Taxes</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>{fmt(r.tax)}</td>)}</tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>After Tax</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#4ade80", background: bg(r.year, i) }}>{fmt(r.afterTax)}</td>)}</tr>
                
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #ef444420, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#ef4444", fontSize: "10px" }}>💸 EXPENSES</td></tr>
                <tr><td style={stickyTd}>Housing</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#f97316", background: bg(r.year, i) }}>{fmt(r.housingCost)}</td>)}</tr>
                <tr><td style={stickyTd}>Vacation</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#a78bfa", background: bg(r.year, i) }}>{fmt(r.vacationBudget)}</td>)}</tr>
                <tr><td style={stickyTd}>Car Pmt + Maint</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#8b5cf6", background: bg(r.year, i) }}>{fmt(r.carLoanPaymentEffective + r.carMaint)}</td>)}</tr>
                <tr><td style={stickyTd}>Other Expenses</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#ef4444", background: bg(r.year, i) }}>{fmt(r.baseExpenses)}</td>)}</tr>
                <tr><td style={stickyTd}>Dependents</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#ec4899", background: bg(r.year, i) }}>{fmt(r.depCost)}</td>)}</tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Total Expenses</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#f87171", background: bg(r.year, i) }}>{fmt(r.exp)}</td>)}</tr>
                
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #06b6d420, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#06b6d4", fontSize: "10px" }}>💵 CASH FLOW</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Net Cash Flow</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: r.cashFlow >= 0 ? "#4ade80" : "#f87171", background: bg(r.year, i) }}>{fmt(r.cashFlow)}</td>)}</tr>
                
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #3b82f620, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#3b82f6", fontSize: "10px" }}>🏦 BALANCE SHEET</td></tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold" }}>Total Assets</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", background: bg(r.year, i) }}>{fmt(r.assets)}</td>)}</tr>
                <tr><td style={stickyTd}>Total Liabilities</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>{fmt(r.debt)}</td>)}</tr>
                <tr><td style={{ ...stickyTd, fontWeight: "bold", background: "#1e3a5f" }}>Net Worth</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: "#60a5fa", background: "rgba(59,130,246,0.2)" }}>{fmt(r.netWorth)}</td>)}</tr>
                
                <tr><td colSpan={YEARS + 1} style={{ background: "linear-gradient(90deg, #f59e0b20, transparent)", padding: "4px 8px", fontWeight: "bold", color: "#f59e0b", fontSize: "10px" }}>📐 KEY RATIOS</td></tr>
                <tr><td style={stickyTd}>Expense / Income</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.expenseToIncome > 90 ? "#f87171" : r.expenseToIncome > 70 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.expenseToIncome.toFixed(0)}%</td>)}</tr>
                <tr><td style={stickyTd}>Expense / After-Tax</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.expenseToAfterTax > 100 ? "#f87171" : r.expenseToAfterTax > 80 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.expenseToAfterTax.toFixed(0)}%</td>)}</tr>
                <tr><td style={stickyTd}>Liabilities / Assets</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.liabToAsset > 50 ? "#f87171" : r.liabToAsset > 30 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.liabToAsset.toFixed(0)}%</td>)}</tr>
                <tr><td style={stickyTd}>Savings Rate</td>{enriched.map((r, i) => <td key={r.year} style={{ ...cellStyle, color: r.savingsRate < 10 ? "#f87171" : r.savingsRate < 20 ? "#fbbf24" : "#4ade80", background: bg(r.year, i) }}>{r.savingsRate.toFixed(0)}%</td>)}</tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      )}

      {tab === "charts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(148,163,184,0.2)", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "4px", minWidth: "max-content" }}>
              {enriched.map((r) => {
                const deps = []; for (let d = 1; d <= r.dependents; d++) if (r[`dep${d}Age`] > 0) deps.push({ age: r[`dep${d}Age`], isMinor: r[`dep${d}Age`] < 18 });
                return (
                  <div key={r.year} style={{ textAlign: "center", padding: "4px 6px", background: isRet(r.year) ? "rgba(251,146,60,0.2)" : "rgba(99,102,241,0.1)", borderRadius: "4px", minWidth: "50px", fontSize: "8px" }}>
                    <div style={{ color: isRet(r.year) ? "#fb923c" : "#a78bfa", fontWeight: "bold" }}>{r.year}</div>
                    <div style={{ color: "#64748b" }}>You:{r.age} Sp:{r.spouseAge}</div>
                    {deps.length > 0 && <div>K:{deps.map((d, idx) => <span key={idx} style={{ color: d.isMinor ? "#ec4899" : "#e2e8f0" }}>{d.age}{idx < deps.length - 1 ? ',' : ''}</span>)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#60a5fa" }}>📈 Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={enriched.map(r => ({ year: r.year, income: r.gross, expenses: r.exp }))}>
                <defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/>
                <Legend wrapperStyle={{ fontSize: "10px" }}/>
                <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" label={{ value: `Retire`, fill: '#fb923c', fontSize: 9 }} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#ig)" name="Income"/><Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#eg)" name="Expenses"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#06b6d4" }}>💵 Net Cash Flow</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={enriched.map(r => ({ year: r.year, cf: r.cashFlow }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/>
                <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" />
                <Bar dataKey="cf" name="Cash Flow" fill="#06b6d4" radius={[2, 2, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "#a78bfa" }}>🏦 Net Worth & Mortgages</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enriched.map(r => ({ year: r.year, nw: r.netWorth, primaryMtg: r.mortgageBalEnd, rentalMtg: r.rentalMortgageBalEnd }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="year" stroke="#64748b" fontSize={9}/><YAxis stroke="#64748b" fontSize={9} tickFormatter={fmt}/>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "10px" }} formatter={fmt}/>
                <Legend wrapperStyle={{ fontSize: "10px" }}/>
                <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" label={{ value: `Retire`, fill: '#fb923c', fontSize: 9 }} />
                <Line type="monotone" dataKey="nw" stroke="#a78bfa" strokeWidth={3} dot={false} name="Net Worth"/>
                <Line type="monotone" dataKey="primaryMtg" stroke="#f97316" strokeWidth={2} dot={false} name="Primary Mortgage"/>
                <Line type="monotone" dataKey="rentalMtg" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rental Mortgage"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {[
              { l: `Start NW (${enriched[0].year})`, v: enriched[0].netWorth, c: "#a78bfa" },
              { l: `End NW (${enriched[YEARS-1].year})`, v: enriched[YEARS-1].netWorth, c: "#22c55e" },
              { l: "NW Growth", v: enriched[YEARS-1].netWorth - enriched[0].netWorth, c: "#60a5fa", p: ((enriched[YEARS-1].netWorth - enriched[0].netWorth) / Math.max(1, enriched[0].netWorth) * 100).toFixed(0) + "%" },
              { l: "Avg CF Pre-Retire", v: retirementAnalysis.avgCashFlowPre, c: "#4ade80" },
              { l: "Avg CF Post-Retire", v: retirementAnalysis.avgCashFlowPost, c: "#fb923c" },
              { l: "Year 1 Expenses", v: retirementAnalysis.totalExpYear1, c: "#ef4444" },
              { l: "NW at Retirement", v: retirementAnalysis.retireStartNetWorth, c: "#06b6d4" },
              { l: "Max Retire Spend (keep $1M)", v: retirementAnalysis.maxRetireSpend, c: "#f472b6" },
            ].map((x, i) => (
              <div key={i} style={{ background: "rgba(30,41,59,0.8)", borderRadius: "8px", padding: "12px", border: `1px solid ${x.c}40`, textAlign: "center" }}>
                <div style={{ color: "#94a3b8", fontSize: "8px", marginBottom: "4px", textTransform: "uppercase" }}>{x.l}</div>
                <div style={{ color: x.c, fontSize: "16px", fontWeight: "bold" }}>{fmt(x.v)}</div>
                {x.p && <div style={{ color: "#4ade80", fontSize: "10px" }}>+{x.p}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <footer style={{ marginTop: "24px", textAlign: "center", color: "#475569", fontSize: "9px" }}>4Cast • Retire: {retireYear} (Age {retireAge}) • ☁️ Synced to Cloud</footer>
    </div>
  );
}
