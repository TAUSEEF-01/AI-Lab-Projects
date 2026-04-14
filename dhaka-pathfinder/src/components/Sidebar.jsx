import { useState } from 'react';
import { AREAS } from '../utils/osmService';
import { DEFAULT_WEIGHTS, DEFAULT_SETTINGS } from '../utils/heuristic';

const ALGORITHM_LIST = [
  { key: 'BFS', label: 'BFS', desc: 'Breadth-First Search' },
  { key: 'DFS', label: 'DFS', desc: 'Depth-First Search' },
  { key: 'Dijkstra', label: 'Dijkstra', desc: 'Uniform Cost Search' },
  { key: 'A*', label: 'A*', desc: 'A-Star Search' },
  { key: 'Greedy BFS', label: 'Greedy BFS', desc: 'Greedy Best-First' },
  { key: 'Bidirectional BFS', label: 'Bi-BFS', desc: 'Bidirectional BFS' },
  { key: 'IDA*', label: 'IDA*', desc: 'Iterative Deepening A*' },
];

const VEHICLE_TYPES = [
  { value: 'car', label: '🚗 Car', icon: '🚗' },
  { value: 'bike', label: '🏍️ Bike', icon: '🏍️' },
  { value: 'rickshaw', label: '🛺 Rickshaw', icon: '🛺' },
  { value: 'bus', label: '🚌 Bus', icon: '🚌' },
];

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
];

const WEIGHT_LABELS = {
  distance: { label: 'Distance', icon: '📏', desc: 'Base distance weight' },
  traffic: { label: 'Traffic', icon: '🚦', desc: 'Traffic congestion impact' },
  roadType: { label: 'Road Type', icon: '🛣️', desc: 'Road classification weight' },
  vehicle: { label: 'Vehicle', icon: '🚗', desc: 'Vehicle suitability factor' },
  security: { label: 'Security', icon: '🛡️', desc: 'Safety risk factor' },
  timeOfDay: { label: 'Time of Day', icon: '🕐', desc: 'Rush hour impact' },
  occasion: { label: 'Occasion', icon: '🎉', desc: 'Special event impact' },
};

export default function Sidebar({
  weights,
  setWeights,
  settings,
  setSettings,
  selectedAlgorithms,
  setSelectedAlgorithms,
  animationSpeed,
  setAnimationSpeed,
  onRun,
  onReplay,
  hasResults,
  onRunAll,
  onReset,
  isAnimating,
  isLoading,
  startNode,
  endNode,
  selectionMode,
  setSelectionMode,
  selectedArea,
  setSelectedArea,
  onLoadArea,
  darkMode,
  setDarkMode,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState({
    map: true,
    heuristic: true,
    algorithms: true,
    speed: false,
  });

  const toggleSection = (key) => {
    setExpandedSection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleAlgorithmToggle = (key) => {
    setSelectedAlgorithms(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const selectAllAlgorithms = () => {
    setSelectedAlgorithms(ALGORITHM_LIST.map(a => a.key));
  };

  const deselectAllAlgorithms = () => {
    setSelectedAlgorithms([]);
  };

  const canRun = startNode && endNode && selectedAlgorithms.length > 0 && !isAnimating && !isLoading;

  return (
    <div
      className={`fixed lg:relative top-0 right-0 h-full z-[1999] transition-all duration-300 ease-in-out
        ${collapsed ? 'translate-x-full lg:translate-x-0 -mr-80 lg:-mr-96' : 'translate-x-0'}
        w-80 lg:w-96 bg-surface-900/95 backdrop-blur-xl border-l border-surface-700/50
        flex flex-col`}
      id="sidebar"
    >
        {/* Toggle Tab (Desktop & Mobile) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute top-1/2 -translate-y-1/2 -left-6 lg:-left-8 z-[2000] w-6 lg:w-8 h-16 lg:h-20 
            ${darkMode ? 'bg-surface-900/95 border-surface-700/50' : 'bg-white border-gray-200'} 
            border-y border-l rounded-l-xl flex items-center justify-center text-surface-400 hover:text-accent-cyan shadow-[-4px_0_12px_rgba(0,0,0,0.15)] transition-all`}
          id="sidebar-desktop-toggle"
          title={collapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          {collapsed ? (
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-accent-cyan to-accent-violet bg-clip-text text-transparent">
                🗺️ Dhaka Pathfinder
              </h1>
              <p className="text-xs text-surface-400 mt-0.5">AI-powered route analysis on OpenStreetMap</p>
            </div>
            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all border ${
                darkMode
                  ? 'bg-surface-800 border-surface-700/50 text-yellow-400 hover:bg-surface-700'
                  : 'bg-gray-100 border-gray-300 text-indigo-600 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="theme-toggle"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Map Controls */}
          <SectionHeader
            title="Map Controls"
            icon="🗺️"
            expanded={expandedSection.map}
            onToggle={() => toggleSection('map')}
          />
          {expandedSection.map && (
            <div className="px-5 pb-4 space-y-3">
              {/* Area selector */}
              <div>
                <label className="text-xs text-surface-400 uppercase tracking-wider font-medium">Area</label>
                <div className="mt-1.5 flex gap-1.5 flex-wrap">
                  {Object.entries(AREAS).map(([key, area]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedArea(key); onLoadArea(key); }}
                      disabled={isLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                        ${selectedArea === key
                          ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                          : 'bg-surface-800 text-surface-400 border border-surface-700/50 hover:border-surface-600'
                        } disabled:opacity-50`}
                      id={`area-${key}`}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle type */}
              <div>
                <label className="text-xs text-surface-400 uppercase tracking-wider font-medium">Vehicle</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {VEHICLE_TYPES.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setSettings(prev => ({ ...prev, vehicleType: v.value }))}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                        ${settings.vehicleType === v.value
                          ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/40'
                          : 'bg-surface-800 text-surface-400 border border-surface-700/50 hover:border-surface-600'
                        }`}
                      id={`vehicle-${v.value}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of day */}
              <div>
                <label className="text-xs text-surface-400 uppercase tracking-wider font-medium">
                  Time of Day — <span className="text-accent-amber">{formatTime(settings.timeOfDay)}</span>
                  {isRushHour(settings.timeOfDay) && (
                    <span className="ml-1 text-accent-rose animate-pulse">🔴 Rush Hour</span>
                  )}
                </label>
                <input
                  type="range"
                  min={0}
                  max={23}
                  step={1}
                  value={settings.timeOfDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, timeOfDay: parseInt(e.target.value) }))}
                  className="mt-1.5 w-full accent-accent-amber slider-track"
                  id="time-slider"
                />
                <div className="flex justify-between text-[10px] text-surface-500 mt-0.5">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>

              {/* Occasion toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-surface-400 uppercase tracking-wider font-medium">Special Event</label>
                  <p className="text-[10px] text-surface-500">Raises cost in city center</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, occasionActive: !prev.occasionActive }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings.occasionActive ? 'bg-accent-rose' : 'bg-surface-700'
                  }`}
                  id="occasion-toggle"
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    settings.occasionActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Heuristic Weights */}
          <SectionHeader
            title="Heuristic Weights"
            icon="⚙️"
            expanded={expandedSection.heuristic}
            onToggle={() => toggleSection('heuristic')}
          />
          {expandedSection.heuristic && (
            <div className="px-5 pb-4 space-y-2.5">
              {Object.entries(WEIGHT_LABELS).map(([key, info]) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-surface-300 font-medium">
                      {info.icon} {info.label}
                    </label>
                    <span className="text-xs font-mono text-accent-cyan w-8 text-right">
                      {weights[key]?.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    value={weights[key] || 1.0}
                    onChange={(e) => handleWeightChange(key, e.target.value)}
                    className="w-full accent-accent-cyan slider-track mt-0.5"
                    id={`weight-${key}`}
                  />
                </div>
              ))}
              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-[10px] text-surface-500 hover:text-accent-cyan transition-colors underline"
                id="reset-weights"
              >
                Reset to defaults
              </button>
            </div>
          )}

          {/* Algorithm Selector */}
          <SectionHeader
            title="Algorithms"
            icon="🧮"
            expanded={expandedSection.algorithms}
            onToggle={() => toggleSection('algorithms')}
          />
          {expandedSection.algorithms && (
            <div className="px-5 pb-4 space-y-1.5">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={selectAllAlgorithms}
                  className="text-[10px] text-accent-cyan hover:underline"
                  id="select-all-algorithms"
                >
                  Select all
                </button>
                <span className="text-surface-600">|</span>
                <button
                  onClick={deselectAllAlgorithms}
                  className="text-[10px] text-surface-400 hover:underline"
                  id="deselect-all-algorithms"
                >
                  Deselect all
                </button>
              </div>
              {ALGORITHM_LIST.map(alg => (
                <label
                  key={alg.key}
                  className={`relative flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all
                    ${selectedAlgorithms.includes(alg.key)
                      ? 'bg-surface-800/80 border border-surface-600/50'
                      : 'border border-transparent hover:bg-surface-800/40'
                    }`}
                  id={`alg-${alg.key}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.includes(alg.key)}
                    onChange={() => handleAlgorithmToggle(alg.key)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                    ${selectedAlgorithms.includes(alg.key)
                      ? 'bg-accent-violet border-accent-violet'
                      : 'border-surface-600'
                    }`}>
                    {selectedAlgorithms.includes(alg.key) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-surface-200">{alg.label}</span>
                    <span className="text-[10px] text-surface-500 ml-1.5">{alg.desc}</span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: {
                        BFS: '#f59e0b', DFS: '#ef4444', Dijkstra: '#3b82f6',
                        'A*': '#10b981', 'Greedy BFS': '#8b5cf6',
                        'Bidirectional BFS': '#ec4899', 'IDA*': '#06b6d4',
                      }[alg.key],
                    }}
                  />
                </label>
              ))}
            </div>
          )}

          {/* Animation Speed */}
          <SectionHeader
            title="Animation Speed"
            icon="⚡"
            expanded={expandedSection.speed}
            onToggle={() => toggleSection('speed')}
          />
          {expandedSection.speed && (
            <div className="px-5 pb-4">
              <div className="flex gap-1.5">
                {SPEED_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnimationSpeed(opt.value)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all
                      ${animationSpeed === opt.value
                        ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40'
                        : 'bg-surface-800 text-surface-400 border border-surface-700/50 hover:border-surface-600'
                      }`}
                    id={`speed-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons and Selection Steps (fixed at bottom) */}
        <div className="p-4 border-t border-surface-700/50 flex-shrink-0 space-y-3">
          
          {/* Node selection status with steps */}
          <div className="bg-surface-800/50 rounded-lg p-3 border border-surface-700/30 space-y-2">
            <div className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold mb-1">Selection Steps</div>

            {/* Step 1: Start */}
            <div className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
              selectionMode === 'start'
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'border border-transparent'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                startNode ? 'bg-accent-emerald text-white' : selectionMode === 'start' ? 'bg-emerald-500/30 text-emerald-400 animate-pulse' : 'bg-surface-700 text-surface-500'
              }`}>
                {startNode ? '✓' : '1'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-surface-300">
                  {selectionMode === 'start' ? '📍 Select Start Point' : 'Start Point'}
                </div>
                <div className="text-[10px] font-mono truncate">
                  {startNode ? (
                    <span className="text-accent-emerald">#{startNode}</span>
                  ) : (
                    <span className="text-surface-500 italic">Click on the map</span>
                  )}
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex items-center justify-center">
              <div className={`w-px h-3 ${startNode ? 'bg-surface-600' : 'bg-surface-800'}`} />
            </div>

            {/* Step 2: End */}
            <div className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
              selectionMode === 'end'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'border border-transparent'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                endNode ? 'bg-accent-rose text-white' : selectionMode === 'end' ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-surface-700 text-surface-500'
              }`}>
                {endNode ? '✓' : '2'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-surface-300">
                  {selectionMode === 'end' ? '🎯 Select End Point' : 'End Point'}
                </div>
                <div className="text-[10px] font-mono truncate">
                  {endNode ? (
                    <span className="text-accent-rose">#{endNode}</span>
                  ) : (
                    <span className="text-surface-500 italic">{startNode ? 'Click on the map' : 'Set start first'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ready indicator */}
            {selectionMode === 'done' && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-accent-cyan/10 border border-accent-cyan/30">
                <span className="text-accent-cyan text-xs">✅</span>
                <span className="text-[10px] text-accent-cyan font-medium">Ready to run algorithms!</span>
              </div>
            )}
          </div>

          {hasResults && onReplay && !isAnimating && (
            <button
              onClick={onReplay}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all
                bg-accent-violet/20 text-accent-violet border border-accent-violet/30
                hover:bg-accent-violet/30 hover:border-accent-violet/50 hover:scale-[1.02] flex items-center justify-center gap-2"
              id="replay-btn"
            >
              🔄 Replay Simulation Animation
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onRun}
              disabled={!canRun}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                bg-gradient-to-r from-accent-cyan to-accent-blue text-white
                hover:shadow-lg hover:shadow-accent-cyan/25 hover:scale-[1.02]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              id="run-btn"
            >
              {isAnimating ? '⏳ Running...' : '▶ Run Selected'}
            </button>
            <button
              onClick={onRunAll}
              disabled={!startNode || !endNode || isAnimating || isLoading}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                bg-gradient-to-r from-accent-violet to-accent-pink text-white
                hover:shadow-lg hover:shadow-accent-violet/25 hover:scale-[1.02]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              id="run-all-btn"
              title="Run All Algorithms"
            >
              ⚡ All
            </button>
          </div>
          <button
            onClick={onReset}
            disabled={isAnimating}
            className="w-full py-2 rounded-lg text-xs font-medium text-surface-400
              bg-surface-800 border border-surface-700/50 hover:border-surface-600
              hover:text-surface-200 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            id="reset-btn"
          >
            🔄 Reset All
          </button>
        </div>
      </div>
  );
}

function SectionHeader({ title, icon, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider
        text-surface-400 hover:text-surface-200 transition-colors border-t border-surface-700/30"
    >
      <span>{icon}</span>
      <span className="flex-1 text-left">{title}</span>
      <svg
        className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function formatTime(hour) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
}

function isRushHour(hour) {
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
}
