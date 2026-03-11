const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

// Fetch token names from Jupiter's token list
let _tokenNameCache = null;
export async function getTokenNames(mints) {
  const names = new Map();
  try {
    if (!_tokenNameCache) {
      const res = await fetch('https://tokens.jup.ag/tokens?tags=verified,community');
      if (res.ok) {
        const tokens = await res.json();
        _tokenNameCache = new Map();
        for (const t of tokens) {
          _tokenNameCache.set(t.address, { name: t.name, symbol: t.symbol });
        }
      }
    }
    if (_tokenNameCache) {
      for (const mint of mints) {
        const info = _tokenNameCache.get(mint);
        if (info) names.set(mint, info);
      }
    }
  } catch { /* fail silently */ }
  return names;
}

// Fetch a single token with retry
async function fetchWithRetry(mint, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${DEXSCREENER_API}/${mint}`);
      if (res.status === 429) {
        // Rate limited — wait longer and retry
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return { mint, pairs: [], verified: false };
      const data = await res.json();
      return { mint, pairs: data.pairs || [], verified: true };
    } catch {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  // All retries failed — mark as UNVERIFIED
  return { mint, pairs: [], verified: false };
}

// Batch check liquidity for multiple mints
export async function checkLiquidity(mints) {
  const results = new Map();

  // Process in smaller chunks with more delay to avoid rate limits
  const chunkSize = 15;
  for (let i = 0; i < mints.length; i += chunkSize) {
    const chunk = mints.slice(i, i + chunkSize);

    const promises = chunk.map((mint) => fetchWithRetry(mint));
    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { mint, pairs, verified } = result.value;
        const solanaPairs = pairs.filter((p) => p.chainId === 'solana');

        if (solanaPairs.length === 0) {
          results.set(mint, {
            hasLiquidity: false,
            priceUsd: 0,
            liquidity: 0,
            verified, // false = we couldn't confirm it's actually dead
          });
        } else {
          const best = solanaPairs.reduce((a, b) =>
            (b.liquidity?.usd || 0) > (a.liquidity?.usd || 0) ? b : a
          );
          const liq = best.liquidity?.usd || 0;
          const price = parseFloat(best.priceUsd || '0');
          results.set(mint, {
            hasLiquidity: liq > 100,
            priceUsd: price,
            liquidity: liq,
            name: best.baseToken?.name || '',
            symbol: best.baseToken?.symbol || '',
            verified: true,
          });
        }
      }
    }

    // More aggressive rate limiting
    if (i + chunkSize < mints.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // RETRY pass: any unverified tokens get a second chance (sequential, slow)
  const unverified = [...results.entries()].filter(([, v]) => !v.verified);
  if (unverified.length > 0) {
    for (const [mint] of unverified) {
      await new Promise((r) => setTimeout(r, 1500));
      const result = await fetchWithRetry(mint, 2);
      if (result.verified) {
        const solanaPairs = result.pairs.filter((p) => p.chainId === 'solana');
        if (solanaPairs.length === 0) {
          results.set(mint, { hasLiquidity: false, priceUsd: 0, liquidity: 0, verified: true });
        } else {
          const best = solanaPairs.reduce((a, b) =>
            (b.liquidity?.usd || 0) > (a.liquidity?.usd || 0) ? b : a
          );
          const liq = best.liquidity?.usd || 0;
          const price = parseFloat(best.priceUsd || '0');
          results.set(mint, {
            hasLiquidity: liq > 100, priceUsd: price, liquidity: liq,
            name: best.baseToken?.name || '', symbol: best.baseToken?.symbol || '',
            verified: true,
          });
        }
      }
    }
  }

  return results;
}
