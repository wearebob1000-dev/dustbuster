import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTokenAccounts } from '../hooks/useTokenAccounts';
import { buildCleanupTransactions, RENT_PER_ACCOUNT } from '../utils/solana';
import TokenTable from './TokenTable';
import CleanupProgress from './CleanupProgress';

export default function Scanner() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { accounts, scanning, scanProgress, error, scan } = useTokenAccounts();
  const [selected, setSelected] = useState(new Set());
  const [cleanupProgress, setCleanupProgress] = useState(null);

  // Auto-scan on mount
  useEffect(() => {
    if (publicKey && accounts.length === 0 && !scanning) {
      scan();
    }
  }, [publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAccount = useCallback((address) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (subset) => {
      setSelected((prev) => {
        const allInSubset = subset.every((a) => prev.has(a.address));
        const next = new Set(prev);
        if (allInSubset) {
          subset.forEach((a) => next.delete(a.address));
        } else {
          subset.forEach((a) => next.add(a.address));
        }
        return next;
      });
    },
    []
  );

  const handleCleanup = useCallback(async () => {
    if (!publicKey || selected.size === 0) return;

    const selectedAccounts = accounts.filter((a) => selected.has(a.address));
    const batches = buildCleanupTransactions(selectedAccounts, publicKey);

    setCleanupProgress({
      status: 'processing',
      currentBatch: 0,
      totalBatches: batches.length,
      completed: 0,
      failed: 0,
      total: selectedAccounts.length,
      results: [],
    });

    let completed = 0;
    let failed = 0;
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      setCleanupProgress((prev) => ({
        ...prev,
        currentBatch: i + 1,
      }));

      try {
        const { tx, count } = batches[i];
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;

        const signed = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
        });
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          'confirmed'
        );

        completed += count;
        results.push({ success: true, sig });
      } catch (err) {
        failed += batches[i].count;
        results.push({ success: false, error: err.message });
      }

      setCleanupProgress((prev) => ({ ...prev, completed, failed, results }));
    }

    setCleanupProgress((prev) => ({ ...prev, status: 'done' }));
  }, [publicKey, selected, accounts, connection, signTransaction]);

  const handleCleanupClose = useCallback(() => {
    setCleanupProgress(null);
    setSelected(new Set());
    scan(); // rescan
  }, [scan]);

  // Summary stats
  const selectedAccounts = accounts.filter((a) => selected.has(a.address));
  const reclaimableSol = selectedAccounts.length * RENT_PER_ACCOUNT;
  const stats = {
    zero: accounts.filter((a) => a.category === 'zero').length,
    dead: accounts.filter((a) => a.category === 'dead').length,
    dust: accounts.filter((a) => a.category === 'dust').length,
    valuable: accounts.filter((a) => a.category === 'valuable').length,
    totalRent: accounts
      .filter((a) => a.category !== 'valuable')
      .reduce((sum, a) => sum + a.rentSol, 0),
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Wallet Scanner</h2>
          <p className="text-gray-500 text-sm mt-1">
            {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : ''}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={scan}
            disabled={scanning}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 font-medium rounded-xl transition-colors cursor-pointer"
          >
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
          <WalletMultiButton />
        </div>
      </div>

      {/* Scanning state */}
      {scanning && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4 animate-spin inline-block">🧹</div>
          <p className="text-gray-300 text-lg">{scanProgress || 'Scanning...'}</p>
          <p className="text-gray-500 text-sm mt-2">
            This may take a moment for wallets with many tokens
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-2xl p-6 mb-6">
          <p className="text-red-300">{error}</p>
          <button
            onClick={scan}
            className="mt-3 text-sm text-red-400 hover:text-red-300 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {!scanning && accounts.length > 0 && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                Zero Balance
              </div>
              <div className="text-2xl font-bold text-gray-200 mt-1">
                {stats.zero}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                Dead Tokens
              </div>
              <div className="text-2xl font-bold text-red-400 mt-1">
                {stats.dead}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                Low Value Dust
              </div>
              <div className="text-2xl font-bold text-yellow-400 mt-1">
                {stats.dust}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                Reclaimable SOL
              </div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                ~{stats.totalRent.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Token table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <TokenTable
              accounts={accounts}
              selected={selected}
              onToggle={toggleAccount}
              onSelectAll={selectAll}
            />
          </div>

          {/* Cleanup bar */}
          {selected.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-40">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <span className="text-gray-300 font-medium">
                    {selected.size} account{selected.size !== 1 ? 's' : ''}{' '}
                    selected
                  </span>
                  <span className="text-gray-500 ml-3">
                    Reclaim ~{reclaimableSol.toFixed(4)} SOL
                  </span>
                </div>
                <button
                  onClick={handleCleanup}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors text-lg cursor-pointer"
                >
                  Clean Up — Reclaim {reclaimableSol.toFixed(4)} SOL
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!scanning && !error && accounts.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">&#10024;</div>
          <h3 className="text-xl font-bold text-gray-200">
            Your wallet is clean!
          </h3>
          <p className="text-gray-500 mt-2">
            No token accounts found to clean up.
          </p>
        </div>
      )}

      {/* Cleanup progress modal */}
      {cleanupProgress && (
        <CleanupProgress
          progress={cleanupProgress}
          onClose={handleCleanupClose}
        />
      )}
    </div>
  );
}
