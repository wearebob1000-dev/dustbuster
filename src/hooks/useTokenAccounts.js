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

      // Check liquidity for accounts with balance
      const mintsToCheck = [...new Set(withBalance.map((a) => a.mint))];
      let liquidityMap = new Map();

      if (mintsToCheck.length > 0) {
        setScanProgress(
          `Checking liquidity for ${mintsToCheck.length} tokens...`
        );
        liquidityMap = await checkLiquidity(mintsToCheck);
      }

      // Fetch token names for all mints
      const allMints = [...new Set(raw.map(a => a.mint))];
      setScanProgress(`Looking up token names...`);
      const tokenNames = await getTokenNames(allMints);

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
        };
        const valueUsd = acct.balance * info.priceUsd;

        let category, categoryLabel;
        if (!info.hasLiquidity) {
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
          hasLiquidity: info.hasLiquidity,
          priceUsd: info.priceUsd,
          valueUsd,
          liquidity: info.liquidity,
          rentSol: RENT_PER_ACCOUNT,
          tokenName: info.name || nameInfo.name || '',
          tokenSymbol: info.symbol || nameInfo.symbol || '',
        });
      }

      // Sort: zero first, then dead, then dust, then valuable
      const order = { zero: 0, dead: 1, dust: 2, valuable: 3 };
      categorized.sort((a, b) => order[a.category] - order[b.category]);

      setAccounts(categorized);
      setScanProgress('');
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }, [connection, publicKey]);

  return { accounts, scanning, scanProgress, error, scan };
}
