import {
  createBurnInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const RENT_PER_ACCOUNT = 0.00203928; // SOL rent for a token account
export const FEE_PCT = 0.05; // 5% service fee
export const FEE_WALLET = new PublicKey('4pATFER7WrbRNAicBaMGEWi546ChfCtqNorynakuwMQ5');
const BATCH_SIZE = 6; // Slightly smaller to fit fee transfer instruction

// Build batched transactions for cleanup
export function buildCleanupTransactions(accounts, walletPublicKey) {
  const transactions = [];

  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE);
    const tx = new Transaction();

    for (const account of batch) {
      const tokenAccountPubkey = new PublicKey(account.address);

      // If account has balance, burn first
      if (account.balance > 0) {
        tx.add(
          createBurnInstruction(
            tokenAccountPubkey,
            new PublicKey(account.mint),
            walletPublicKey,
            BigInt(account.balanceRaw)
          )
        );
      }

      // Close the account to reclaim rent
      tx.add(
        createCloseAccountInstruction(
          tokenAccountPubkey,
          walletPublicKey, // rent destination
          walletPublicKey  // authority
        )
      );
    }

    // Add 5% fee transfer for this batch
    const batchRentLamports = Math.floor(batch.length * RENT_PER_ACCOUNT * LAMPORTS_PER_SOL);
    const feeLamports = Math.floor(batchRentLamports * FEE_PCT);
    if (feeLamports > 0) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: FEE_WALLET,
          lamports: feeLamports,
        })
      );
    }

    transactions.push({
      tx,
      count: batch.length,
      accounts: batch,
      feeLamports,
    });
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
