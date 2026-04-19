export default function TxStatus({ status, hash }) {
  if (!status) return null;

  var c = {
    pending: { bg: "#fef3c7", color: "#92400e", icon: "⏳", text: "Transaction pending..." },
    success: { bg: "#d1fae5", color: "#065f46", icon: "✅", text: "Vote recorded on-chain!" },
    failed:  { bg: "#fee2e2", color: "#991b1b", icon: "❌", text: "Transaction failed" },
    timeout: { bg: "#fee2e2", color: "#991b1b", icon: "⚠️", text: "Timed out — check explorer" },
  }[status] || { bg: "#fef3c7", color: "#92400e", icon: "⏳", text: "Transaction pending..." };

  return (
    <div style={{ background: c.bg, color: c.color, padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontWeight: 600 }}>{c.icon} {c.text}</span>
      {hash && (
        <a href={"https://stellar.expert/explorer/testnet/tx/" + hash} target="_blank" rel="noreferrer" style={{ color: c.color, fontSize: "12px", wordBreak: "break-all", opacity: 0.8, textDecoration: "underline" }}>
          View on Explorer: {hash.slice(0, 24)}...
        </a>
      )}
    </div>
  );
}