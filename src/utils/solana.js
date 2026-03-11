import {
  createBurnInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const RENT_PER_ACCOUNT = 0.00203928; // SOL rent for a token account
export const FEE_PCT = 0.05; // 5% service fee
export const FEE_WALLET = new PublicKey('4pATFER7WrbRNAicBaMGEWi546ChfCtqNorynakuwMQ5');
const CLOSE_ONLY_BATCH = 11; // Zero-balance: just close (no fee instruction needed per batch now)
const BURN_CLOSE_BATCH = 5;  // Has balance: burn+close

// Build batched transactions for cleanup
// Fee is collected as a SINGLE final transaction after all closes succeed
export function buildCleanupTransactions(accounts, walletPublicKey) {
  const zeroAccounts = accounts.filter(a => a.balance === 0);
  const burnAccounts = accounts.filter(a => a.balance > 0);
  const transactions = [];

  // Batch zero-balance accounts (close only)
  for (let i = 0; i < zeroAccounts.length; i += CLOSE_ONLY_BATCH) {
    const batch = zeroAccounts.slice(i, i + CLOSE_ONLY_BATCH);
    const tx = new Transaction();
    for (const account of batch) {
      tx.add(createCloseAccountInstruction(
        new PublicKey(account.address), walletPublicKey, walletPublicKey
      ));
    }
    transactions.push({ tx, count: batch.length, accounts: batch, isFee: false });
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
    transactions.push({ tx, count: batch.length, accounts: batch, isFee: false });
  }

  // Final fee transaction (single transfer after all closes)
  const totalFeeLamports = Math.floor(accounts.length * RENT_PER_ACCOUNT * LAMPORTS_PER_SOL * FEE_PCT);
  if (totalFeeLamports > 0) {
    const feeTx = new Transaction();
    feeTx.add(SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: FEE_WALLET,
      lamports: totalFeeLamports,
    }));
    transactions.push({ tx: feeTx, count: 0, accounts: [], isFee: true, feeLamports: totalFeeLamports });
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
