// src/config/constants.js

/* =========================
   NETWORK CONFIG
========================= */
export const TEMPO_NETWORK = {
  chainId: 42429,
  name: "Tempo Testnet (Andantino)",
  rpc: "https://rpc.testnet.tempo.xyz",
  explorer: "https://explore.tempo.xyz",
  currency: "USD",
  symbol: "ETH"
};

/* =========================
   CONTRACT ADDRESSES
========================= */
export const CONTRACTS = {
  tokens: {
    OmUsd: {
      address: "0xBF14175907a7E64DDB8e0C5534bF7A4b1A02f18F",
      decimals: 18,
      symbol: "OMUSD",
      name: "Omni USD"
    },
    TmEth: {
      address: "0xb9b6D36e1B31525d8EE24A2d8Ea4E29aaEdAE9Ec",
      decimals: 18,
      symbol: "TMETH",
      name: "Tempo ETH"
    },
    TmUsdt: {
      address: "0x42C110818e147CC666E1A304Fc4CAef2892c27C7",
      decimals: 6,
      symbol: "TMUSDT",
      name: "Tempo USDT"
    },
    TmUsdc: {
      address: "0x1407d60809844C404Db6D4ceFbC99DCC875baB90",
      decimals: 6,
      symbol: "TMUSDC",
      name: "Tempo USDC"
    },
    TmBtc: {
      address: "0xbd897d13EF8976096E344C460049A5AFc3EDd75b",
      decimals: 8,
      symbol: "TMBTC",
      name: "Tempo BTC"
    }
  },

  core: {
    factory: "0x7CbBf39f4444913a38098414402D79041E8c055C",
    router: "0xa9eA686C102327d7718838092380f437Ecc60576"
  }
};

/* =========================
   FAUCET / MINT AMOUNTS
========================= */
export const MINT_AMOUNTS = {
  OmUsd: "1000000000000000000000", // 1000
  TmEth: "1000000000000000000000", // 1000
  TmUsdt: "1000000000",            // 1000
  TmUsdc: "1000000000",            // 1000
  TmBtc: "100000000000"            // 1000
};

/* =========================
   ERC20 TOKEN ABI
========================= */
export const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function mint(uint256 amount) external",
  "function totalSupply() view returns (uint256)"
];

/* =========================
   ROUTER ABI (UNISWAP V2)
========================= */
export const ROUTER_ABI = [
  "function factory() view returns (address)",
  "function WETH() view returns (address)",

  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",

  "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) returns (uint[] memory amounts)",

  "function addLiquidity(address tokenA,address tokenB,uint amountADesired,uint amountBDesired,uint amountAMin,uint amountBMin,address to,uint deadline) returns (uint amountA,uint amountB,uint liquidity)",

  "function removeLiquidity(address tokenA,address tokenB,uint liquidity,uint amountAMin,uint amountBMin,address to,uint deadline) returns (uint amountA,uint amountB)"
];

/* =========================
   FACTORY ABI
========================= */
export const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairs(uint index) view returns (address pair)",
  "function allPairsLength() view returns (uint)"
];

/* =========================
   PAIR (LP TOKEN) ABI
========================= */
export const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function totalSupply() view returns (uint)",
  "function balanceOf(address owner) view returns (uint)",
  "function approve(address spender, uint value) returns (bool)"
];
