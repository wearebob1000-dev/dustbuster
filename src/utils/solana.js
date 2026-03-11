import {
  createBurnInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const RENT_PER_ACCOUNT = 0.00203928; // SOL rent for a token account
export const FEE_PCT = 0.05; // 5% service fee
export const FEE_WALLET = new PublicKey('4pATFER7WrbRNAicBaMGEWi546ChfCtqNorynakuwMQ5');
const CLOSE_ONLY_BATCH = 10; // Zero-balance: just close (1 instruction each)
const BURN_CLOSE_BATCH = 5;  // Has balance: burn+close (2 instructions each)

// Build batched transactions for cleanup
export function buildCleanupTransactions(accounts, walletPublicKey) {
  const zeroAccounts = accounts.filter(a => a.balance === 0);
  const burnAccounts = accounts.filter(a => a.balance > 0);
  const transactions = [];

  // Batch zero-balance accounts (close only — more per tx)
  for (let i = 0; i < zeroAccounts.length; i += CLOSE_ONLY_BATCH) {
    const batch = zeroAccounts.slice(i, i + CLOSE_ONLY_BATCH);
    const tx = new Transaction();
    for (const account of batch) {
      tx.add(createCloseAccountInstruction(
        new PublicKey(account.address), walletPublicKey, walletPublicKey
      ));
    }
    const feeLamports = Math.floor(batch.length * RENT_PER_ACCOUNT * LAMPORTS_PER_SOL * FEE_PCT);
    if (feeLamports > 0) {
      tx.add(SystemProgram.transfer({
        fromPubkey: walletPublicKey, toPubkey: FEE_WALLET, lamports: feeLamports,
      }));
    }
    transactions.push({ tx, count: batch.length, accounts: batch, feeLamports });
  }

  // Batch burn+close accounts
  for (let i = 0; i < burnAccounts.length; i += BURN_CLOSE_BATCH) {
    const batch = burnAccounts.slice(i, i + BURN_CLOSE_BATCH);
    const tx = new Transaction();
    for (const account of batch) {
      tx.add(createBurnInstruction(
        new PublicKey(account.address), new PublicKey(account.mint),
        walletPublicKey, BigInt(account.balanceRaw)
      ));
      tx.add(createCloseAccountInstruction(
        new PublicKey(account.address), walletPublicKey, walletPublicKey
      ));
    }
    const feeLamports = Math.floor(batch.length * RENT_PER_ACCOUNT * LAMPORTS_PER_SOL * FEE_PCT);
    if (feeLamports > 0) {
      tx.add(SystemProgram.transfer({
        fromPubkey: walletPublicKey, toPubkey: FEE_WALLET, lamports: feeLamports,
      }));
    }
    transactions.push({ tx, count: batch.length, accounts: batch, feeLamports });
  }

  return transactions;
}

// Fetch all token accounts for a wallet
export async function fetchTokenAccounts(connection, walletPublicKey) {
  const response = await connection.getParsedTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  return response.value.map((item) => {
    const info = item.account.data.parsed.info;
    return {
      address: item.pubkey.toBase58(),
      mint: info.mint,
      balance: info.tokenAmount.uiAmount || 0,
      balanceRaw: info.tokenAmount.amount,
      decimals: info.tokenAmount.decimals,
    };
  });
}
