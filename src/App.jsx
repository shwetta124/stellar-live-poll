import { useState, useEffect, useCallback } from "react";
import WalletConnect from "./components/WalletConnect";
import PollCard from "./components/PollCard";
import { getVotes, CONTRACT_ID } from "./lib/contract";
import "./App.css";

export default function App() {
  const [address, setAddress]   = useState(null);
  const [walletErr, setWalletErr] = useState(null);
  const [votes, setVotes]       = useState({ votesA: 0, votesB: 0 });
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchVotes = useCallback(async () => {
    const data = await getVotes();
    setVotes(data);
    setLastRefresh(new Date().toLocaleTimeString());
  }, []);

  // Load votes on mount
  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  // Auto-refresh every 10 seconds (real-time simulation)
  useEffect(() => {
    const interval = setInterval(fetchVotes, 10000);
    return () => clearInterval(interval);
  }, [fetchVotes]);

  const handleConnect = (addr, err) => {
    if (err) { setWalletErr(err); return; }
    setAddress(addr);
    setWalletErr(null);
  };

  return (
    <div className="app-bg">
      <div className="app-card">
        {/* Header */}
        <div className="app-header">
          <div>
            <h1 className="app-title">⭐ StellarPoll</h1>
            <p className="app-subtitle">Live on-chain voting · Testnet</p>
          </div>
          <WalletConnect
            address={address}
            onConnect={handleConnect}
            onDisconnect={() => setAddress(null)}
          />
        </div>

        {walletErr && (
          <div className="error-banner">
            ❌ Wallet error: {walletErr}
          </div>
        )}

        {/* Poll */}
        <div className="poll-section">
          <PollCard
            address={address}
            votesA={votes.votesA}
            votesB={votes.votesB}
            onVoted={fetchVotes}
          />
        </div>

        {/* Footer */}
        <div className="app-footer">
          <span>📋 Contract: <code>{CONTRACT_ID.slice(0,8)}...{CONTRACT_ID.slice(-6)}</code></span>
          <span>🔄 Last refresh: {lastRefresh || "loading..."}</span>
        </div>
      </div>
    </div>
  );
}