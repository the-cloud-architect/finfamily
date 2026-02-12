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
  
  const textColor = isYear0 ? COLORS.year0Text : isIncome ? COLORS.income : isExpense ? COLORS.expense : COLORS.normalText;
  const bgColor = isYear0 ? COLORS.year0Bg : COLORS.normalBg;
  const borderStyle = isYear0 ? COLORS.year0Border : COLORS.normalBorder;
  
  if (ed) return (
    <input 
      type="number" 
      value={tmp} 
      onChange={e => setTmp(e.target.value)} 
      onBlur={done} 
      onKeyDown={e => e.key === "Enter" && done()} 
      autoFocus 
      style={{ 
        width: "60px", // Reduced from 66px
        padding: "2px", // Reduced from 3px
        border: "2px solid #3b82f6", 
        borderRadius: "4px", 
        background: isYear0 ? "#fef3c7" : "#1e293b", 
        color: "#000", 
        fontSize: "11px", // Reduced from 12px
        textAlign: "center" 
      }} 
    />
  );
  
  return (
    <span 
      onClick={() => { setTmp(value); setEd(true); }} 
      style={{ 
        cursor: "pointer", 
        padding: "2px 4px", // Reduced from 3px 5px
        borderRadius: "3px", 
        fontSize: "11px", // Reduced from 12px
        background: bgColor, 
        border: borderStyle, 
        display: "inline-block", 
        minWidth: "50px", // Reduced from 54px
        textAlign: "center", 
        color: textColor, 
        fontWeight: isYear0 ? "bold" : "normal" 
      }}
    >
      {num ? value : pct ? value+"%" : (value && value.toLocaleString ? value.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0}) : "$0")}
    </span>
  );
};

export const ScrollTable = ({ children }) => {
  const topRef = React.useRef(null);
  const bottomRef = React.useRef(null);
  const [sw, setSw] = useState(0);
  
  React.useEffect(() => { 
    if (bottomRef.current) setSw(bottomRef.current.scrollWidth); 
  }, [children]);
  
  const sync = src => { 
    if (src === 'top' && bottomRef.current && topRef.current) 
      bottomRef.current.scrollLeft = topRef.current.scrollLeft; 
    else if (src === 'bottom' && topRef.current && bottomRef.current) 
      topRef.current.scrollLeft = bottomRef.current.scrollLeft; 
  };
  
  return (
    <div>
      <div ref={topRef} onScroll={() => sync('top')} style={{ overflowX: "auto", height: "17px" }}>
        <div style={{ width: sw, height: "1px" }} />
      </div>
      <div ref={bottomRef} onScroll={() => sync('bottom')} style={{ overflowX: "auto" }}>
        {children}
      </div>
    </div>
  );
};

export const AccordionSection = ({ title, icon, color, isOpen, onToggle, children }) => (
  <>
    <tr onClick={onToggle} style={{ cursor: "pointer" }}>
      <td colSpan={36} style={{ background: `linear-gradient(90deg, ${color}20, transparent)`, padding: "6px 10px", fontWeight: "bold", color: color, fontSize: "12px" }}>
        <span style={{ marginRight: "8px", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }}>▶</span>
        {icon} {title}
      </td>
    </tr>
    {isOpen && children}
  </>
);
