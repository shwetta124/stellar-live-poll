export default function ResultsBar({ label, votes = 0, total = 0, color }) {
  const pct = total === 0 ? 0 : Math.round((votes / total) * 100);

  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "7px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "15px" }}>{label}</span>
        <span style={{ fontSize: "13px", opacity: 0.6 }}>
          {votes} vote{votes !== 1 ? "s" : ""} · {pct}%
        </span>
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.08)",
          borderRadius: "999px",
          height: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            minWidth: pct > 0 ? "8px" : "0px",
            height: "100%",
            background: color,
            borderRadius: "999px",
            transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}