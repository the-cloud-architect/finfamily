#!/bin/bash

# Advanced App.jsx updater for 4Cast - Pure Bash version
# Run after update_app.sh to handle complex transformations
#
# Usage:
#     chmod +x update_app_advanced.sh
#     ./update_app_advanced.sh App.jsx

if [ -z "$1" ]; then
    echo "Usage: ./update_app_advanced.sh <path-to-App.jsx>"
    exit 1
fi

FILE="$1"

echo "Starting advanced updates on $FILE..."

# 1. Add ComposedChart to imports
sed -i 's/import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from "recharts";/import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ComposedChart } from "recharts";/' "$FILE"
echo "✅ Added ComposedChart to imports"

# 2. Add isIncome/isExpense props to Cell components

# Income section - cells with update(i, k, v)
sed -i 's/onChange={v => update(i, k, v)} pct={pct} isYear0={i === 0} \/>/onChange={v => update(i, k, v)} pct={pct} isYear0={i === 0} isIncome={!pct} isExpense={pct} \/>/' "$FILE"

# Assets section - add isIncome={true}
sed -i 's/onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0} \/>/onChange={v => updateSingleYear(i, "cashBalance", v)} isYear0={i === 0} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("stocksBonds", v)} isYear0={true} \/>/onChange={v => updateYear0("stocksBonds", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("stockGrowthRate", v)} pct isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("retirement401k", v)} isYear0={true} \/>/onChange={v => updateYear0("retirement401k", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("retirement401kGrowthRate", v)} pct isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true} \/>/onChange={v => updateYear0("primaryHomeValue", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("homeGrowthRate", v)} pct isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true} \/>/onChange={v => updateYear0("rentalPropertyValue", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("carValue", v)} isYear0={true} \/>/onChange={v => updateYear0("carValue", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("otherMachines", v)} isYear0={true} \/>/onChange={v => updateYear0("otherMachines", v)} isYear0={true} isIncome={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true} \/>/onChange={v => updateSingleYear(i, "helocLimit", v)} isYear0={true} isIncome={true} \/>/' "$FILE"

# Liabilities section - add isExpense={true}
sed -i 's/onChange={v => updateMortgage("mortgageBalance", v)} isYear0={true} \/>/onChange={v => updateMortgage("mortgageBalance", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateMortgage("mortgageRate", v)} pct isYear0={true} \/>/onChange={v => updateMortgage("mortgageRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateMortgage("mortgageYears", v)} num isYear0={true} \/>/onChange={v => updateMortgage("mortgageYears", v)} num isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateRentalMortgage("rentalMortgageBalance", v)} isYear0={true} \/>/onChange={v => updateRentalMortgage("rentalMortgageBalance", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateRentalMortgage("rentalMortgageRate", v)} pct isYear0={true} \/>/onChange={v => updateRentalMortgage("rentalMortgageRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateRentalMortgage("rentalMortgageYears", v)} num isYear0={true} \/>/onChange={v => updateRentalMortgage("rentalMortgageYears", v)} num isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateCarLoan("carLoanBalance", v)} isYear0={true} \/>/onChange={v => updateCarLoan("carLoanBalance", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateCarLoan("carLoanRate", v)} pct isYear0={true} \/>/onChange={v => updateCarLoan("carLoanRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateCarLoan("carLoanYears", v)} num isYear0={true} \/>/onChange={v => updateCarLoan("carLoanYears", v)} num isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateSingleYear(i, "otherDebt", v)} isYear0={i === 0} \/>/onChange={v => updateSingleYear(i, "otherDebt", v)} isYear0={i === 0} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateHelocUsed(i, v)} isYear0={i === 0} \/>/onChange={v => updateHelocUsed(i, v)} isYear0={i === 0} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("helocRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("helocRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"

# Expenses section - add isExpense={true}
sed -i 's/onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("expenseInflationRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("homeTaxes", v)} isYear0={true} \/>/onChange={v => updateYear0("homeTaxes", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("rentalTaxes", v)} isYear0={true} \/>/onChange={v => updateYear0("rentalTaxes", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("hoaFees", v)} isYear0={true} \/>/onChange={v => updateYear0("hoaFees", v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true} \/>/onChange={v => updateYear0("carMaintenanceRate", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true} \/>/onChange={v => updateYear0("carDepreciation", v)} pct isYear0={true} isExpense={true} \/>/' "$FILE"

# Major purchases - add isExpense={true}
sed -i 's/onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0} \/>/onChange={v => updateSingleYear(i, "majorPurchase", v)} isYear0={i === 0} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0} \/>/onChange={v => updateSingleYear(i, "carPurchase", v)} isYear0={i === 0} isExpense={true} \/>/' "$FILE"

# Dependents
sed -i 's/onChange={v => updateDeps(v)} num isYear0={true} \/>/onChange={v => updateDeps(v)} num isYear0={true} isExpense={true} \/>/' "$FILE"

echo "✅ Added isIncome/isExpense props to Cell components"

# 3. Update OTHER EXPENSES section cells that use updateYear0 with k variable
# These are in the map function for expenses
sed -i 's/onChange={v => updateYear0(k, v)} isYear0={true} \/>/onChange={v => updateYear0(k, v)} isYear0={true} isExpense={true} \/>/' "$FILE"
sed -i 's/onChange={v => update(0, k, v)} isYear0={true} \/>/onChange={v => update(0, k, v)} isYear0={true} isExpense={true} \/>/' "$FILE"

echo "✅ Updated expense section cells"

echo ""
echo "============================================"
echo "✅ Advanced updates complete!"
echo "============================================"
echo ""
echo "⚠️  REMAINING MANUAL STEPS:"
echo ""
echo "1. MOVE LIABILITIES SECTION:"
echo "   Open App.jsx in your editor and find the LIABILITIES AccordionSection"
echo "   (search for 'title=\"LIABILITIES\"')"
echo "   Cut the entire section and paste it AFTER DEPENDENTS, BEFORE HOUSING COSTS"
echo ""
echo "2. DUAL-AXIS CHART - Replace the Net Worth & Mortgages chart:"
echo "   Find: <LineChart data={enriched.map(r => ({ year: r.year, nw: r.netWorth"
echo "   Replace the entire chart section with the code from update_app_manual.md"
echo ""
echo "3. SUMMARY TAB RATIOS:"
echo "   Add the ratio cards grid at the top of the summary tab"
echo "   See update_app_manual.md for the code snippet"
echo ""
