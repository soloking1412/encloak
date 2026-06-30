# Confidential Wrapper Registry

A production dApp that turns the Zama Wrappers Registry into a usable product. Browse every ERC-20 ↔ ERC-7984 confidential token pair on Sepolia and Ethereum mainnet, wrap/unwrap tokens, decrypt balances, and claim Sepolia test tokens.

Built for the [Zama Developer Program Bounty Season 3](https://www.zama.org/developer-hub#developer-program).

## Live URL

**[https://confidential-wrapper-registry-kohl.vercel.app](https://confidential-wrapper-registry-kohl.vercel.app)**

## Supported Networks

| Network | Chain ID | Registry Address |
|---|---|---|
| Sepolia | 11155111 | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |
| Ethereum Mainnet | 1 | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |

## Features

- **Registry browser** — reads `getTokenConfidentialTokenPairs()` from the onchain Wrappers Registry. Shows all valid pairs with token metadata, conversion rate, and TVS (inferred total supply).
- **Wrap** — ERC-20 `approve` → wrapper `wrap` with live rate preview and approval step tracking.
- **Unwrap** — two-step async flow. Step 1 calls the Zama SDK `Token.unwrap()` and captures the `UnwrapRequested` event's encrypted-amount handle, persisting it to localStorage. Step 2 calls `Token.finalizeUnwrap(handle)` once the relayer has run the public decryption — survives page reloads.
- **Decrypt** — EIP-712 user decryption via the Zama SDK `ReadonlyToken.balanceOf()`. Works for all registry tokens and any arbitrary ERC-7984 address.
- **Faucet** (Sepolia only) — mint 1,000 of each cTokenMock directly to your wallet.
- **Pending unwraps tracker** — nav badge + panel showing all in-flight unwrap requests across sessions.
- **Add pair validator** — paste any ERC-20 + wrapper address to validate and generate the config snippet.

## How the Registry is Sourced

The app uses a **hybrid sourcing strategy**:

1. **Onchain (primary)** — calls `getTokenConfidentialTokenPairs()` on the official Wrappers Registry for the connected chain. Results are filtered to `isValid === true` pairs and enriched with metadata via wagmi multicall.

2. **Local config (secondary)** — `config/customPairs.ts` exports a `CUSTOM_PAIRS` array. Entries are merged with onchain pairs; onchain always wins on address conflict. Custom pairs are tagged `[custom]` in the UI.

## How to Add a New ERC-20 ↔ ERC-7984 Pair

Open `config/customPairs.ts` and append an entry:

```ts
export const CUSTOM_PAIRS: CustomPair[] = [
  {
    chainId: 11155111,
    erc20: {
      address: "0xYourERC20Address",
      name: "My Token",
      symbol: "MTK",
      decimals: 18,
    },
    wrapper: {
      address: "0xYourWrapperAddress",
      name: "Confidential My Token",
      symbol: "cMTK",
      decimals: 6,
    },
  },
]
```

You can also use the **Add Pair Validator** UI on the Wrap page (`/wrap`) to validate addresses against the registry and generate the config snippet automatically.

## Local Development

```bash
cp .env.example .env.local
# .env.local is entirely optional — leave it empty to use public defaults
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Every variable is **optional** — the app runs out of the box on Sepolia.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SEPOLIA_RPC` | No | Custom Sepolia JSON-RPC endpoint (falls back to a public node) |
| `NEXT_PUBLIC_MAINNET_RPC` | No | Custom Mainnet JSON-RPC endpoint (falls back to a public node) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | WalletConnect Cloud project ID — only for the WalletConnect modal; injected wallets work without it |

There is **no relayer URL or API key to configure**. The Zama SDK ships with the
public relayer endpoints (`relayer.testnet.zama.org` for Sepolia,
`relayer.mainnet.zama.org` for Mainnet) and uses them directly from the browser.

## Contract Addresses

The app reads every pair **live** from the onchain registry, so these tables are a
point-in-time snapshot — new pairs registered onchain appear automatically.

### Sepolia

| Token | Wrapper | Underlying ERC-20 |
|---|---|---|
| cUSDCMock | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` |
| cUSDTMock | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` | `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0` |
| cWETHMock | `0x46208622DA27d91db4f0393733C8BA082ed83158` | `0xff54739b16576FA5402F211D0b938469Ab9A5f3F` |
| cBRONMock | `0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891` | `0xFf021fB13cA64e5354c62c954b949a88cfDEb25E` |
| cZAMAMock | `0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB` | `0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57` |
| ctGBPMock | `0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC` | `0x93c931278A2aad1916783F952f94276eA5111442` |
| cXAUtMock | `0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7` | `0x24377AE4AA0C45ecEe71225007f17c5D423dd940` |
| ctGBP | `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208` | `0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3` |

### Mainnet

| Token | Wrapper | Underlying ERC-20 |
|---|---|---|
| cUSDC | `0xe978F22157048E5DB8E5d07971376e86671672B2` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| cUSDT | `0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| cWETH | `0xda9396b82634Ea99243cE51258B6A5Ae512D4893` | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| cBRON | `0x85dE671c3bec1aDeD752c3Cea943521181C826bc` | `0xBA2C598E11eD093079cC324FCa5BbbA99F616E83` |
| cZAMA | `0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071` | `0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3` |
| ctGBP | `0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9` | `0x27f6c8289550fCE67f6B50BeD1F519966aFE5287` |
| cXAUt | `0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1` | `0x68749665FF8D2d112Fa859AA293F07A622782F38` |
| cbbqTGBP | `0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762` | `0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F` |
| csteakcUSDC | `0x66Bf74E96900D1a19c7070D939D124f2F565C458` | `0xbEEF00A59B577423653A1526c7009bdE103F542B` |

## Architecture

```
Browser
  └─ Next.js App Router
       ├─ wagmi / viem  ──────────────────── Onchain reads (registry multicall) & writes (approve, wrap)
       ├─ @zama-fhe/sdk  ──────────────────── FHE encrypt / decrypt / unwrap / finalize via ViemSigner
       │    └─ public Zama relayer  ───────── reached directly with the SDK's built-in endpoints
       └─ config/customPairs.ts  ─────────── Extensibility point for non-registry pairs
```

## Known Async Behavior

Unwrap finalization requires a public decryption round-trip through the Zama relayer network. This typically takes **5–30 minutes**. The app persists all pending unwrap request IDs in localStorage so you can close the tab and return to finalize later.

## Open Source

MIT License. PRs and registry additions welcome.
