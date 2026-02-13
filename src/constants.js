export const YEARS = 40;
export const START_YEAR = 2026;

export const COLORS = {
  income: "#4ade80",
  expense: "#f87171",
  year0: "#fbbf24",
  year0Text: "#000",
  year0Bg: "rgba(251, 191, 36, 0.15)",
  year0Border: "1px solid #f59e0b",
  normalText: "#fff",
  normalBg: "rgba(59,130,246,0.1)",
  normalBorder: "1px dashed rgba(59,130,246,0.3)",
  
  // FIXED: Input cell styling - dark bg, white text, subtle border
  inputText: "#e2e8f0",
  inputBg: "rgba(30, 41, 59, 0.9)",
  inputBorder: "1px solid rgba(99, 102, 241, 0.4)",
  
  primary: "#a78bfa",
  success: "#22c55e",
  info: "#60a5fa",
  warning: "#fbbf24",
  danger: "#ef4444",
  retired: "#fb923c",
  
  sections: {
    income: "#22c55e",
    dependents: "#ec4899",
    housing: "#f97316",
    expenses: "#ef4444",
    cashflow: "#06b6d4",
    assets: "#3b82f6",
    liabilities: "#f97316",
    purchases: "#8b5cf6",
    summary: "#a78bfa",
    ratios: "#14b8a6"
  }
};

export const DEFAULT_VALUES = {
  age: 45,
  spouseAge: 43,
  retireAge: 65,
  depAges: [10, 8, 5],
  primaryMortgage: {
    balance: 200000,
    rate: 6.5,
    years: 25
  },
  rentalMortgage: {
    balance: 100000,
    rate: 6.5,
    years: 20
  }
};
