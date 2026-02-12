#!/bin/bash

# Update 4Cast App.jsx with requested changes
# Run this script from the directory containing App.jsx:
#   chmod +x update_app.sh
#   ./update_app.sh App.jsx

if [ -z "$1" ]; then
    echo "Usage: ./update_app.sh <path-to-App.jsx>"
    exit 1
fi

FILE="$1"
BACKUP="${FILE}.backup"

# Create backup
cp "$FILE" "$BACKUP"
echo "Created backup: $BACKUP"

# 1. Update Cell component - add isIncome/isExpense props and yellow background for Year0
sed -i 's/const Cell = ({ value, onChange, pct, num, isYear0 }) => {/const Cell = ({ value, onChange, pct, num, isYear0, isIncome, isExpense }) => {/' "$FILE"

# Update Cell textColor logic - black for Year0, green for income, red for expense
sed -i 's/const textColor = isYear0 ? "#4ade80" : "#fff";/const textColor = isYear0 ? "#000" : isIncome ? "#4ade80" : isExpense ? "#f87171" : "#fff";\n  const bgColor = isYear0 ? "#fbbf24" : "rgba(59,130,246,0.1)";\n  const borderStyle = isYear0 ? "2px solid #f59e0b" : "1px dashed rgba(59,130,246,0.3)";/' "$FILE"

# Update Cell input style for editing mode - bigger font, yellow bg for Year0
sed -i 's/style={{ width: "55px", padding: "2px", border: "2px solid #3b82f6", borderRadius: "3px", background: "#1e293b", color: textColor, fontSize: "10px", textAlign: "center" }}/style={{ width: "66px", padding: "3px", border: "2px solid #3b82f6", borderRadius: "4px", background: isYear0 ? "#fef3c7" : "#1e293b", color: "#000", fontSize: "12px", textAlign: "center" }}/' "$FILE"

# Update Cell span style - use bgColor and borderStyle variables, bigger font
sed -i 's/style={{ cursor: "pointer", padding: "2px 4px", borderRadius: "3px", fontSize: "10px", background: "rgba(59,130,246,0.1)", border: "1px dashed rgba(59,130,246,0.3)", display: "inline-block", minWidth: "45px", textAlign: "center", color: textColor }}/style={{ cursor: "pointer", padding: "3px 5px", borderRadius: "4px", fontSize: "12px", background: bgColor, border: borderStyle, display: "inline-block", minWidth: "54px", textAlign: "center", color: textColor, fontWeight: isYear0 ? "bold" : "normal" }}/' "$FILE"

# 2. Increase font sizes by ~20% throughout

# AnimatedTitle: 32px -> 38px
sed -i 's/fontSize: "32px", fontWeight: "800"/fontSize: "38px", fontWeight: "800"/' "$FILE"

# ScrollTable height: 14px -> 17px
sed -i 's/overflowX: "auto", height: "14px"/overflowX: "auto", height: "17px"/' "$FILE"

# AccordionSection: 10px -> 12px
sed -i 's/padding: "5px 8px", fontWeight: "bold", color: color, fontSize: "10px"/padding: "6px 10px", fontWeight: "bold", color: color, fontSize: "12px"/' "$FILE"

# stickyTh: 9px -> 11px, minWidth 120px -> 144px
sed -i 's/padding: "6px 3px", textAlign: "left", borderBottom: "2px solid #6366f1", fontSize: "9px", minWidth: "120px"/padding: "7px 4px", textAlign: "left", borderBottom: "2px solid #6366f1", fontSize: "11px", minWidth: "144px"/' "$FILE"

# stickyTd: add fontSize 11px
sed -i 's/position: "sticky", left: 0, background: "#1e293b", padding: "4px 6px", zIndex: 5, textAlign: "left"/position: "sticky", left: 0, background: "#1e293b", padding: "5px 7px", zIndex: 5, textAlign: "left", fontSize: "11px"/' "$FILE"

# cellStyle: 3px -> 4px, add fontSize
sed -i "s/const cellStyle = { padding: \"3px\", textAlign: \"center\" };/const cellStyle = { padding: \"4px\", textAlign: \"center\", fontSize: \"11px\" };/" "$FILE"

# thStyle: 9px -> 11px, minWidth 70px -> 84px
sed -i 's/padding: "6px 3px", textAlign: "center", borderBottom: "2px solid #6366f1", fontSize: "9px", minWidth: "70px"/padding: "7px 4px", textAlign: "center", borderBottom: "2px solid #6366f1", fontSize: "11px", minWidth: "84px"/' "$FILE"

# ageHeader: 8px -> 10px, 7px -> 9px
sed -i 's/fontSize: "8px" }}>You:{r.age} Sp:{r.spouseAge}/fontSize: "10px" }}>You:{r.age} Sp:{r.spouseAge}/' "$FILE"
sed -i 's/fontSize: "7px" }}>K:/fontSize: "9px" }}>K:/' "$FILE"

# Loading text: 18px -> 22px
sed -i 's/color: "#e2e8f0", fontSize: "18px"/color: "#e2e8f0", fontSize: "22px"/' "$FILE"

# Header subtitle: 11px -> 13px
sed -i 's/color: "#64748b", fontSize: "11px", margin: "4px 0 0"/color: "#64748b", fontSize: "13px", margin: "5px 0 0"/' "$FILE"

# User email: 11px -> 13px
sed -i 's/fontSize: "11px", color: "#94a3b8" }}>{user.email}/fontSize: "13px", color: "#94a3b8" }}>{user.email}/' "$FILE"

# Sign out button: 10px -> 12px
sed -i 's/fontSize: "10px", /fontSize: "12px", /g' "$FILE"

# Tab buttons: 11px -> 13px, padding 6px 16px -> 7px 19px
sed -i 's/padding: "6px 16px"/padding: "7px 19px"/g' "$FILE"
sed -i 's/fontSize: "11px", fontWeight: "600"/fontSize: "13px", fontWeight: "600"/g' "$FILE"

# Tips section: 9px -> 11px
sed -i 's/marginBottom: "12px", fontSize: "9px"/marginBottom: "14px", fontSize: "11px"/' "$FILE"

# Various 9px fonts -> 11px
sed -i 's/fontSize: "9px"/fontSize: "11px"/g' "$FILE"

# Summary tab header fonts: 10px -> 12px
sed -i 's/fontSize: "10px" }}>💰 INCOME/fontSize: "12px" }}>💰 INCOME/' "$FILE"
sed -i 's/fontSize: "10px" }}>💸 EXPENSES/fontSize: "12px" }}>💸 EXPENSES/' "$FILE"
sed -i 's/fontSize: "10px" }}>💵 CASH FLOW/fontSize: "12px" }}>💵 CASH FLOW/' "$FILE"
sed -i 's/fontSize: "10px" }}>🏦 BALANCE SHEET/fontSize: "12px" }}>🏦 BALANCE SHEET/' "$FILE"
sed -i 's/fontSize: "10px" }}>📐 KEY RATIOS/fontSize: "12px" }}>📐 KEY RATIOS/' "$FILE"

# Chart fonts: 8px -> 10px, 12px -> 14px
sed -i 's/minWidth: "50px", fontSize: "8px"/minWidth: "60px", fontSize: "10px"/g' "$FILE"
sed -i 's/fontSize: "12px", marginBottom: "10px"/fontSize: "14px", marginBottom: "12px"/g' "$FILE"

# Stats cards: 8px -> 10px, 16px -> 19px
sed -i 's/fontSize: "8px", marginBottom: "4px"/fontSize: "10px", marginBottom: "5px"/g' "$FILE"
sed -i 's/fontSize: "16px", fontWeight: "bold"/fontSize: "19px", fontWeight: "bold"/g' "$FILE"

# Footer: 9px -> 11px (already done above)

# 3. Rename "Variables" tab to "Forecast"
sed -i 's/\["variables", "⚙️ Variables"\]/["variables", "⚙️ Forecast"]/' "$FILE"

# 4. Update Tips section with new color coding explanation
sed -i 's/<span style={{ color: "#4ade80" }}>Green<\/span>=Year 1 inputs | <span style={{ color: "#60a5fa" }}>Blue<\/span>=calculated/<span style={{ color: "#000", background: "#fbbf24", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>Yellow<\/span>=Editable inputs | <span style={{ color: "#4ade80" }}>Green<\/span>=Income\/Assets | <span style={{ color: "#f87171" }}>Red<\/span>=Expenses\/Liabilities/' "$FILE"

echo "✅ Basic updates complete!"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "The following changes require manual editing due to complexity:"
echo ""
echo "1. MOVE LIABILITIES SECTION: In the 'variables' tab, move the entire"
echo "   <AccordionSection title=\"LIABILITIES\"...> block from after ASSETS"
echo "   to AFTER DEPENDENTS and BEFORE HOUSING COSTS"
echo ""
echo "2. ADD isIncome/isExpense PROPS: Update Cell components throughout:"
echo "   - Income fields: add isIncome={true}"
echo "   - Expense/Liability fields: add isExpense={true}"
echo ""
echo "3. SUMMARY TAB RATIOS: Move the KEY RATIOS section to the top"
echo "   of the summary tab as a grid (2 rows x 4 columns)"
echo ""
echo "4. DUAL-AXIS MORTGAGE CHART: Replace the LineChart with ComposedChart"
echo "   and add a second YAxis for mortgages (yAxisId=\"right\")"
echo ""
echo "See update_app_manual.md for detailed instructions."
