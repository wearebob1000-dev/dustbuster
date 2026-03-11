import { useWallet } from '@solana/wallet-adapter-react';
import Landing from './components/Landing';
import Scanner from './components/Scanner';

function App() {
  const { connected } = useWallet();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <img src="/logo.jpg" alt="" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span className="header-title">DustBuster</span>
          </div>
          {connected && (
            <div className="header-status">
              <div className="header-status-dot" />
              <span>Connected</span>
            </div>
          )}
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '0 20px' }}>
        {connected ? <Scanner /> : <Landing />}
      </main>

      <footer className="footer">
        <p className="footer-text">
          Built by <span className="footer-brand">WEARE Inc</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
