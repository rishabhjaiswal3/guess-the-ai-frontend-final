import type { PrivyClientConfig } from "@privy-io/react-auth";
import networkConfig from "@/lib/networkConfig";

export const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? "";

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
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  loginMethods: ["wallet", "email", "sms"],
  supportedChains: [networkConfig],
  defaultChain: networkConfig,
  mobileConfig: {
    preferredWalletConnectVersion: 2,
  },
  intl: {
    defaultCountry: "US",
  },
};
