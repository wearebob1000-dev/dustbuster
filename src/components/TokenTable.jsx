const CATEGORY_STYLES = {
  zero: { icon: '\u26AB', color: 'text-gray-400', bg: 'bg-gray-800' },
  dead: { icon: '\uD83D\uDD34', color: 'text-red-400', bg: 'bg-red-950' },
  dust: { icon: '\uD83D\uDFE1', color: 'text-yellow-400', bg: 'bg-yellow-950' },
  valuable: { icon: '\uD83D\uDFE2', color: 'text-green-400', bg: 'bg-green-950' },
};

function formatBalance(balance) {
  if (balance === 0) return '0';
  if (balance < 0.001) return '<0.001';
  if (balance < 1) return balance.toFixed(4);
  if (balance < 1000) return balance.toFixed(2);
  if (balance < 1_000_000) return (balance / 1000).toFixed(1) + 'K';
  return (balance / 1_000_000).toFixed(1) + 'M';
}

function truncateMint(mint) {
  return mint.slice(0, 4) + '...' + mint.slice(-4);
}

export default function TokenTable({ accounts, selected, onToggle, onSelectAll }) {
  const cleanable = accounts.filter((a) => a.category !== 'valuable');
  const deadAccounts = accounts.filter(
    (a) => a.category === 'zero' || a.category === 'dead'
  );

  const allCleanableSelected = cleanable.length > 0 && cleanable.every((a) => selected.has(a.address));
  const allDeadSelected = deadAccounts.length > 0 && deadAccounts.every((a) => selected.has(a.address));

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          onClick={() => onSelectAll(deadAccounts)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            allDeadSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {allDeadSelected ? 'Deselect' : 'Select'} All Dead ({deadAccounts.length})
        </button>
        <button
          onClick={() => onSelectAll(cleanable)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            allCleanableSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {allCleanableSelected ? 'Deselect' : 'Select'} All Cleanable ({cleanable.length})
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left border-b border-gray-800">
            <th className="pb-3 pl-4 w-10" />
            <th className="pb-3">Status</th>
            <th className="pb-3">Token Mint</th>
            <th className="pb-3 text-right">Balance</th>
            <th className="pb-3 text-right">Value</th>
            <th className="pb-3 text-right">Liquidity</th>
            <th className="pb-3 text-right">Rent Locked</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acct) => {
            const style = CATEGORY_STYLES[acct.category];
            const isSelected = selected.has(acct.address);
            const isCleanable = acct.category !== 'valuable';

            return (
              <tr
                key={acct.address}
                className={`border-b border-gray-800/50 transition-colors ${
                  isSelected ? 'bg-purple-950/30' : 'hover:bg-gray-900'
                }`}
              >
                <td className="py-3 pl-4">
                  {isCleanable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(acct.address)}
                      className="w-4 h-4 accent-purple-500 cursor-pointer"
                    />
                  )}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.color}`}
                  >
                    {style.icon} {acct.categoryLabel}
                  </span>
                </td>
                <td className="py-3 font-mono text-gray-300">
                  <a
                    href={`https://solscan.io/token/${acct.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-400 transition-colors"
                  >
                    {truncateMint(acct.mint)}
                  </a>
                </td>
                <td className="py-3 text-right text-gray-300 font-mono">
                  {formatBalance(acct.balance)}
                </td>
                <td className="py-3 text-right text-gray-400">
                  {acct.valueUsd > 0 ? `$${acct.valueUsd.toFixed(4)}` : '-'}
                </td>
                <td className="py-3 text-right text-gray-400">
                  {acct.hasLiquidity
                    ? `$${acct.liquidity.toLocaleString()}`
                    : '-'}
                </td>
                <td className="py-3 text-right text-gray-400">
                  {acct.rentSol.toFixed(4)} SOL
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
