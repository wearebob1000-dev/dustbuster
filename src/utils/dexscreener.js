const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

// Batch check liquidity for multiple mints
// DexScreener supports comma-separated mints (up to ~30 at a time)
export async function checkLiquidity(mints) {
  const results = new Map();

  // Process in chunks of 30
  const chunkSize = 30;
  for (let i = 0; i < mints.length; i += chunkSize) {
    const chunk = mints.slice(i, i + chunkSize);

    // DexScreener only supports single-token lookups, so we batch with Promise.allSettled
    const promises = chunk.map(async (mint) => {
      try {
        const res = await fetch(`${DEXSCREENER_API}/${mint}`);
        if (!res.ok) return { mint, pairs: [] };
        const data = await res.json();
        return { mint, pairs: data.pairs || [] };
      } catch {
        return { mint, pairs: [] };
      }
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { mint, pairs } = result.value;
        const solanaPairs = pairs.filter((p) => p.chainId === 'solana');

        if (solanaPairs.length === 0) {
          results.set(mint, { hasLiquidity: false, priceUsd: 0, liquidity: 0 });
        } else {
          // Use the pair with highest liquidity
          const best = solanaPairs.reduce((a, b) =>
            (b.liquidity?.usd || 0) > (a.liquidity?.usd || 0) ? b : a
          );
          const liq = best.liquidity?.usd || 0;
          const price = parseFloat(best.priceUsd || '0');
          results.set(mint, {
            hasLiquidity: liq > 100, // $100 minimum to consider "has liquidity"
            priceUsd: price,
            liquidity: liq,
          });
        }
      }
    }

    // Rate limit between chunks
    if (i + chunkSize < mints.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
