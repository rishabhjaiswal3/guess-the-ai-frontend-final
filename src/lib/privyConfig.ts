import type { PrivyClientConfig } from "@privy-io/react-auth";
import networkConfig from "@/lib/networkConfig";

export const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? "";

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    walletChainType: "ethereum-only",
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  loginMethods: ["email", "sms", "wallet", "google", "discord"],
  supportedChains: [networkConfig],
  defaultChain: networkConfig,
  intl: {
    defaultCountry: "US",
  },
};
