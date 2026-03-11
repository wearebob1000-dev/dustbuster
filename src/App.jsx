import { useWallet } from '@solana/wallet-adapter-react';
import Landing from './components/Landing';
import Scanner from './components/Scanner';

function App() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            <h1 className="text-xl font-bold text-gray-100">
              Dust<span className="text-purple-400">Buster</span>
            </h1>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm text-gray-400">Connected</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {connected ? <Scanner /> : <Landing />}
      </main>

      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-gray-600 text-sm">
          DustBuster — Reclaim your locked SOL
        </div>
      </footer>
    </div>
  );
}

export default App;
