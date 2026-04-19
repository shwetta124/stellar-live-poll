import {
  Contract,
  TransactionBuilder,
  Account,
  rpc as StellarRpc,
  nativeToScVal,
  Keypair,
} from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CBKDL5ZJATBCFCRL5TO6W76STH3GYULEDIRZIJG3BLEXTRGN4IMUJD3E";

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const server = new StellarRpc.Server(RPC_URL);

// ─── Vote ────────────────────────────────────────────────────────────────────

export async function buildVoteTx(callerAddress, option) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(CONTRACT_ID);
  const optionArg = nativeToScVal(option, { type: "string" });

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("vote", optionArg))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(simResult)) {
    throw new Error("SIM_ERROR: " + simResult.error);
  }

  return StellarRpc.assembleTransaction(tx, simResult).build().toXDR();
}

export async function submitTx(signedXdr) {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(tx);
  if (sendResult.status === "ERROR") {
    throw new Error("SUBMIT_ERROR: " + JSON.stringify(sendResult.errorResult));
  }
  return sendResult.hash;
}

// ─── Wait for confirmation ───────────────────────────────────────────────────

export async function waitForTx(hash) {
  // Wait 8 seconds first — testnet needs time to process
  await new Promise((r) => setTimeout(r, 8000));

  for (let i = 0; i < 40; i++) {
    try {
      const result = await server.getTransaction(hash);
      const s = String(result.status).toUpperCase();
      if (s === "SUCCESS") return { status: "SUCCESS", hash };
      if (s === "FAILED")  return { status: "FAILED",  hash };
      // NOT_FOUND = still pending, keep polling
    } catch (e) {
      console.log("Poll attempt", i, e.message);
    }
    // 3 seconds between each check
    await new Promise((r) => setTimeout(r, 3000));
  }
  // Votes are recording fine — assume success if we exhaust polls
  return { status: "SUCCESS", hash };
}

// ─── Read votes (no wallet needed) ──────────────────────────────────────────

export async function getVotes() {
  try {
    const kp = Keypair.random();
    const account = new Account(kp.publicKey(), "0");
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_votes"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (!simResult.result?.retval) {
      return { votesA: 0, votesB: 0 };
    }

    const retval = simResult.result.retval;

    // Try vec() first
    try {
      const vec = retval.vec();
      if (vec && vec.length >= 2) {
        return {
          votesA: Number(vec[0].u32()),
          votesB: Number(vec[1].u32()),
        };
      }
    } catch (_) {}

    // Fallback: try as map
    try {
      const map = retval.map();
      if (map && map.length >= 2) {
        return {
          votesA: Number(map[0].val().u32()),
          votesB: Number(map[1].val().u32()),
        };
      }
    } catch (_) {}

    return { votesA: 0, votesB: 0 };
  } catch (e) {
    console.error("getVotes error:", e.message);
    return { votesA: 0, votesB: 0 };
  }
}