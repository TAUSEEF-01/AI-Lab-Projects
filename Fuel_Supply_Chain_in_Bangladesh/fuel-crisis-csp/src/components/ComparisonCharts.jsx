import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function ComparisonCharts({ results, theme }) {
  const isDark = theme === 'dark';
  
  if (!results || results.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-pulse transition-colors duration-300">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white font-sans tracking-wide transition-colors duration-300">Performance Visualization</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm transition-colors duration-300">
            Launch the active search algorithms from the control deck to plot multidimensional execution times, constraint search paths, and supply cost efficiency.
          </p>
        </div>
      </div>
    );
  }
  
  const labels = results.map(r => r.algorithmName);
  
  // Curated modern color themes for chart series mapping
  const colors = [
    { border: 'rgba(99, 102, 241, 1)', bg: 'rgba(99, 102, 241, 0.15)' },  // Indigo
    { border: 'rgba(6, 182, 212, 1)', bg: 'rgba(6, 182, 212, 0.15)' },   // Cyan
    { border: 'rgba(16, 185, 129, 1)', bg: 'rgba(16, 185, 129, 0.15)' }, // Emerald
    { border: 'rgba(245, 158, 11, 1)', bg: 'rgba(245, 158, 11, 0.15)' },  // Amber
    { border: 'rgba(239, 68, 68, 1)', bg: 'rgba(239, 68, 68, 0.15)' },    // Rose
    { border: 'rgba(168, 85, 247, 1)', bg: 'rgba(168, 85, 247, 0.15)' },  // Purple
    { border: 'rgba(236, 72, 153, 1)', bg: 'rgba(236, 72, 153, 0.15)' },  // Pink
  ];

  // Backtracks chart data (Rose Theme)
  const backtrackData = {
    labels,
    datasets: [{
      label: 'Backtracks',
      data: results.map(r => r.backtracks),
      backgroundColor: 'rgba(244, 63, 94, 0.18)',
      borderColor: 'rgba(244, 63, 94, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(244, 63, 94, 0.38)',
      barPercentage: 0.55
    }]
  };
  
  // Execution time chart data (Indigo Theme)
  const timeData = {
    labels,
    datasets: [{
      label: 'Time (ms)',
      data: results.map(r => r.timeTaken),
      backgroundColor: 'rgba(99, 102, 241, 0.18)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(99, 102, 241, 0.38)',
      barPercentage: 0.55
    }]
  };
  
  // Total cost chart data (Emerald Theme)
  const costData = {
    labels,
    datasets: [{
      label: 'Total Cost',
      data: results.map(r => r.totalCost || 0),
      backgroundColor: 'rgba(16, 185, 129, 0.18)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(16, 185, 129, 0.38)',
      barPercentage: 0.55
    }]
  };
  
  // Normalize values for radar chart (0-100 scale)
  const normalize = (value, max) => max > 0 ? (value / max) * 100 : 0;
  
  const maxTime = Math.max(...results.map(r => r.timeTaken));
  const maxBacktracks = Math.max(...results.map(r => r.backtracks));
  const maxChecks = Math.max(...results.map(r => r.constraintChecks));
  const maxCost = Math.max(...results.filter(r => r.totalCost).map(r => r.totalCost));
  
  // Radar chart data (inverted so lower is better)
  const radarData = {
    labels: ['Speed', 'Efficiency (Backtracks)', 'Constraint Checks', 'Solution Quality'],
    datasets: results.map((result, index) => {
      const color = colors[index % colors.length];
      return {
        label: result.algorithmName,
        data: [
          100 - normalize(result.timeTaken, maxTime), // Inverted
          100 - normalize(result.backtracks, maxBacktracks), // Inverted
          100 - normalize(result.constraintChecks, maxChecks), // Inverted
          100 - normalize(result.totalCost || 0, maxCost) // Inverted
        ],
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        pointBackgroundColor: color.border,
        pointBorderColor: isDark ? '#fff' : '#1f2937',
        pointHoverBackgroundColor: isDark ? '#fff' : '#1f2937',
        pointHoverBorderColor: color.border,
        pointRadius: 3
      };
    })
  };

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
  const gridColorSubtle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)';
  const ticksColor = isDark ? '#94a3b8' : '#475569';
  const legendTextColor = isDark ? '#cbd5e1' : '#334155';
  const radarAngleLinesColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const radarGridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const tooltipTextColor = isDark ? '#f1f5f9' : '#0f172a';
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTextColor,
        bodyColor: tooltipTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleFont: {
          family: 'Space Grotesk',
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Plus Jakarta Sans',
          size: 11
        },
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        ticks: { 
          color: ticksColor,
          font: {
            family: 'Space Grotesk',
            size: 10
          }
        },
        grid: { 
          color: gridColorSubtle,
          drawBorder: false
        }
      },
      y: {
        ticks: { 
          color: ticksColor,
          font: {
            family: 'Space Grotesk',
            size: 10
          }
        },
        grid: { 
          color: gridColor,
          drawBorder: false
        }
      }
    }
  };
  
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: legendTextColor,
          font: {
            family: 'Space Grotesk',
            size: 10,
            weight: 'semibold'
          },
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTextColor,
        bodyColor: tooltipTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleFont: {
          family: 'Space Grotesk',
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Plus Jakarta Sans',
          size: 11
        },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      r: {
        angleLines: {
          color: radarAngleLinesColor
        },
        grid: {
          color: radarGridColor
        },
        pointLabels: {
          color: ticksColor,
          font: {
            family: 'Space Grotesk',
            size: 10.5,
            weight: 'bold'
          }
        },
        ticks: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(71, 85, 105, 0.4)',
          backdropColor: 'transparent',
          font: {
            family: 'Space Grotesk',
            size: 9
          }
        }
      }
    }
  };
  
  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.01] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/5 gap-4 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors duration-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
              Performance & Efficiency Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Multi-dimensional search trajectory and scaling comparisons</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backtracks Chart */}
          <div className="glass-panel p-5 rounded-xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
            <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2 transition-colors duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              Backtracks per Algorithm
            </h3>
            <div className="h-64 relative">
              <Bar data={backtrackData} options={chartOptions} />
            </div>
          </div>
          
          {/* Execution Time Chart */}
          <div className="glass-panel p-5 rounded-xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
            <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2 transition-colors duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
              Execution Time (ms)
            </h3>
            <div className="h-64 relative">
              <Bar data={timeData} options={chartOptions} />
            </div>
          </div>
          
          {/* Total Cost Chart */}
          <div className="glass-panel p-5 rounded-xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
            <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2 transition-colors duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              Total Transport Cost (৳)
            </h3>
            <div className="h-64 relative">
              <Bar data={costData} options={chartOptions} />
            </div>
          </div>
          
          {/* Radar Chart */}
          <div className="glass-panel p-5 rounded-xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
            <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2 transition-colors duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              Overall Performance (Normalized)
            </h3>
            <div className="h-64 relative">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 mt-6 bg-slate-100/50 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 p-3.5 rounded-xl transition-all duration-300">
          <svg className="w-4 h-4 text-indigo-550 dark:text-indigo-400 flex-shrink-0 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            * The Radar analysis shows normalized indices where lower raw values are mapped to higher performance scores (100 is optimal/best). This permits a clean comparison of speed, exploration backtrack penalty, validation checks density, and supply chain routing cost quality.
          </span>
        </div>
      </div>
    </div>
  );
}
