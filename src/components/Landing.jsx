import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="text-7xl mb-6">🧹</div>
      <h2 className="text-4xl font-bold text-gray-100 mb-3">
        Dust<span className="text-purple-400">Buster</span>
      </h2>
      <p className="text-xl text-gray-400 mb-2 max-w-lg">
        Clean up dead token accounts and reclaim your locked SOL rent.
      </p>
      <p className="text-gray-500 mb-8 max-w-md">
        Each dead token account locks ~0.002 SOL. 200 dead positions = 0.4 SOL wasted.
        DustBuster burns dead tokens and closes accounts to get your SOL back.
      </p>

      <WalletMultiButton />

      <div className="mt-12 grid grid-cols-3 gap-8 text-center max-w-xl">
        <div>
          <div className="text-3xl mb-2">&#11035;</div>
          <div className="text-sm font-medium text-gray-300">Zero Balance</div>
          <div className="text-xs text-gray-500 mt-1">Close empty accounts</div>
        </div>
        <div>
          <div className="text-3xl mb-2">&#128308;</div>
          <div className="text-sm font-medium text-gray-300">Dead Tokens</div>
          <div className="text-xs text-gray-500 mt-1">Burn + close rugged tokens</div>
        </div>
        <div>
          <div className="text-3xl mb-2">&#128994;</div>
          <div className="text-sm font-medium text-gray-300">Reclaim SOL</div>
          <div className="text-xs text-gray-500 mt-1">~0.002 SOL per account</div>
        </div>
      </div>
    </div>
  );
}
