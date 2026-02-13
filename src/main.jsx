import React from "react";
import ReactDOM from "react-dom/client";
import FourCast from "./FourCast-FINAL.jsx";

console.log("main.jsx loaded");

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("React render error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0f172a",
            color: "#e2e8f0",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>
              App crashed
            </div>
            <div style={{ color: "#94a3b8", marginBottom: "12px" }}>
              Open DevTools → Console to see the full stack trace.
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "rgba(0,0,0,0.25)",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.15)",
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FourCast />
    </ErrorBoundary>
  </React.StrictMode>
);
