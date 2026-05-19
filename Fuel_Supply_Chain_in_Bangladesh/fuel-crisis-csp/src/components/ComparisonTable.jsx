export default function ComparisonTable({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-pulse transition-colors duration-300">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white font-sans tracking-wide transition-colors duration-300">Performance Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm transition-colors duration-300">
            Select one or more CSP search algorithms from the control deck and run the simulation to compare performance metrics.
          </p>
        </div>
      </div>
    );
  }

  // Helper calculations for summary statistics
  const fastest = results.reduce((min, r) => r.timeTaken < min.timeTaken ? r : min);
  const fewestBacktracks = results.reduce((min, r) => r.backtracks < min.backtracks ? r : min);
  const validCostResults = results.filter(r => r.totalCost !== undefined && r.totalCost !== null);
  const bestCost = validCostResults.length > 0 
    ? validCostResults.reduce((min, r) => r.totalCost < min.totalCost ? r : min) 
    : null;

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/5 gap-4 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors duration-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
              Algorithm Metrics Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Real-time solver performance data and cost efficiency analysis</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-md self-start sm:self-auto shadow-sm transition-colors duration-300">
            <span>RUN IDENTIFIER:</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">#{Math.floor(results.reduce((acc, r) => acc + r.timeTaken, 0) * 100) % 99999}</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full rounded-xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md transition-colors duration-300">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300 border-collapse transition-colors duration-300">
            <thead>
              <tr className="text-xs uppercase bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-mono tracking-wider transition-colors duration-300">
                <th className="px-5 py-4 font-semibold">Algorithm</th>
                <th className="px-5 py-4 font-semibold text-center">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Assignments</th>
                <th className="px-5 py-4 font-semibold text-right">Backtracks</th>
                <th className="px-5 py-4 font-semibold text-right">Constraint Checks</th>
                <th className="px-5 py-4 font-semibold text-right">Execution Time</th>
                <th className="px-5 py-4 font-semibold text-right">Solution Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-sans transition-colors duration-300">
              {results.map((result, index) => (
                <tr 
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200 font-mono tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {result.algorithmName}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {result.solutionFound ? (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-[0_0_10px_rgba(16,185,129,0.06)] flex items-center gap-1.5 transition-colors duration-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                          SOLVED
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-[0_0_10px_rgba(244,63,94,0.06)] flex items-center gap-1.5 transition-colors duration-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                          FAILED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors">
                    {result.assignment ? Object.keys(result.assignment).length : 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium">
                    {result.backtracks === 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm transition-colors">0</span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 transition-colors">{result.backtracks.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors">
                    {result.constraintChecks.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium">
                    <span className="text-indigo-700 dark:text-indigo-400 font-semibold transition-colors">{result.timeTaken.toFixed(2)}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1 transition-colors">ms</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold">
                    {result.totalCost ? (
                      <span className="text-emerald-700 dark:text-emerald-400 transition-colors">
                        ৳{result.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 transition-colors">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Performance Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fastest Card */}
          <div className="glass-panel p-5 rounded-xl border border-cyan-500/10 dark:border-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.03)] dark:shadow-[0_0_20px_rgba(6,182,212,0.05)] relative overflow-hidden group transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-600 dark:via-cyan-500 to-transparent opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 tracking-widest uppercase font-mono bg-cyan-500/10 border border-cyan-600/20 px-2 py-0.5 rounded transition-colors duration-300">
                  Fastest Execution
                </span>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-3 mb-1 font-mono tracking-tight line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors duration-300">
                  {fastest.algorithmName}
                </h4>
                <div className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400 tracking-tight flex items-baseline transition-colors duration-300">
                  {fastest.timeTaken.toFixed(2)}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1 transition-colors duration-300">ms</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Fewest Backtracks Card */}
          <div className="glass-panel p-5 rounded-xl border border-amber-500/10 dark:border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.03)] dark:shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden group transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-600 dark:via-amber-500 to-transparent opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-widest uppercase font-mono bg-amber-500/10 border border-amber-600/20 px-2 py-0.5 rounded transition-colors duration-300">
                  Search Efficiency
                </span>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-3 mb-1 font-mono tracking-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-300">
                  {fewestBacktracks.algorithmName}
                </h4>
                <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 tracking-tight flex items-baseline transition-colors duration-300">
                  {fewestBacktracks.backtracks.toLocaleString()}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1 transition-colors duration-300">backtracks</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                </svg>
              </div>
            </div>
          </div>

          {/* Best Solution Cost Card */}
          {bestCost ? (
            <div className="glass-panel p-5 rounded-xl border border-emerald-500/10 dark:border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.03)] dark:shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-600 dark:via-emerald-500 to-transparent opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-widest uppercase font-mono bg-emerald-500/10 border border-emerald-600/20 px-2 py-0.5 rounded transition-colors duration-300">
                    Economic Optimal
                  </span>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-3 mb-1 font-mono tracking-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors duration-300">
                    {bestCost.algorithmName}
                  </h4>
                  <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight flex items-baseline transition-colors duration-300">
                    ৳{bestCost.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-500/10 relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent opacity-40" />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase font-mono bg-slate-100 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 px-2 py-0.5 rounded transition-colors duration-300">
                    Economic Optimal
                  </span>
                  <h4 className="text-lg font-bold text-slate-500 dark:text-slate-400 mt-3 mb-1 font-mono tracking-tight transition-colors">
                    No Solution Cost
                  </h4>
                  <div className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500 tracking-tight transition-colors">
                    N/A
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 flex items-center justify-center opacity-50 transition-all duration-300">
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
