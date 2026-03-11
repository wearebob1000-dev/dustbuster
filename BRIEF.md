# DustBuster — Solana Wallet Cleanup dApp

## What It Does
A single-page web app that connects to Phantom/Solflare wallets and batch-cleans dead token positions, reclaiming locked SOL rent.

## The Problem
Memecoin traders accumulate hundreds of dead token accounts. Each locks ~0.00204 SOL in rent. 200 dead positions = 0.4 SOL wasted. Existing tools (Sol Incinerator) only close zero-balance accounts. DustBuster goes further.

## Three Categories of Cleanup

### 1. Zero Balance Accounts
- Token account exists but balance = 0 (already sold)
- Action: Close account → reclaim rent (~0.00204 SOL each)
- Uses: `closeAccount` instruction from SPL Token program

### 2. Dust with Zero Liquidity (Dead Tokens)
- Token account has tokens but the token has NO liquidity (dead/rugged)
- Can't sell because no market exists
- Action: Burn tokens → close account → reclaim rent
- Uses: `burn` + `closeAccount` instructions

### 3. Dust with Some Liquidity (Optional Sell)
- Token account has tokens worth < $0.50 but liquidity exists
- Action: Sell via Jupiter → close account → reclaim rent
- This is optional/advanced — start with categories 1 & 2

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS
- **Wallet**: @solana/wallet-adapter-react (Phantom, Solflare, Backpack)
- **Solana**: @solana/web3.js, @solana/spl-token
- **Price/Liquidity Check**: DexScreener API (free, no key needed)
  - `https://api.dexscreener.com/latest/dex/tokens/{mint}` — returns liquidity, price
- **Sell**: Jupiter API (if implementing category 3)

## Key Technical Details

### Getting all token accounts for a wallet:
```js
const accounts = await connection.getParsedTokenAccountsByOwner(
  walletPublicKey,
  { programId: TOKEN_PROGRAM_ID }
);
```
This returns ALL token accounts with mint, balance, decimals.

### Closing an account (zero balance):
```js
import { createCloseAccountInstruction } from '@solana/spl-token';
// closeAccount(account, destination, owner)
```

### Burning tokens + closing:
```js
import { createBurnInstruction, createCloseAccountInstruction } from '@solana/spl-token';
// 1. Burn all tokens in the account
// 2. Close the now-empty account
```

### Batching:
- Solana transactions can hold multiple instructions
- Batch up to ~20 close/burn+close operations per transaction (watch compute limits)
- Show progress: "Closing batch 1/5..."

## UI Flow
1. Landing page with "Connect Wallet" button
2. After connect: scan wallet, show results
3. Display table:
   - Token name/symbol (if available from metadata)
   - Balance (raw tokens)
   - Liquidity status (🟢 has liquidity / 🔴 dead / ⚫ zero balance)
   - Estimated value
   - Rent locked
4. "Select All Dead" / "Select All" checkboxes
5. Big "Clean Up" button showing: "Reclaim X.XX SOL from Y accounts"
6. Transaction approval in wallet
7. Progress bar as batches process
8. Summary: "Done! Reclaimed X.XX SOL"

## Revenue Model (implement later)
- Option A: 5% of reclaimed SOL (automatic, built into transactions)
- Option B: Flat 0.01 SOL per cleanup session
- Start FREE to get users, add monetization later

## Design Vibe
- Dark theme (traders live in dark mode)
- Clean, minimal, fast
- Show the SOL savings prominently — that's the hook
- Ghost/dust themed branding 👻🧹

## MVP Scope (v1)
- Categories 1 & 2 only (zero balance + dead dust)
- Phantom wallet only
- Mainnet
- No sell functionality yet
- Free (no fee)

## Reference Code
Our existing cleanup script is at `/Users/bob/clawd/nightshift/cleanup-dust.js` — use it as reference for the Solana logic but build fresh for the web.

## RPC
Use public mainnet RPC for the dApp (users bring their own connection via wallet).
Default: `https://api.mainnet-beta.solana.com`

## Deployment
GitHub Pages or Vercel (free tier). Single static site, no backend needed.
