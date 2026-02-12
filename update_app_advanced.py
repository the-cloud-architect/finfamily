#!/usr/bin/env python3
"""
Advanced App.jsx updater for 4Cast
Run after update_app.sh to handle complex transformations

Usage:
    python3 update_app_advanced.py App.jsx
"""

import sys
import re

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 update_app_advanced.py <path-to-App.jsx>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Move LIABILITIES section after DEPENDENTS
    # Find the LIABILITIES AccordionSection
    liabilities_pattern = r'(<AccordionSection title="LIABILITIES".*?</AccordionSection>)'
    liabilities_match = re.search(liabilities_pattern, content, re.DOTALL)
    
    if liabilities_match:
        liabilities_section = liabilities_match.group(1)
        # Remove it from current position
        content = content.replace(liabilities_section, '')
        
        # Find end of DEPENDENTS section and insert LIABILITIES after it
        dependents_end = '</AccordionSection>\n\n                <AccordionSection title="HOUSING COSTS"'
        liabilities_insert = '</AccordionSection>\n\n                ' + liabilities_section + '\n\n                <AccordionSection title="HOUSING COSTS"'
        content = content.replace(dependents_end, liabilities_insert)
        print("✅ Moved LIABILITIES section after DEPENDENTS")
    else:
        print("⚠️  Could not find LIABILITIES section to move")
    
    # 2. Add isIncome/isExpense props to Cell components
    
    # Income section - add isIncome={true} to non-tax-rate cells
    # This is tricky because we need context, so we'll do specific replacements
    
    # For income fields (Cash, RSU, 401k Match, Investment Income, Rental Income)
    income_fields = ['cashIncome', 'rsuIncome', 'match401k', 'investmentIncome', 'rentalIncome']
    for field in income_fields:
        old = f'onChange={{v => update(i, k, v)}} pct={{pct}} isYear0={{i === 0}}'
        # Can't easily target specific fields, will need manual or more context
    
    # Add isExpense to tax rate in income section - specific pattern
    content = content.replace(
        'onChange={v => update(i, k, v)} pct={pct} isYear0={i === 0} />',
        'onChange={v => update(i, k, v)} pct={pct} isYear0={i === 0} isIncome={!pct} isExpense={pct} />'
    )
    
    # Assets section - add isIncome={true}
    asset_patterns = [
        ('onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0}',
         'onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0} isIncome={true}'),
        ('onChange={v => updateYear0("stocksBonds", v)} isYear0={true}',
         'onChange={v => updateYear0("stocksBonds", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("retirement401k", v)} isYear0={true}',
         'onChange={v => updateYear0("retirement401k", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true}',
         'onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true}',
         'onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("carValue", v)} isYear0={true}',
         'onChange={v => updateYear0("carValue", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateYear0("otherMachines", v)} isYear0={true}',
         'onChange={v => updateYear0("otherMachines", v)} isYear0={true} isIncome={true}'),
        ('onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true}',
         'onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true} isIncome={true}'),
    ]
    
    for old, new in asset_patterns:
        content = content.replace(old, new)
    
    # Liability section - add isExpense={true}
    liability_patterns = [
        ('onChange={v => updateMortgage("mortgageBalance", v)} isYear0={true}',
         'onChange={v => updateMortgage("mortgageBalance", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateMortgage("mortgageRate", v)} pct isYear0={true}',
         'onChange={v => updateMortgage("mortgageRate", v)} pct isYear0={true} isExpense={true}'),
        ('onChange={v => updateRentalMortgage("rentalMortgageBalance", v)} isYear0={true}',
         'onChange={v => updateRentalMortgage("rentalMortgageBalance", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateRentalMortgage("rentalMortgageRate", v)} pct isYear0={true}',
         'onChange={v => updateRentalMortgage("rentalMortgageRate", v)} pct isYear0={true} isExpense={true}'),
        ('onChange={v => updateCarLoan("carLoanBalance", v)} isYear0={true}',
         'onChange={v => updateCarLoan("carLoanBalance", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateCarLoan("carLoanRate", v)} pct isYear0={true}',
         'onChange={v => updateCarLoan("carLoanRate", v)} pct isYear0={true} isExpense={true}'),
        ('onChange={v => updateSingleYear(i, "otherDebt", v)} isYear0={i === 0}',
         'onChange={v => updateSingleYear(i, "otherDebt", v)} isYear0={i === 0} isExpense={true}'),
        ('onChange={v => updateHelocUsed(i, v)} isYear0={i === 0}',
         'onChange={v => updateHelocUsed(i, v)} isYear0={i === 0} isExpense={true}'),
        ('onChange={v => updateYear0("helocRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("helocRate", v)} pct isYear0={true} isExpense={true}'),
    ]
    
    for old, new in liability_patterns:
        content = content.replace(old, new)
    
    # Expense section - add isExpense={true}
    expense_patterns = [
        ('onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true} isExpense={true}'),
        ('onChange={v => updateYear0("homeTaxes", v)} isYear0={true}',
         'onChange={v => updateYear0("homeTaxes", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateYear0("rentalTaxes", v)} isYear0={true}',
         'onChange={v => updateYear0("rentalTaxes", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateYear0("hoaFees", v)} isYear0={true}',
         'onChange={v => updateYear0("hoaFees", v)} isYear0={true} isExpense={true}'),
        ('onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true}',
         'onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true} isExpense={true}'),
        ('onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true}',
         'onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true} isExpense={true}'),
    ]
    
    for old, new in expense_patterns:
        content = content.replace(old, new)
    
    # Major purchases - add isExpense={true}
    purchase_patterns = [
        ('onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0}',
         'onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0} isExpense={true}'),
        ('onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0}',
         'onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0} isExpense={true}'),
    ]
    
    for old, new in purchase_patterns:
        content = content.replace(old, new)
    
    # Dependents section - add isExpense for # dependents
    content = content.replace(
        'onChange={v => updateDeps(v)} num isYear0={true}',
        'onChange={v => updateDeps(v)} num isYear0={true} isExpense={true}'
    )
    
    print("✅ Added isIncome/isExpense props to Cell components")
    
    # 3. Add ComposedChart to imports
    old_import = 'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from "recharts";'
    new_import = 'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ComposedChart } from "recharts";'
    content = content.replace(old_import, new_import)
    print("✅ Added ComposedChart to imports")
    
    # 4. Replace the Net Worth & Mortgages chart with dual-axis version
    old_chart = '''<div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(148,163,184,0.1)" }}>
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
          </div>'''
    
    new_chart = '''<div style={{ background: "rgba(30,41,59,0.6)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "#a78bfa" }}>🏦 Net Worth & Mortgages</h3>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
              <span style={{ color: "#a78bfa" }}>■</span> Net Worth (left axis) | 
              <span style={{ color: "#f97316" }}> ■</span> Mortgages (right axis)
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={enriched.map(r => ({ year: r.year, nw: r.netWorth, primaryMtg: r.mortgageBalEnd, rentalMtg: r.rentalMortgageBalEnd }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                <XAxis dataKey="year" stroke="#64748b" fontSize={11}/>
                <YAxis yAxisId="left" stroke="#a78bfa" fontSize={11} tickFormatter={fmt} orientation="left"/>
                <YAxis yAxisId="right" stroke="#f97316" fontSize={11} tickFormatter={fmt} orientation="right"/>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "4px", fontSize: "12px" }} formatter={fmt}/>
                <Legend wrapperStyle={{ fontSize: "11px" }}/>
                <ReferenceLine x={retireYear} stroke="#fb923c" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#fb923c', fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="nw" stroke="#a78bfa" strokeWidth={3} dot={false} name="Net Worth"/>
                <Line yAxisId="right" type="monotone" dataKey="primaryMtg" stroke="#f97316" strokeWidth={2} dot={false} name="Primary Mortgage"/>
                <Line yAxisId="right" type="monotone" dataKey="rentalMtg" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rental Mortgage"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>'''
    
    if old_chart in content:
        content = content.replace(old_chart, new_chart)
        print("✅ Replaced Net Worth chart with dual-axis version")
    else:
        print("⚠️  Could not find Net Worth chart to replace - may need manual update")
    
    # Write the updated content
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"\n✅ All updates written to {filepath}")
    print("\n⚠️  Still need manual update:")
    print("   - Summary tab: Move KEY RATIOS to top as 2-row grid")
    print("   - See update_app_manual.md for detailed instructions")

if __name__ == "__main__":
    main()
