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

  const walletDisplay = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <div className="scanner">
      {/* Top bar */}
      <div className="scanner-header">
        <div>
          <h2 className="scanner-title">Wallet Scanner</h2>
          <p className="scanner-wallet">{walletDisplay}</p>
        </div>
        <div className="scanner-actions">
          <button
            onClick={scan}
            disabled={scanning}
            className="btn btn-ghost"
          >
            {scanning ? 'Scanning...' : '↻ Rescan'}
          </button>
          <WalletMultiButton />
        </div>
      </div>

      {/* Scanning state */}
      {scanning && (
        <div className="glass-card scan-loading">
          <div className="scan-spinner">🧹</div>
          <p className="scan-text">{scanProgress || 'Scanning...'}</p>
          <p className="scan-subtext">
            This may take a moment for wallets with many tokens
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-box">
          <p className="error-text">{error}</p>
          <button onClick={scan} className="error-retry">
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {!scanning && accounts.length > 0 && (
        <>
          {/* Stats cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Zero Balance</div>
              <div className="stat-value default">{stats.zero}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Dead Tokens</div>
              <div className="stat-value danger">{stats.dead}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Low Value Dust</div>
              <div className="stat-value warning">{stats.dust}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Reclaimable SOL</div>
              <div className="stat-value success">~{stats.totalRent.toFixed(4)}</div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="quick-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                const cleanable = accounts.filter(a => a.category === 'zero' || a.category === 'dead');
                setSelected(new Set(cleanable.map(a => a.address)));
              }}
            >
              🧹 Select All Dead & Zero ({stats.zero + stats.dead} accounts → ~{((stats.zero + stats.dead) * RENT_PER_ACCOUNT).toFixed(4)} SOL)
            </button>
            {stats.dust > 0 && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const all = accounts.filter(a => a.category !== 'valuable');
                  setSelected(new Set(all.map(a => a.address)));
                }}
              >
                Select All Including Dust ({stats.zero + stats.dead + stats.dust} accounts)
              </button>
            )}
          </div>

          {/* Token table */}
          <TokenTable
            accounts={accounts}
            selected={selected}
            onToggle={toggleAccount}
            onSelectAll={selectAll}
          />

          {/* Cleanup bar */}
          {selected.size > 0 && (
            <div className="cleanup-bar">
              <div className="cleanup-bar-inner">
                <div className="cleanup-info">
                  <span className="cleanup-count">
                    {selected.size} account{selected.size !== 1 ? 's' : ''} selected
                  </span>
                  <span className="cleanup-sol">
                    Reclaim ~{reclaimableSol.toFixed(4)} SOL
                  </span>
                </div>
                <button onClick={handleCleanup} className="cleanup-btn">
                  🧹 Clean Up — Reclaim {reclaimableSol.toFixed(4)} SOL
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!scanning && !error && accounts.length === 0 && (
        <div className="glass-card empty-state">
          <div className="empty-icon">✨</div>
          <h3 className="empty-title">Your wallet is clean!</h3>
          <p className="empty-text">No token accounts found to clean up.</p>
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
