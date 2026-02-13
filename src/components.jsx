import React, { useState } from "react";
import { COLORS } from './constants';

export const AnimatedTitle = () => {
  const [hover, setHover] = useState(false);
  return (
    <h1 onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ fontSize: "38px", fontWeight: "800", margin: 0, cursor: "pointer", display: "inline-block" }}>
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

export const Cell = ({ value, onChange, pct, num, isYear0, isIncome, isExpense }) => {
  const [ed, setEd] = useState(false);
  const [tmp, setTmp] = useState(value);
  
  const done = () => { 
    setEd(false); 
    onChange(pct || num ? parseFloat(tmp) || 0 : parseInt(tmp) || 0); 
  };
  
  if (ed) return (
    <input 
      type="number" 
      value={tmp} 
      onChange={e => setTmp(e.target.value)} 
      onBlur={done} 
      onKeyDown={e => e.key === "Enter" && done()} 
      autoFocus 
      style={{ 
        width: "60px",
        padding: "2px 4px",
        border: "1px solid #6366f1", 
        borderRadius: "4px", 
        background: "rgba(30, 41, 59, 0.95)", 
        color: "#e2e8f0", 
        fontSize: "11px",
        fontFamily: "inherit",
        textAlign: "center",
        outline: "none",
        boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.3)"
      }} 
    />
  );
  
  return (
    <span 
      onClick={() => { setTmp(value); setEd(true); }} 
      style={{ 
        cursor: "pointer", 
        padding: "2px 4px",
        borderRadius: "3px", 
        fontSize: "11px",
        fontFamily: "inherit",
        background: COLORS.inputBg,
        border: COLORS.inputBorder,
        display: "inline-block", 
        minWidth: "50px",
        textAlign: "center", 
        color: COLORS.inputText,
        fontWeight: "600",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.currentTarget.style.background = COLORS.inputBg; }}
    >
      {num ? value : pct ? value+"%" : (value && value.toLocaleString ? value.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0}) : "$0")}
    </span>
  );
};

export const ScrollTable = ({ children }) => {
  const topRef = React.useRef(null);
  const bottomRef = React.useRef(null);
  const [sw, setSw] = useState(0);
  const syncing = React.useRef(false);
  
  React.useEffect(() => { 
    const measure = () => {
      if (bottomRef.current) setSw(bottomRef.current.scrollWidth); 
    };
    measure();
    // Re-measure on resize or when children change
    const ro = new ResizeObserver(measure);
    if (bottomRef.current) ro.observe(bottomRef.current);
    return () => ro.disconnect();
  }, [children]);
  
  const sync = (src) => { 
    if (syncing.current) return;
    syncing.current = true;
    if (src === 'top' && bottomRef.current && topRef.current) 
      bottomRef.current.scrollLeft = topRef.current.scrollLeft; 
    else if (src === 'bottom' && topRef.current && bottomRef.current) 
      topRef.current.scrollLeft = bottomRef.current.scrollLeft; 
    syncing.current = false;
  };
  
  return (
    <div>
      {/* Top scrollbar - always visible when content overflows */}
      <div 
        ref={topRef} 
        onScroll={() => sync('top')} 
        style={{ 
          overflowX: "auto", 
          overflowY: "hidden",
          height: "14px",
          marginBottom: "2px",
        }}
      >
        <div style={{ width: sw > 0 ? sw : '100%', height: "1px" }} />
      </div>
      {/* Main scrollable content */}
      <div 
        ref={bottomRef} 
        onScroll={() => sync('bottom')} 
        style={{ overflowX: "auto" }}
      >
        {children}
      </div>
    </div>
  );
};

export const AccordionSection = ({ title, icon, color, isOpen, onToggle, children }) => (
  <>
    <tr onClick={onToggle} style={{ cursor: "pointer" }}>
      <td style={{ 
        background: `linear-gradient(90deg, ${color}20, ${color}10)`, 
        padding: "6px 10px", 
        fontWeight: "bold", 
        color: color, 
        fontSize: "12px",
        position: "sticky",
        left: 0,
        zIndex: 10,
        whiteSpace: "nowrap",
        minWidth: "144px",
      }}>
        <span style={{ marginRight: "8px", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }}>▶</span>
        {icon} {title}
      </td>
      <td colSpan={41} style={{ 
        background: `linear-gradient(90deg, ${color}20, transparent)`, 
        padding: 0,
      }}></td>
    </tr>
    {isOpen && children}
  </>
);

// Ratio display component for the ratios section
export const RatioCell = ({ value, thresholds }) => {
  let color = COLORS.success;
  if (thresholds) {
    if (thresholds.higherIsBad) {
      if (value > thresholds.danger) color = COLORS.danger;
      else if (value > thresholds.warn) color = COLORS.warning;
    } else {
      if (value < thresholds.danger) color = COLORS.danger;
      else if (value < thresholds.warn) color = COLORS.warning;
    }
  }
  
  return (
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
      {value === Infinity || value > 1000 ? "∞" : value.toFixed(1) + "%"}
    </span>
  );
};
