import * as freighterApi from "@stellar/freighter-api";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const moduleMap = {
  freighter: new FreighterModule(),
  albedo:    new AlbedoModule(),
  xbull:     new xBullModule(),
  lobstr:    new LobstrModule(),
};

export function getAvailableWallets() {
  return [
    { id: "freighter", name: "Freighter", icon: "🔑" },
    { id: "albedo",    name: "Albedo",    icon: "🌐" },
    { id: "xbull",     name: "xBull",     icon: "🐂" },
    { id: "lobstr",    name: "LOBSTR",    icon: "🦞" },
  ];
}

export async function connectWallet(walletId) {
  window._stellarWalletId = walletId;

  // Use Freighter API directly for Freighter
  if (walletId === "freighter") {
    const connected = await freighterApi.isConnected();
    if (!connected || !connected.isConnected) {
      throw new Error("Freighter is not installed. Get it at freighter.app");
    }
    const result = await freighterApi.getAddress();
    if (result.error) throw new Error(result.error);
    return result.address;
  }

  // For other wallets use module directly
  const mod = moduleMap[walletId];
  if (!mod) throw new Error("Wallet not found");

  window._stellarModule = mod;

  // Try getPublicKey first, then getAddress
  try {
    if (typeof mod.getPublicKey === "function") {
      const result = await mod.getPublicKey();
      return result.publicKey ?? result;
    }
    if (typeof mod.getAddress === "function") {
      const result = await mod.getAddress();
      return result.address ?? result;
    }
  } catch (e) {
    throw e;
  }

  throw new Error("Cannot get address from " + walletId);
}

export async function signTx(xdr) {
  const walletId = window._stellarWalletId;

  // Use Freighter API directly — 100% reliable
  if (walletId === "freighter") {
    const result = await freighterApi.signTransaction(xdr, {
      networkPassphrase: TESTNET_PASSPHRASE,
    });
    if (result.error) throw new Error(result.error);
    return result.signedTxXdr;
  }

  // For other wallets
  const mod = window._stellarModule;
  if (!mod) throw new Error("No wallet connected");

  const methods = ["signTransaction", "signTx", "sign"];
  for (const method of methods) {
    if (typeof mod[method] === "function") {
      try {
        const result = await mod[method]({
          xdr,
          network: "TESTNET",
          networkPassphrase: TESTNET_PASSPHRASE,
        });
        if (typeof result === "string") return result;
        return result.signedTxXdr ?? result.xdr ?? result;
      } catch (e) {
        throw e;
      }
    }
  }

  throw new Error("No signing method found");
}