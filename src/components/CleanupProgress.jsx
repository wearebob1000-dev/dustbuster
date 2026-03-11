import { RENT_PER_ACCOUNT } from '../utils/solana';

export default function CleanupProgress({ progress, onClose }) {
  const { status, currentBatch, totalBatches, completed, failed, total, results } =
    progress;

  const pct = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;
  // Count actual successes from results (not the buggy completed counter)
  const successBatches = results ? results.filter(r => r.success).length : 0;
  const failBatches = results ? results.filter(r => !r.success).length : 0;
  // Estimate accounts from batch results (each successful result = 1 batch)
  const estimatedClosed = total - (failBatches > 0 ? Math.round(total * failBatches / (successBatches + failBatches)) : 0);
  const actualClosed = successBatches > 0 ? estimatedClosed : completed;
  const reclaimedSol = actualClosed * RENT_PER_ACCOUNT;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Signing state — Fix #2: show clear signing message */}
        {status === 'signing' && (
          <>
            <div className="modal-center">
              <div className="modal-emoji bouncing">✍️</div>
              <h3 className="modal-title">Waiting for signature...</h3>
              <p className="modal-subtitle">
                Please approve the transaction in your wallet.
              </p>
              <p className="modal-subtitle" style={{ opacity: 0.5, fontSize: '0.85rem', marginTop: '8px' }}>
                You may see a security warning — this is normal for new dApps.
              </p>
            </div>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="modal-center">
              <div className="modal-emoji bouncing">🧹</div>
              <h3 className="modal-title">Cleaning up...</h3>
              <p className="modal-subtitle">
                Sending batch {currentBatch} of {totalBatches}
              </p>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Fix #6: Show running tally from results */}
            <p className="progress-text">
              {results ? results.filter(r => r.success).length : 0} of {totalBatches} batches confirmed
            </p>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="modal-center">
              <div className="modal-emoji" style={{ filter: 'drop-shadow(0 0 16px rgba(0, 255, 136, 0.4))' }}>
                {successBatches > 0 ? '✨' : '⚠️'}
              </div>
              <h3 className="modal-title">
                {successBatches > 0 ? 'Cleanup Complete!' : 'Cleanup had issues'}
              </h3>
            </div>

            <div className="modal-results">
              <div className="modal-result-row">
                <span className="modal-result-label">Batches succeeded</span>
                <span className="modal-result-value success">{successBatches}</span>
              </div>
              {failBatches > 0 && (
                <div className="modal-result-row">
                  <span className="modal-result-label">Batches failed</span>
                  <span className="modal-result-value danger">{failBatches}</span>
                </div>
              )}
              <div className="modal-result-row">
                <span className="modal-result-label">SOL reclaimed (est.)</span>
                <span className="modal-result-value success">
                  ~{reclaimedSol.toFixed(4)} SOL
                </span>
              </div>
            </div>

            {/* Fix #7: Only show failed batches, not successful ones */}
            {results && failBatches > 0 && (
              <div className="tx-log">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '8px' }}>
                  Note: "Failed" batches may have actually succeeded on-chain. Check your wallet balance.
                </p>
                {results.filter(r => !r.success).slice(0, 5).map((r, i) => (
                  <div key={i} className="tx-log-entry fail">
                    ✗ {r.error?.slice(0, 80)}
                  </div>
                ))}
                {failBatches > 5 && (
                  <div className="tx-log-entry" style={{ opacity: 0.5 }}>
                    ...and {failBatches - 5} more
                  </div>
                )}
              </div>
            )}

            {successBatches > 0 && failBatches > 0 && (
              <p style={{ color: '#00ff88', fontSize: '0.85rem', textAlign: 'center', margin: '12px 0' }}>
                💡 Some batches reported as "failed" may have confirmed on-chain. Check your wallet!
              </p>
            )}

            {successBatches > 0 && (
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Just recovered ~${reclaimedSol.toFixed(2)} SOL from ${actualClosed} dead and dust token accounts using @DustBusterApp 🧹\n\nReclaim your locked SOL 👇\nhttps://dustbuster.app`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-share-x"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#000',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>
            )}

            <button onClick={onClose} className="btn-done">
              Done — Rescan Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
