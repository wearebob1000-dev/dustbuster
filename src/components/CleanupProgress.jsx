import { RENT_PER_ACCOUNT } from '../utils/solana';

export default function CleanupProgress({ progress, onClose }) {
  const { status, currentBatch, totalBatches, completed, failed, results } =
    progress;

  const reclaimedSol = completed * RENT_PER_ACCOUNT;
  const pct = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {status === 'processing' && (
          <>
            <div className="modal-center">
              <div className="modal-emoji bouncing">🧹</div>
              <h3 className="modal-title">Cleaning up...</h3>
              <p className="modal-subtitle">
                Batch {currentBatch} of {totalBatches}
              </p>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="progress-text">
              {completed} accounts processed...
            </p>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="modal-center">
              <div className="modal-emoji" style={{ filter: 'drop-shadow(0 0 16px rgba(0, 255, 136, 0.4))' }}>✨</div>
              <h3 className="modal-title">Cleanup Complete!</h3>
            </div>

            <div className="modal-results">
              <div className="modal-result-row">
                <span className="modal-result-label">Accounts closed</span>
                <span className="modal-result-value">{completed}</span>
              </div>
              {failed > 0 && (
                <div className="modal-result-row">
                  <span className="modal-result-label">Failed</span>
                  <span className="modal-result-value danger">{failed}</span>
                </div>
              )}
              <div className="modal-result-row">
                <span className="modal-result-label">SOL reclaimed</span>
                <span className="modal-result-value success">
                  ~{reclaimedSol.toFixed(4)} SOL
                </span>
              </div>
            </div>

            {results && results.length > 0 && (
              <div className="tx-log">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`tx-log-entry ${r.success ? 'success' : 'fail'}`}
                  >
                    {r.success ? '✓ Batch OK' : `✗ Batch failed: ${r.error}`}
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose} className="btn-done">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
