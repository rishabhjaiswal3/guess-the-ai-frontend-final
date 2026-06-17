export type OnchainContractKey = "events" | "answerSubmissions" | "leaderboard";

export type OnchainPublicConfig = {
  enabled: boolean;
  chainId: number;
  chainName: string;
  currency: string;
  explorerUrl: string;
  seasonId: number;
  operatorAddress: string | null;
  contracts: Record<OnchainContractKey, string | null>;
};

export const DEFAULT_ONCHAIN_CONFIG: OnchainPublicConfig = {
  enabled: true,
  chainId: 16661,
  chainName: "0G Mainnet",
  currency: "OG",
  explorerUrl: "https://chainscan.0g.ai",
  seasonId: 1,
  operatorAddress: null,
  contracts: {
    events: "0x4aCfb1a2Dc270846A7913757189543e4C18F7826",
    answerSubmissions: "0x73d377634F906fD24fE342fd95182c3c80bCFe49",
    leaderboard: "0xDC340Af8b5060Abd8BdA23cCF936ea2FDE3CB3Ce",
  },
};

export const ONCHAIN_CONTRACT_LABELS: Record<OnchainContractKey, string> = {
  events: "Guess The AI Events",
  answerSubmissions: "Answer Submissions",
  leaderboard: "Leaderboard",
};

export function mergeOnchainConfig(
  remote?: Partial<OnchainPublicConfig> | null
): OnchainPublicConfig {
  if (!remote) return DEFAULT_ONCHAIN_CONFIG;

  return {
    ...DEFAULT_ONCHAIN_CONFIG,
    ...remote,
    contracts: {
      ...DEFAULT_ONCHAIN_CONFIG.contracts,
      ...(remote.contracts || {}),
    },
  };
}

export function contractExplorerUrl(
  explorerUrl: string,
  address: string
): string {
  return `${explorerUrl.replace(/\/+$/, "")}/address/${address}`;
}

export function txExplorerUrl(explorerUrl: string, hash: string): string {
  return `${explorerUrl.replace(/\/+$/, "")}/tx/${hash}`;
}
