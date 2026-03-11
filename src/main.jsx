import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { Buffer } from 'buffer';
import App from './App.jsx';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Polyfill Buffer for browser
window.Buffer = Buffer;

// Free public RPCs as fallbacks - QuickNode via env var if available
const RPC_ENDPOINT = import.meta.env.VITE_RPC_URL || 'https://solana-rpc.publicnode.com';

function Root() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
