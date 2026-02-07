import type { PrivyClientConfig } from "@privy-io/react-auth";
import networkConfig from "@/lib/networkConfig";

export const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? "";
const rawWalletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";
// Filter out placeholder values
export const walletConnectProjectId =
  rawWalletConnectProjectId && !rawWalletConnectProjectId.includes("YOUR_")
    ? rawWalletConnectProjectId
    : "";

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    accentColor: "#00d4ff",
    walletChainType: "ethereum-only",
    showWalletLoginFirst: true,
  },
  walletConnectCloudProjectId: walletConnectProjectId || undefined,
  // Note: Coinbase Smart Wallet doesn't support 0G chain (16661), but users can still
  // connect with regular Coinbase Wallet browser extension which works fine.
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  // Wallet + email OTP only
  loginMethods: ["wallet", "email"],
  supportedChains: [networkConfig],
  defaultChain: networkConfig,
  intl: {
    defaultCountry: "US",
  },
};
