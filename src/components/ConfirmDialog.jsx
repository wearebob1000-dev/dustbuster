import { RENT_PER_ACCOUNT, FEE_PCT } from '../utils/solana';

export default function ConfirmDialog({ accounts, onConfirm, onCancel }) {
  const dustTokens = accounts.filter(a => a.category === 'dust');
  const deadTokens = accounts.filter(a => a.category === 'dead');
  const zeroTokens = accounts.filter(a => a.category === 'zero');
  const reclaimable = accounts.length * RENT_PER_ACCOUNT;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '500px' }}>
        <div className="modal-center">
          <div className="modal-emoji">⚠️</div>
          <h3 className="modal-title">Confirm Cleanup</h3>
          <p className="modal-subtitle" style={{ color: 'rgba(255,150,150,0.9)' }}>
            This action is <strong>irreversible</strong>. Selected tokens will be permanently burned.
          </p>
        </div>

        <div className="modal-results" style={{ marginTop: '16px' }}>
          {zeroTokens.length > 0 && (
            <div className="modal-result-row">
              <span className="modal-result-label">⚫ Zero balance accounts</span>
              <span className="modal-result-value">{zeroTokens.length}</span>
            </div>
          )}
          {deadTokens.length > 0 && (
            <div className="modal-result-row">
              <span className="modal-result-label">💀 Dead tokens (no liquidity)</span>
              <span className="modal-result-value">{deadTokens.length}</span>
            </div>
          )}
          {dustTokens.length > 0 && (
            <div className="modal-result-row" style={{ background: 'rgba(255,200,0,0.05)', borderRadius: '8px', padding: '8px' }}>
              <span className="modal-result-label">🟡 Dust tokens (have liquidity!)</span>
              <span className="modal-result-value warning">{dustTokens.length}</span>
            </div>
          )}
          <div className="modal-result-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}>
            <span className="modal-result-label">SOL to reclaim</span>
            <span className="modal-result-value success">~{reclaimable.toFixed(4)}</span>
          </div>
          <div className="modal-result-row">
            <span className="modal-result-label">Fee ({FEE_PCT * 100}%)</span>
            <span className="modal-result-value">{(reclaimable * FEE_PCT).toFixed(4)}</span>
          </div>
          <div className="modal-result-row">
            <span className="modal-result-label"><strong>You receive</strong></span>
            <span className="modal-result-value success"><strong>{(reclaimable * (1 - FEE_PCT)).toFixed(4)} SOL</strong></span>
          </div>
        </div>

        {dustTokens.length > 0 && (
          <div style={{
            margin: '16px 0',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(255,200,0,0.05)',
            border: '1px solid rgba(255,200,0,0.2)',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,200,100,0.9)', margin: '0 0 8px' }}>
              <strong>⚠️ Dust tokens with liquidity:</strong>
            </p>
            {dustTokens.slice(0, 10).map(t => (
              <p key={t.address} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '2px 0' }}>
                {t.tokenSymbol || t.mint.slice(0,8) + '...'} — ${t.valueUsd.toFixed(4)} value, ${t.liquidity.toLocaleString()} liquidity
              </p>
            ))}
            {dustTokens.length > 10 && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                ...and {dustTokens.length - 10} more
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ flex: 1, padding: '14px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            🔥 Burn & Close
          </button>
        </div>
      </div>
    </div>
  );
}
