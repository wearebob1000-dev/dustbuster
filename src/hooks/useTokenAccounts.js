import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchTokenAccounts, RENT_PER_ACCOUNT } from '../utils/solana';
import { checkLiquidity, getTokenNames } from '../utils/dexscreener';

export function useTokenAccounts() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [accounts, setAccounts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [error, setError] = useState(null);

  const scan = useCallback(async () => {
    if (!publicKey) return;
    setScanning(true);
    setError(null);
    setScanProgress('Fetching token accounts...');

    try {
      const raw = await fetchTokenAccounts(connection, publicKey);
      setScanProgress(`Found ${raw.length} token accounts. Checking liquidity...`);

      // Separate zero-balance from non-zero
      const zeroBalance = raw.filter((a) => a.balance === 0);
      const withBalance = raw.filter((a) => a.balance > 0);

      // SAFETY NET 1: Load Jupiter verified/community token list
      // Any token on this list is KNOWN to have value — never allow burning
      const allMints = [...new Set(raw.map(a => a.mint))];
      setScanProgress('Loading Jupiter token safety list...');
      const tokenNames = await getTokenNames(allMints);
      const jupiterMints = new Set(tokenNames.keys()); // mints on Jupiter = protected

      // Check liquidity for accounts with balance
      const mintsToCheck = [...new Set(withBalance.map((a) => a.mint))];
      let liquidityMap = new Map();

      if (mintsToCheck.length > 0) {
        setScanProgress(
          `Checking liquidity for ${mintsToCheck.length} tokens (this may take a while for large wallets)...`
        );
        liquidityMap = await checkLiquidity(mintsToCheck);
      }

      // Count unverified for reporting
      let unverifiedCount = 0;
      let jupiterProtectedCount = 0;

      // Categorize all accounts
      const categorized = [];

      for (const acct of zeroBalance) {
        const nameInfo = tokenNames.get(acct.mint) || {};
        categorized.push({
          ...acct,
          category: 'zero',
          categoryLabel: 'Zero Balance',
          hasLiquidity: false,
          priceUsd: 0,
          valueUsd: 0,
          liquidity: 0,
          rentSol: RENT_PER_ACCOUNT,
          tokenName: nameInfo.name || '',
          tokenSymbol: nameInfo.symbol || '',
        });
      }

      for (const acct of withBalance) {
        const info = liquidityMap.get(acct.mint) || {
          hasLiquidity: false,
          priceUsd: 0,
          liquidity: 0,
          verified: false,
        };
        const valueUsd = acct.balance * info.priceUsd;
        const isOnJupiter = jupiterMints.has(acct.mint);

        let category, categoryLabel;

        // SAFETY NET 1: Jupiter-listed tokens are ALWAYS protected
        if (isOnJupiter && acct.balance > 0) {
          category = 'valuable';
          categoryLabel = 'Known Token';
          jupiterProtectedCount++;
        } else if (!info.verified) {
          // Could not verify liquidity — DO NOT allow burning
          category = 'unverified';
          categoryLabel = '⚠️ Unverified';
          unverifiedCount++;
        } else if (!info.hasLiquidity) {
          category = 'dead';
          categoryLabel = 'Dead Token';
        } else if (valueUsd < 0.5) {
          category = 'dust';
          categoryLabel = 'Low Value Dust';
        } else {
          category = 'valuable';
          categoryLabel = 'Has Value';
        }

        const nameInfo = tokenNames.get(acct.mint) || {};
        categorized.push({
          ...acct,
          category,
          categoryLabel,
          hasLiquidity: info.hasLiquidity || isOnJupiter,
          priceUsd: info.priceUsd,
          valueUsd,
          liquidity: info.liquidity,
          rentSol: RENT_PER_ACCOUNT,
          tokenName: info.name || nameInfo.name || '',
          tokenSymbol: info.symbol || nameInfo.symbol || '',
        });
      }

      // Sort: zero first, then dead, then dust, then unverified, then valuable
      const order = { zero: 0, dead: 1, dust: 2, unverified: 3, valuable: 4 };
      categorized.sort((a, b) => order[a.category] - order[b.category]);

      setAccounts(categorized);

      // Report scan quality
      if (unverifiedCount > 0) {
        setScanProgress(
          `⚠️ ${unverifiedCount} tokens couldn't be verified (DexScreener rate limit). These are protected from burning. Rescan to retry.`
        );
      } else {
        setScanProgress('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }, [connection, publicKey]);

  return { accounts, scanning, scanProgress, error, scan };
}
