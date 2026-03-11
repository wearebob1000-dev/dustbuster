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

            <button onClick={onClose} className="btn-done">
              Done — Rescan Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
