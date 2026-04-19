import { useState } from "react";
import { connectWallet, getAvailableWallets } from "../lib/stellar";

export default function WalletConnect({ address, onConnect, onDisconnect }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(null);
  const [err, setErr]             = useState(null);

  const wallets = getAvailableWallets();

  const handleSelect = async (walletId) => {
    setLoading(walletId);
    setErr(null);
    try {
      const addr = await connectWallet(walletId);
      setShowModal(false);
      onConnect(addr);
    } catch (e) {
      const msg = e.message ?? "";
      if (msg.toLowerCase().includes("not installed") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("undefined")) {
        setErr(walletId + " is not installed. Try Albedo — no install needed!");
      } else if (msg.toLowerCase().includes("reject") ||
                 msg.toLowerCase().includes("cancel") ||
                 msg.toLowerCase().includes("denied")) {
        setErr("Connection rejected in wallet.");
      } else {
        setErr("Error: " + msg);
      }
    } finally {
      setLoading(null);
    }
  };

  if (address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ background: "#d1fae5", color: "#065f46", padding: "7px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 }}>
          🟢 {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button onClick={onDisconnect} style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", fontSize: "13px" }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setShowModal(true); setErr(null); }}
        style={{ background: "#2563eb", color: "white", padding: "10px 22px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}
      >
        🔗 Connect Wallet
      </button>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "28px", width: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>Select Wallet</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelect(w.id)}
                  disabled={loading !== null}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", background: loading === w.id ? "#eff6ff" : "white", cursor: loading !== null ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: 600, color: "#111827", transition: "all 0.15s" }}
                >
                  <span style={{ fontSize: "22px" }}>{w.icon}</span>
                  <span>{w.name}</span>
                  {loading === w.id && <span style={{ marginLeft: "auto", fontSize: "13px", color: "#2563eb" }}>Connecting...</span>}
                  {w.id === "albedo" && loading !== w.id && <span style={{ marginLeft: "auto", fontSize: "11px", color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: "999px" }}>No install</span>}
                </button>
              ))}
            </div>

            {err && (
              <p style={{ color: "#991b1b", fontSize: "13px", marginTop: "14px", background: "#fef2f2", padding: "10px", borderRadius: "8px" }}>
                ❌ {err}
              </p>
            )}

            <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "16px", textAlign: "center" }}>
              Albedo works in any browser — no extension needed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}