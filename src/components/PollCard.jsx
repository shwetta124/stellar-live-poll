import { useState } from "react";
import { buildVoteTx, submitTx, waitForTx } from "../lib/contract";
import { signTx } from "../lib/stellar";
import ResultsBar from "./ResultsBar";
import TxStatus from "./TxStatus";

export default function PollCard({ address, votesA = 0, votesB = 0, onVoted }) {
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = votesA + votesB;

  const vote = async (option) => {
    if (!address) return;
    setError(null);
    setTxStatus(null);
    setTxHash(null);
    setLoading(true);

    try {
      // Step 1: Build unsigned transaction
      let xdr;
      try {
        xdr = await buildVoteTx(address, option);
      } catch (err) {
        // ERROR TYPE 3: Wallet / account not found on network
        if (
          err.message?.includes("not found") ||
          err.message?.includes("does not exist") ||
          err.message?.includes("WALLET_NOT_FOUND")
        ) {
          setError(
            "❌ Account not found on testnet. Please fund your wallet at friendbot.stellar.org"
          );
          return;
        }
        throw err;
      }

      // Step 2: Sign with wallet
      let signed;
      try {
        signed = await signTx(xdr);
      } catch (err) {
        // ERROR TYPE 1: User rejected the transaction in wallet
        const msg = err.message?.toLowerCase() ?? "";
        if (
          msg.includes("reject") ||
          msg.includes("denied") ||
          msg.includes("cancel") ||
          msg.includes("user declined")
        ) {
          setError("🚫 You rejected the transaction in your wallet.");
          return;
        }
        throw err;
      }

      // Step 3: Submit to network
      setTxStatus("pending");
      let hash;
      try {
        hash = await submitTx(signed);
        setTxHash(hash);
      } catch (err) {
        // ERROR TYPE 2: Insufficient balance
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("insufficient") || msg.includes("balance")) {
          setError(
            "💸 Insufficient XLM. Get free testnet XLM at friendbot.stellar.org"
          );
          setTxStatus("failed");
          return;
        }
        throw err;
      }

      // Step 4: Wait for confirmation
      const result = await waitForTx(hash);
setTxStatus(result.status.toLowerCase());
if (result.status === "SUCCESS" || result.status === "TIMEOUT") {
  onVoted?.();
}
    } catch (err) {
      console.error("Vote error:", err);
      setError("⚠️ Unexpected error: " + (err.message ?? "Unknown error"));
      setTxStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "19px",
          fontWeight: 700,
          marginBottom: "6px",
          color: "inherit",
        }}
      >
        🗳️ Which is better for smart contracts?
      </h2>
      <p
        style={{
          opacity: 0.5,
          marginBottom: "24px",
          fontSize: "13px",
        }}
      >
        {total} total vote{total !== 1 ? "s" : ""} · Results update live every
        10s
      </p>

      <ResultsBar
        label="🌟 Stellar / Soroban"
        votes={votesA}
        total={total}
        color="#2563eb"
      />
      <ResultsBar
        label="⚡ Ethereum / Solidity"
        votes={votesB}
        total={total}
        color="#7c3aed"
      />

      {address ? (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => vote("A")}
            disabled={loading}
            style={{
              background: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              padding: "11px 24px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "14px",
              flex: 1,
              transition: "background 0.2s",
            }}
          >
            {loading ? "⏳ Submitting..." : "Vote Stellar"}
          </button>
          <button
            onClick={() => vote("B")}
            disabled={loading}
            style={{
              background: loading ? "#c4b5fd" : "#7c3aed",
              color: "white",
              padding: "11px 24px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "14px",
              flex: 1,
              transition: "background 0.2s",
            }}
          >
            {loading ? "⏳ Submitting..." : "Vote Ethereum"}
          </button>
        </div>
      ) : (
        <p
          style={{
            textAlign: "center",
            opacity: 0.45,
            marginTop: "20px",
            fontSize: "14px",
            background: "rgba(0,0,0,0.04)",
            padding: "14px",
            borderRadius: "8px",
          }}
        >
          Connect your wallet above to cast a vote
        </p>
      )}

      {error && (
        <div
          style={{
            background: "var(--color-background-danger)",
            color: "var(--color-text-danger)",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            marginTop: "16px",
            border: "1px solid var(--color-border-danger)",
          }}
        >
          {error}
        </div>
      )}

      <TxStatus status={txStatus} hash={txHash} />
    </div>
  );
}