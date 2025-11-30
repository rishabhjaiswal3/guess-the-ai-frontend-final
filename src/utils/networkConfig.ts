import type { Chain } from 'viem/chains';

const ogGalileoTestnet = {
  id: 16601,
  name: '0G Galileo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: ['https://evmrpc-testnet.0g.ai'] },
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    etherscan: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
} as const satisfies Chain;

const ogMainnet = {
  id: 16661,
  name: 'Aristotle',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: ['https://evmrpc.0g.ai'] },
    default: { http: ['https://rpc.ankr.com/0g_mainnet_evm'] },
  },
  blockExplorers: {
    etherscan: { name: '0G Explorer', url: 'https://chainscan.0g.ai' },
    default: { name: '0G Explorer', url: 'https://chainscan.0g.ai' },
  },
  testnet: true,
} as const satisfies Chain;

const networkConfig: Chain = import.meta.env.VITE_NETWORK === 'mainnet' ? ogMainnet : ogGalileoTestnet;

export default networkConfig;
