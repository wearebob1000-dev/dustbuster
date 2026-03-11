import { RENT_PER_ACCOUNT } from '../utils/solana';

export default function CleanupProgress({ progress, onClose }) {
  const { status, currentBatch, totalBatches, completed, failed, total, results } =
    progress;

  const reclaimedSol = completed * RENT_PER_ACCOUNT;
  const pct = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3 animate-bounce">🧹</div>
              <h3 className="text-xl font-bold text-gray-100">Cleaning up...</h3>
              <p className="text-gray-400 mt-1">
                Batch {currentBatch} of {totalBatches}
              </p>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="text-center text-sm text-gray-400">
              {completed} accounts processed...
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">&#10024;</div>
              <h3 className="text-2xl font-bold text-gray-100">Cleanup Complete!</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Accounts closed</span>
                <span className="text-gray-100 font-medium">{completed}</span>
              </div>
              {failed > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Failed</span>
                  <span className="text-red-400 font-medium">{failed}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">SOL reclaimed</span>
                <span className="text-green-400 font-bold text-lg">
                  ~{reclaimedSol.toFixed(4)} SOL
                </span>
              </div>
            </div>

            {results && results.length > 0 && (
              <div className="mb-6 max-h-32 overflow-y-auto">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`text-xs py-1 ${
                      r.success ? 'text-gray-500' : 'text-red-400'
                    }`}
                  >
                    {r.success ? 'Batch OK' : `Batch failed: ${r.error}`}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
