import React from 'react';
import { Cell, AccordionSection, RatioCell } from './components';
import { fmt } from './utils';
import { COLORS } from './constants';

export const VariablesTablePart2Sections = ({ 
  enriched, 
  data, 
  sections, 
  toggleSection,
  update,
  updateYear0,
  updateSingleYear,
  updateCascade,
  updateCascadeAll,
  updateHelocUsed,
  updateMortgage,
  updateRentalMortgage,
  updateCarLoan,
  updateDeps,
  isRet,
  bg,
  stickyTd,
  cellStyle,
  depAges,
  sectionGroup
}) => {
  return (
    <>
      {/* 1. FINANCIAL RATIOS SECTION */}
      <AccordionSection title="FINANCIAL RATIOS" icon="📐" color={COLORS.sections.ratios} isOpen={sections.ratios} onToggle={() => toggleSection('ratios')}>
        <tr>
          <td style={{ ...stickyTd, color: "#f472b6" }}>Expense/Income %</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <RatioCell value={r.expenseToIncome || 0} thresholds={{ higherIsBad: true, danger: 90, warn: 70 }} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#22d3ee" }}>Expense/After-Tax %</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <RatioCell value={r.expenseToAfterTax || 0} thresholds={{ higherIsBad: true, danger: 100, warn: 80 }} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#fb923c" }}>Liabilities/Assets %</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <RatioCell value={r.liabToAsset || 0} thresholds={{ higherIsBad: true, danger: 50, warn: 30 }} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#4ade80" }}>Savings Rate %</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <RatioCell value={r.savingsRate || 0} thresholds={{ higherIsBad: false, danger: 10, warn: 20 }} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#60a5fa" }}>Assets/Liabilities</td>
          {enriched.map((r, i) => {
            const assetToLiab = r.debt > 0 ? (r.assets / r.debt) : (r.assets > 0 ? 999 : 0);
            let color = COLORS.success;
            if (assetToLiab < 1) color = COLORS.danger;
            else if (assetToLiab < 2) color = COLORS.warning;
            return (
              <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
                <span style={{
                  padding: "2px 4px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  background: `${color}20`,
                  border: `1px solid ${color}50`,
                  display: "inline-block",
                  minWidth: "50px",
                  textAlign: "center",
                  color: color,
                  fontWeight: "600"
                }}>
                  {assetToLiab >= 999 ? "∞" : assetToLiab.toFixed(1) + "x"}
                </span>
              </td>
            );
          })}
        </tr>
      </AccordionSection>

      {/* 2. SUMMARY SECTION (merged Cash Flow + Summary) */}
      <AccordionSection title="SUMMARY" icon="💎" color={COLORS.sections.summary} isOpen={sections.summary || sections.cashflow} onToggle={() => { toggleSection('summary'); if (sections.cashflow !== sections.summary) toggleSection('cashflow'); }}>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold" }}>Net Cash Flow</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: r.cashFlow >= 0 ? COLORS.income : COLORS.expense, background: bg(r.year, i) }}>
              {fmt(r.cashFlow)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.sections.summary }}>Net Worth</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.sections.summary, background: "rgba(167,139,250,0.1)" }}>
              {fmt(r.netWorth)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#06b6d4" }}>Cash Reserve</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#06b6d4", background: bg(r.year, i) }}>
              {fmt(r.cashRes)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 3. INCOME SECTION */}
      <AccordionSection title="INCOME" icon="💰" color={COLORS.sections.income} isOpen={sections.income} onToggle={() => toggleSection('income')}>
        {[["cashIncome", "Cash"], ["rsuIncome", "RSU"], ["match401k", "401k Match"], ["investmentIncome", "Investment Income"], ["rentalIncome", "Rental Income"]].map(([k, l]) => (
          <tr key={k}>
            <td style={{...stickyTd, color: COLORS.income}}>{l}</td>
            {enriched.map((r, i) => (
              <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
                <Cell value={data[i][k]} onChange={v => updateCascade(i, k, v)} isYear0={i === 0} isIncome={true} />
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>Tax Rate %</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].taxRate} onChange={v => update(i, "taxRate", v)} pct isYear0={i === 0} isExpense={true} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.sections.income }}>Total Income</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.sections.income, background: bg(r.year, i) }}>
              {fmt(r.gross)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.income }}>After Tax</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.income, background: bg(r.year, i) }}>
              {fmt(r.afterTax)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 4. ASSETS SECTION */}
      <AccordionSection title="ASSETS" icon="🏦" color={COLORS.sections.assets} isOpen={sections.assets} onToggle={() => toggleSection('assets')}>
        <tr>
          <td style={stickyTd}>Cash</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].cashBalance} onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0} isIncome={true} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Stocks/Bonds</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].stocksBonds} onChange={v => updateYear0("stocksBonds", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.stocks)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>↳ Growth %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].stockGrowthRate} onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true} isIncome={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>401k</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].retirement401k} onChange={v => updateYear0("retirement401k", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.ret401k)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>↳ Growth %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].retirement401kGrowthRate} onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true} isIncome={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Home</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].primaryHomeValue} onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.home)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>↳ Growth %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].homeGrowthRate} onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true} isIncome={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Rental</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].rentalPropertyValue} onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.rental)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Car</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].carValue} onChange={v => updateYear0("carValue", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#f87171"}}>{fmt(r.car)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>↳ Deprec %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].carDepreciation} onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true} isExpense={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Machines</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].otherMachines} onChange={v => updateYear0("otherMachines", v)} isYear0={true} isIncome={true} />
              ) : (
                <span style={{color:"#f87171"}}>{fmt(r.mach)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>HELOC Limit</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].helocLimit} onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true} isIncome={true} />
              ) : (
                <span>{fmt(data[0].helocLimit)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.sections.assets }}>Total Assets</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.sections.assets, background: bg(r.year, i) }}>
              {fmt(r.assets)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 5. HOUSING COSTS SECTION */}
      <AccordionSection title="HOUSING COSTS" icon="🏠" color={COLORS.sections.housing} isOpen={sections.housing} onToggle={() => toggleSection('housing')}>
        <tr>
          <td style={{ ...stickyTd, color: "#60a5fa" }}>Primary Mtg Pmt</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#60a5fa", background: bg(r.year, i) }}>
              {fmt(r.effectiveMtgPayment)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#64748b" }}>↳ Interest</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>
              {fmt(r.mortgageInterest)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#64748b" }}>↳ Principal</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#4ade80", background: bg(r.year, i) }}>
              {fmt(r.mortgagePrincipal)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Home Taxes</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].homeTaxes} onChange={v => updateYear0("homeTaxes", v)} isYear0={true} isExpense={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.homeTaxes)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#60a5fa" }}>Rental Mtg Pmt</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#60a5fa", background: bg(r.year, i) }}>
              {fmt(r.effectiveRentalPayment)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#64748b" }}>↳ Interest</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#f87171", background: bg(r.year, i) }}>
              {fmt(r.rentalInterest)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#64748b" }}>↳ Principal</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#4ade80", background: bg(r.year, i) }}>
              {fmt(r.rentalPrincipal)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Rental Taxes</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].rentalTaxes} onChange={v => updateYear0("rentalTaxes", v)} isYear0={true} isExpense={true} />
              ) : (
                <span style={{color:"#60a5fa"}}>{fmt(r.rentalTaxes)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>HOA</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].hoaFees} onChange={v => updateYear0("hoaFees", v)} isYear0={true} isExpense={true} />
              ) : (
                <span>{fmt(data[0].hoaFees)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#f87171" }}>HELOC Interest</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: r.helocInterest > 0 ? "#f87171" : "#64748b", background: bg(r.year, i) }}>
              {fmt(r.helocInterest)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.sections.housing }}>Total Housing</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.sections.housing, background: bg(r.year, i) }}>
              {fmt(r.housingCost)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 6. MAJOR PURCHASES SECTION */}
      <AccordionSection title="MAJOR PURCHASES" icon="🛒" color={COLORS.sections.purchases} isOpen={sections.purchases} onToggle={() => toggleSection('purchases')}>
        <tr>
          <td style={stickyTd}>Major Purchase</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].majorPurchase} onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0} isExpense={true} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={stickyTd}>Car Purchase</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].carPurchase} onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0} isExpense={true} />
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 7. LIABILITIES SECTION */}
      <AccordionSection title="LIABILITIES" icon="📉" color={COLORS.sections.liabilities} isOpen={sections.liabilities} onToggle={() => toggleSection('liabilities')}>
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>Primary Mtg Bal</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].mortgageBalance} onChange={v => updateMortgage(0, v, data[0].mortgageRate, data[0].mortgageYears)} isYear0={true} isExpense={true} />
              ) : (
                <span style={{color: r.mortgageBalEnd > 0 ? COLORS.expense : COLORS.income}}>{fmt(r.mortgageBalEnd)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: "#94a3b8"}}>↳ Rate%/Yrs</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].mortgageRate} onChange={v => updateMortgage(0, data[0].mortgageBalance, v, data[0].mortgageYears)} pct isYear0={true} isExpense={true} />{' '}
            <Cell value={data[0].mortgageYears} onChange={v => updateMortgage(0, data[0].mortgageBalance, data[0].mortgageRate, v)} num isYear0={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>Rental Mtg Bal</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].rentalMortgageBalance} onChange={v => updateRentalMortgage(0, v, data[0].rentalMortgageRate, data[0].rentalMortgageYears)} isYear0={true} isExpense={true} />
              ) : (
                <span style={{color: r.rentalMortgageBalEnd > 0 ? COLORS.expense : COLORS.income}}>{fmt(r.rentalMortgageBalEnd)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: "#94a3b8"}}>↳ Rate%/Yrs</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].rentalMortgageRate} onChange={v => updateRentalMortgage(0, data[0].rentalMortgageBalance, v, data[0].rentalMortgageYears)} pct isYear0={true} isExpense={true} />{' '}
            <Cell value={data[0].rentalMortgageYears} onChange={v => updateRentalMortgage(0, data[0].rentalMortgageBalance, data[0].rentalMortgageRate, v)} num isYear0={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>Car Loan Bal</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[0].carLoanBalance} onChange={v => updateCarLoan(0, v, data[0].carLoanRate, data[0].carLoanYears)} isYear0={true} isExpense={true} />
              ) : (
                <span style={{color: r.carLoanBalEnd > 0 ? COLORS.expense : COLORS.income}}>{fmt(r.carLoanBalEnd)}</span>
              )}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: "#94a3b8"}}>↳ Rate%/Yrs</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].carLoanRate} onChange={v => updateCarLoan(0, data[0].carLoanBalance, v, data[0].carLoanYears)} pct isYear0={true} isExpense={true} />{' '}
            <Cell value={data[0].carLoanYears} onChange={v => updateCarLoan(0, data[0].carLoanBalance, data[0].carLoanRate, v)} num isYear0={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>Other Debt</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].otherDebt} onChange={v => updateCascadeAll(i, "otherDebt", v)} isYear0={i === 0} isExpense={true} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: COLORS.expense}}>HELOC Used</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              <Cell value={data[i].helocUsed} onChange={v => updateHelocUsed(i, v)} isYear0={i === 0} isExpense={true} />
            </td>
          ))}
        </tr>
        <tr>
          <td style={{...stickyTd, color: "#94a3b8"}}>↳ Rate %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].helocRate} onChange={v => updateYear0("helocRate", v)} pct isYear0={true} isExpense={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.expense }}>Total Liabilities</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.expense, background: bg(r.year, i) }}>
              {fmt(r.debt)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 8. OTHER EXPENSES SECTION */}
      <AccordionSection title={`OTHER EXPENSES (${data[0].expenseInflationRate}% inflation)`} icon="💸" color={COLORS.sections.expenses} isOpen={sections.expenses} onToggle={() => toggleSection('expenses')}>
        <tr>
          <td style={stickyTd}>Inflation %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].expenseInflationRate} onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true} isExpense={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#64748b", background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        {[
          ["utilitiesExpense", "Utilities"], 
          ["foodExpense", "Food"], 
          ["clothingExpense", "Clothing"], 
          ["entertainmentExpense", "Entertainment"], 
          ["vacationBudget", "Vacation"], 
          ["educationExpense", "Education"], 
          ["healthcareExpense", "Healthcare"], 
          ["healthInsurance", "Health Ins"], 
          ["carInsurance", "Car Ins"], 
          ["homeInsurance", "Home Ins"], 
          ["transportExpense", "Transport"], 
          ["miscExpense", "Misc"]
        ].map(([k, l]) => (
          <tr key={k}>
            <td style={stickyTd}>{l}</td>
            <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
              {k === 'vacationBudget' ? (
                <Cell value={data[0][k]} onChange={v => update(0, k, v)} isYear0={true} isExpense={true} />
              ) : (
                <Cell value={data[0][k]} onChange={v => updateYear0(k, v)} isYear0={true} isExpense={true} />
              )}
            </td>
            {enriched.slice(1).map((r, i) => (
              <td key={r.year} style={{ ...cellStyle, color: "#64748b", background: bg(r.year, i+1) }}>
                {k === 'vacationBudget' ? fmt(r.vacationBudget) : fmt(data[0][k] * Math.pow(1 + data[0].expenseInflationRate / 100, i+1))}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <td style={stickyTd}>Car Maint %</td>
          <td style={{ ...cellStyle, background: bg(enriched[0].year, 0) }}>
            <Cell value={data[0].carMaintenanceRate} onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true} isExpense={true} />
          </td>
          {enriched.slice(1).map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i+1) }}></td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#8b5cf6" }}>Car Maintenance</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: "#8b5cf6", background: bg(r.year, i) }}>
              {fmt(r.carMaint)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, color: "#60a5fa" }}>Car Loan Pmt</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: r.carLoanPaymentEffective > 0 ? "#60a5fa" : "#64748b", background: bg(r.year, i) }}>
              {fmt(r.carLoanPaymentEffective)}
            </td>
          ))}
        </tr>
        <tr>
          <td style={{ ...stickyTd, fontWeight: "bold", color: COLORS.sections.expenses }}>Total Expenses</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, fontWeight: "bold", color: COLORS.sections.expenses, background: bg(r.year, i) }}>
              {fmt(r.exp)}
            </td>
          ))}
        </tr>
      </AccordionSection>

      {/* 9. DEPENDENTS SECTION (bottom) */}
      <AccordionSection title="DEPENDENTS" icon="👨‍👩‍👧‍👦" color={COLORS.sections.dependents} isOpen={sections.dependents} onToggle={() => toggleSection('dependents')}>
        <tr>
          <td style={stickyTd}># Dependents</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, background: bg(r.year, i) }}>
              {i === 0 ? (
                <Cell value={data[i].dependents} onChange={v => updateDeps(v)} num isYear0={true} />
              ) : (
                <span>{r.dependents}</span>
              )}
            </td>
          ))}
        </tr>
        {depAges.map((_, idx) => (
          <tr key={`dep${idx}`}>
            <td style={stickyTd}>Kid {idx+1} Age</td>
            {enriched.map((r, i) => {
              const a = r[`dep${idx+1}Age`];
              return (
                <td key={r.year} style={{ ...cellStyle, color: a && a < 18 ? "#ec4899" : "#e2e8f0", background: bg(r.year, i) }}>
                  {a || '-'}
                </td>
              );
            })}
          </tr>
        ))}
        <tr>
          <td style={{ ...stickyTd, color: COLORS.sections.dependents }}>Dep Cost</td>
          {enriched.map((r, i) => (
            <td key={r.year} style={{ ...cellStyle, color: COLORS.sections.dependents, background: bg(r.year, i) }}>
              {fmt(r.depCost)}
            </td>
          ))}
        </tr>
      </AccordionSection>
    </>
  );
};
