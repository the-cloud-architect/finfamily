export const fmt = v => {
  if (!v && v !== 0) return "$0";
  const a = Math.abs(v);
  return (v < 0 ? "-$" : "$") + (a >= 1e6 ? (a / 1e6).toFixed(2) + "M" : a >= 1e3 ? (a / 1e3).toFixed(0) + "K" : v.toFixed(0));
};

export const calcMonthlyPayment = (principal, annualRate, years) => {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = (annualRate / 100) / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
};

export const initData = (age = 45, spouseAge = 43, depAges = [10, 8, 5], retireAge = 65) => {
  const data = [];
  const YEARS = 35;
  const START_YEAR = 2025;
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

export const calcCumulative = (data, retireAge) => {
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
