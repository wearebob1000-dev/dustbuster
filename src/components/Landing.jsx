import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-emoji">🧹</div>
      <h1 className="landing-title">DustBuster</h1>
      <p className="landing-tagline">
        Clean up dead token accounts and reclaim your locked SOL.
      </p>
      <p className="landing-description">
        Each dead token account locks ~0.002 SOL. 200 dead positions = 0.4 SOL wasted.
        DustBuster burns dead tokens and closes accounts to get your SOL back.
      </p>

      <div className="connect-btn-wrap">
        <WalletMultiButton />
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">⚫</div>
          <div className="feature-label">Zero Balance</div>
          <div className="feature-desc">Close empty token accounts</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💀</div>
          <div className="feature-label">Dead Tokens</div>
          <div className="feature-desc">Burn + close rugged tokens</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <div className="feature-label">Reclaim SOL</div>
          <div className="feature-desc">~0.002 SOL per account</div>
        </div>
      </div>
    </div>
  );
}
