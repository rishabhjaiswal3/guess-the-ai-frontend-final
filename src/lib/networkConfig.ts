const ogGalileoTestnet = {
  id: 16601,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "OG",
    symbol: "OG",
  },
  rpcUrls: {
    public: { http: ["https://evmrpc-testnet.0g.ai"] },
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    etherscan: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
    default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
};

const ogMainnet = {
  id: 16661,
  name: "0G Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G",
  },
  rpcUrls: {
    public: { http: ["https://evmrpc.0g.ai"] },
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    etherscan: { name: "0G Explorer", url: "https://chainscan.0g.ai" },
    default: { name: "0G Explorer", url: "https://chainscan.0g.ai" },
  },
  testnet: false,
};

const networkConfig = import.meta.env.VITE_NETWORK === "mainnet" ? ogMainnet : ogGalileoTestnet;

export default networkConfig;
