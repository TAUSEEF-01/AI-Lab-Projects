import { useMemo } from 'react';

const ALGORITHM_COLORS = {
  BFS: '#f59e0b',
  DFS: '#ef4444',
  Dijkstra: '#3b82f6',
  'A*': '#10b981',
  'Greedy BFS': '#8b5cf6',
  'Bidirectional BFS': '#ec4899',
  'IDA*': '#06b6d4',
};

export default function ComparisonTable({ results, highlightedAlgorithm, setHighlightedAlgorithm }) {
  const bestValues = useMemo(() => {
    if (!results || results.length === 0) return {};

    const validResults = results.filter(r => r.path.length > 0);
    if (validResults.length === 0) return {};

    return {
      nodesVisited: Math.min(...validResults.map(r => r.visitedOrder.length)),
      pathLength: Math.min(...validResults.map(r => r.pathLength || 0)),
      totalCost: Math.min(...validResults.map(r => r.totalCost)),
      timeTaken: Math.min(...validResults.map(r => r.timeTaken)),
    };
  }, [results]);

  if (!results || results.length === 0) {
    return (
      <div className="bg-surface-800/50 rounded-xl border border-surface-700/30 p-6">
        <div className="text-center text-surface-500 text-sm">
          <div className="text-2xl mb-2">📊</div>
          Run algorithms to see comparison results
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-800/50 rounded-xl border border-surface-700/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-700/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
          📊 Algorithm Comparison
        </h3>
        {highlightedAlgorithm && (
          <button
            onClick={() => setHighlightedAlgorithm(null)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-all"
            id="show-all-paths"
          >
            👁 Show All Paths
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-900/50">
              <th className="text-left px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Algorithm</th>
              <th className="text-right px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Nodes Visited</th>
              <th className="text-right px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Path Length</th>
              <th className="text-right px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Total Cost</th>
              <th className="text-right px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Time (ms)</th>
              <th className="text-center px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">Found?</th>
              <th className="text-center px-3 py-2.5 text-surface-400 font-medium uppercase tracking-wider">View</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => {
              const found = result.path.length > 0;
              const color = ALGORITHM_COLORS[result.algorithm] || '#ffffff';

              return (
                <tr
                  key={result.algorithm}
                  onClick={() => {
                    if (found) {
                      setHighlightedAlgorithm(
                        highlightedAlgorithm === result.algorithm ? null : result.algorithm
                      );
                    }
                  }}
                  className={`border-t border-surface-700/20 transition-colors cursor-pointer
                    ${highlightedAlgorithm === result.algorithm
                      ? 'bg-surface-700/40 ring-1 ring-inset'
                      : 'hover:bg-surface-700/20'
                    }`}
                  style={
                    highlightedAlgorithm === result.algorithm
                      ? { '--tw-ring-color': color + '60' }
                      : {}
                  }
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          highlightedAlgorithm === result.algorithm ? 'ring-2 ring-white/50' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                      <span className={`font-medium ${
                        highlightedAlgorithm === result.algorithm ? 'text-white' : 'text-surface-200'
                      }`}>{result.algorithm}</span>
                    </div>
                  </td>
                  <td className={`text-right px-3 py-2.5 font-mono ${
                    found && result.visitedOrder.length === bestValues.nodesVisited
                      ? 'text-accent-emerald font-bold'
                      : 'text-surface-300'
                  }`}>
                    {result.visitedOrder.length.toLocaleString()}
                  </td>
                  <td className={`text-right px-3 py-2.5 font-mono ${
                    found && result.pathLength === bestValues.pathLength
                      ? 'text-accent-emerald font-bold'
                      : 'text-surface-300'
                  }`}>
                    {found ? `${(result.pathLength || 0).toFixed(3)} km` : '—'}
                  </td>
                  <td className={`text-right px-3 py-2.5 font-mono ${
                    found && result.totalCost === bestValues.totalCost
                      ? 'text-accent-emerald font-bold'
                      : 'text-surface-300'
                  }`}>
                    {found ? result.totalCost.toFixed(4) : '—'}
                  </td>
                  <td className={`text-right px-3 py-2.5 font-mono ${
                    found && result.timeTaken === bestValues.timeTaken
                      ? 'text-accent-emerald font-bold'
                      : 'text-surface-300'
                  }`}>
                    {result.timeTaken.toFixed(2)}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    {found ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent-emerald/20 text-accent-emerald text-[10px] font-medium">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent-rose/20 text-accent-rose text-[10px] font-medium">
                        ✗ No
                      </span>
                    )}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    {found && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHighlightedAlgorithm(
                            highlightedAlgorithm === result.algorithm ? null : result.algorithm
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                          highlightedAlgorithm === result.algorithm
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-700 text-surface-400 hover:text-white hover:bg-surface-600'
                        }`}
                      >
                        {highlightedAlgorithm === result.algorithm ? '👁 Viewing' : '👁 View'}
                      </button>
                    )}
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
