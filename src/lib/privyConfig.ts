import type { PrivyClientConfig } from "@privy-io/react-auth";
import networkConfig from "@/lib/networkConfig";

export const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? "";
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    accentColor: "#00d4ff",
    walletChainType: "ethereum-only",
    showWalletLoginFirst: true,
  },
  wallets: {
    injected: {
      enabled: true,
    },
    walletConnect: walletConnectProjectId
      ? {
          projectId: walletConnectProjectId,
        }
      : undefined,
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  // Include OAuth providers to avoid exited_auth_flow errors when users choose them
  loginMethods: ["wallet", "email", "sms", "google", "discord"],
  supportedChains: [networkConfig],
  defaultChain: networkConfig,
  mobileConfig: {
    preferredWalletConnectVersion: 2,
  },
  intl: {
    defaultCountry: "US",
  },
};
