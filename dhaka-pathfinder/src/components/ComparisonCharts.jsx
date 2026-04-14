import { useMemo } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const ALGORITHM_COLORS = {
  BFS: '#f59e0b',
  DFS: '#ef4444',
  Dijkstra: '#3b82f6',
  'A*': '#10b981',
  'Greedy BFS': '#8b5cf6',
  'Bidirectional BFS': '#ec4899',
  'IDA*': '#06b6d4',
};

const CHART_TEXT_COLOR = '#94a3b8';
const CHART_GRID_COLOR = '#1e293b';

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: CHART_TEXT_COLOR, font: { size: 10 } },
      grid: { color: CHART_GRID_COLOR },
    },
    y: {
      ticks: { color: CHART_TEXT_COLOR, font: { size: 10 } },
      grid: { color: CHART_GRID_COLOR },
    },
  },
};

export default function ComparisonCharts({ results }) {
  const chartData = useMemo(() => {
    if (!results || results.length === 0) return null;

    const labels = results.map(r => r.algorithm);
    const colors = results.map(r => ALGORITHM_COLORS[r.algorithm] || '#ffffff');
    const bgColors = colors.map(c => c + '80');

    // Bar: Nodes Visited
    const nodesData = {
      labels,
      datasets: [{
        label: 'Nodes Visited',
        data: results.map(r => r.visitedOrder.length),
        backgroundColor: bgColors,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    };

    // Bar: Total Cost
    const costData = {
      labels,
      datasets: [{
        label: 'Total Cost',
        data: results.map(r => r.path.length > 0 ? r.totalCost : 0),
        backgroundColor: bgColors,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    };

    // Bar: Execution Time
    const timeData = {
      labels,
      datasets: [{
        label: 'Time (ms)',
        data: results.map(r => r.timeTaken),
        backgroundColor: bgColors,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    };

    // Radar: Normalized performance
    // Normalize each metric to 0-1 (lower is better, so invert)
    const validResults = results.filter(r => r.path.length > 0);
    const maxNodes = Math.max(...validResults.map(r => r.visitedOrder.length), 1);
    const maxCost = Math.max(...validResults.map(r => r.totalCost), 0.001);
    const maxTime = Math.max(...validResults.map(r => r.timeTaken), 0.001);
    const maxLength = Math.max(...validResults.map(r => r.pathLength || 0), 0.001);

    const radarData = {
      labels: ['Speed', 'Efficiency', 'Cost', 'Directness'],
      datasets: results.map(r => {
        const found = r.path.length > 0;
        return {
          label: r.algorithm,
          data: found ? [
            1 - (r.timeTaken / maxTime),                    // Speed (inverted)
            1 - (r.visitedOrder.length / maxNodes),         // Efficiency (inverted)
            1 - (r.totalCost / maxCost),                    // Cost (inverted)
            1 - ((r.pathLength || 0) / maxLength),          // Directness (inverted)
          ] : [0, 0, 0, 0],
          backgroundColor: ALGORITHM_COLORS[r.algorithm] + '30',
          borderColor: ALGORITHM_COLORS[r.algorithm],
          borderWidth: 2,
          pointBackgroundColor: ALGORITHM_COLORS[r.algorithm],
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 3,
        };
      }),
    };

    return { nodesData, costData, timeData, radarData };
  }, [results]);

  if (!chartData) {
    return (
      <div className="bg-surface-800/50 rounded-xl border border-surface-700/30 p-6">
        <div className="text-center text-surface-500 text-sm">
          <div className="text-2xl mb-2">📈</div>
          Charts appear here after running algorithms
        </div>
      </div>
    );
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: CHART_TEXT_COLOR,
          font: { size: 10 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        angleLines: { color: CHART_GRID_COLOR },
        grid: { color: CHART_GRID_COLOR },
        pointLabels: { color: CHART_TEXT_COLOR, font: { size: 10 } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 1,
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Bar Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Nodes Visited">
          <Bar data={chartData.nodesData} options={{
            ...commonOptions,
            plugins: { ...commonOptions.plugins, title: { display: false } },
          }} />
        </ChartCard>
        <ChartCard title="Total Cost">
          <Bar data={chartData.costData} options={{
            ...commonOptions,
            plugins: { ...commonOptions.plugins, title: { display: false } },
          }} />
        </ChartCard>
        <ChartCard title="Execution Time (ms)">
          <Bar data={chartData.timeData} options={{
            ...commonOptions,
            plugins: { ...commonOptions.plugins, title: { display: false } },
          }} />
        </ChartCard>
      </div>

      {/* Radar Chart */}
      <ChartCard title="Overall Performance (Normalized)" tall>
        <Radar data={chartData.radarData} options={radarOptions} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, tall }) {
  return (
    <div className="bg-surface-800/50 rounded-xl border border-surface-700/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-surface-700/30">
        <h4 className="text-xs font-semibold text-surface-300">{title}</h4>
      </div>
      <div className={`p-3 ${tall ? 'h-72' : 'h-48'}`}>
        {children}
      </div>
    </div>
  );
}
