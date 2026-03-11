const CATEGORY_STYLES = {
  zero: { icon: '⚫', badgeClass: 'badge-zero', label: 'Zero Balance' },
  dead: { icon: '💀', badgeClass: 'badge-dead', label: 'Dead' },
  dust: { icon: '🟡', badgeClass: 'badge-dust', label: 'Dust' },
  valuable: { icon: '✅', badgeClass: 'badge-valuable', label: 'Has Value' },
};

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
    <div className="table-wrapper">
      <div className="table-actions">
        <button
          onClick={() => onSelectAll(deadAccounts)}
          className={`btn btn-select ${allDeadSelected ? 'active' : 'btn-ghost'}`}
        >
          {allDeadSelected ? '✓ ' : ''}Select All Dead ({deadAccounts.length})
        </button>
        <button
          onClick={() => onSelectAll(cleanable)}
          className={`btn btn-select ${allCleanableSelected ? 'active' : 'btn-ghost'}`}
        >
          {allCleanableSelected ? '✓ ' : ''}Select All Cleanable ({cleanable.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="token-table">
          <thead>
            <tr>
              <th style={{ width: 44 }} />
              <th>Status</th>
              <th>Token</th>
              <th>Mint</th>
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
                  className={isSelected ? 'selected' : ''}
                >
                  <td>
                    {isCleanable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(acct.address)}
                        className="checkbox"
                      />
                    )}
                  </td>
                  <td>
                    <span className={`badge ${style.badgeClass}`}>
                      {style.icon} {acct.categoryLabel || style.label}
                    </span>
                  </td>
                  <td>
                    {acct.tokenSymbol ? (
                      <span>
                        <strong style={{ color: '#fff' }}>{acct.tokenSymbol}</strong>
                        {acct.tokenName && (
                          <span style={{ opacity: 0.5, fontSize: '0.8rem', marginLeft: '6px' }}>{acct.tokenName}</span>
                        )}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Unknown</span>
                    )}
                  </td>
                  <td className="td-mono">
                    <a
                      href={`https://solscan.io/token/${acct.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {truncateMint(acct.mint)}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
