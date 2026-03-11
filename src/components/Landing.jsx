import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Landing() {
  return (
    <div className="landing">
      <img src="/logo.jpg" alt="DustBuster" className="landing-logo" />
      <h1 className="landing-title">DustBuster</h1>
      <p className="landing-tagline">
        The smartest way to reclaim locked SOL from your wallet.
      </p>
      <p className="landing-description">
        Every token you've ever traded leaves behind an account that locks ~0.002 SOL.
        500 dead positions? That's <strong>1+ SOL sitting there doing nothing.</strong>
      </p>
      <p className="landing-description" style={{ marginTop: '8px', opacity: 0.8 }}>
        DustBuster doesn't just close empty accounts — it <strong>scans for dead, rugged, and
        illiquid dust tokens</strong>, burns them, and batch-closes everything in one click.
        No more manual cleanup. No more wasted SOL.
      </p>

      <div className="connect-btn-wrap">
        <WalletMultiButton />
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <div className="feature-label">Smart Scan</div>
          <div className="feature-desc">
            Auto-detects zero balance, dead tokens, and worthless dust — categorized for you
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔥</div>
          <div className="feature-label">Burn & Close</div>
          <div className="feature-desc">
            Burns illiquid tokens AND closes accounts in one batch — not just empty ones
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-label">Bulk Cleanup</div>
          <div className="feature-desc">
            Hundreds of accounts closed in seconds with parallel transactions
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <div className="feature-label">Reclaim SOL</div>
          <div className="feature-desc">
            ~0.002 SOL per account returned to your wallet instantly
          </div>
        </div>
      </div>

      <div className="landing-comparison" style={{ 
        marginTop: '32px', 
        padding: '20px', 
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '500px',
        margin: '32px auto 0',
      }}>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
          🧹 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Why DustBuster?</strong> Most tools only close zero-balance accounts.
          DustBuster also identifies and burns dead/rugged tokens with remaining balances — 
          the ones other tools leave behind.
        </p>
      </div>
    </div>
  );
}
