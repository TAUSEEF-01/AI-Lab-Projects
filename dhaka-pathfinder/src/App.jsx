import { useState, useCallback, useRef, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ComparisonTable from './components/ComparisonTable';
import ComparisonCharts from './components/ComparisonCharts';

import { fetchOSMData, AREAS } from './utils/osmService';
import { buildGraph } from './utils/graphBuilder';
import { createCostFunction, DEFAULT_WEIGHTS, DEFAULT_SETTINGS } from './utils/heuristic';
import { haversine } from './utils/haversine';

// Import algorithms
import { runAlgorithm as runBFS } from './algorithms/bfs';
import { runAlgorithm as runDFS } from './algorithms/dfs';
import { runAlgorithm as runDijkstra } from './algorithms/dijkstra';
import { runAlgorithm as runAStar } from './algorithms/astar';
import { runAlgorithm as runGreedyBFS } from './algorithms/greedyBFS';
import { runAlgorithm as runBidirectionalBFS } from './algorithms/bidirectionalBFS';
import { runAlgorithm as runIDAStar } from './algorithms/idaStar';

const ALGORITHM_MAP = {
  BFS: runBFS,
  DFS: runDFS,
  Dijkstra: runDijkstra,
  'A*': runAStar,
  'Greedy BFS': runGreedyBFS,
  'Bidirectional BFS': runBidirectionalBFS,
  'IDA*': runIDAStar,
};

const ALL_ALGORITHMS = Object.keys(ALGORITHM_MAP);

export default function App() {
  // Graph state
  const [graph, setGraph] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('dhanmondi');

  // Node selection with explicit mode
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [selectionMode, setSelectionMode] = useState('start'); // 'start' | 'end' | 'done'
  const [pendingNode, setPendingNode] = useState(null); // node awaiting confirmation

  // Heuristic settings
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });

  // Algorithm selection
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(['BFS', 'Dijkstra', 'A*']);

  // Animation
  const [animationSpeed, setAnimationSpeed] = useState('medium');
  const [isAnimating, setIsAnimating] = useState(false);

  // Results
  const [results, setResults] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Highlighted algorithm for isolated path view (null = show all)
  const [highlightedAlgorithm, setHighlightedAlgorithm] = useState(null);

  // Dark/Light mode
  const [darkMode, setDarkMode] = useState(true);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load area graph
  const handleLoadArea = useCallback(async (areaKey) => {
    setIsLoading(true);
    setGraph(null);
    setResults([]);
    setStartNode(null);
    setEndNode(null);
    setPendingNode(null);
    setSelectionMode('start');
    setShowDashboard(false);
    setHighlightedAlgorithm(null);

    try {
      toast.info(`Loading ${AREAS[areaKey].name} map data...`, { autoClose: 2000 });
      const osmData = await fetchOSMData(areaKey);
      const builtGraph = buildGraph(osmData);

      if (builtGraph.nodes.size === 0) {
        toast.error('No graph data found for this area. Try another area.');
        setIsLoading(false);
        return;
      }

      setGraph(builtGraph);
      toast.success(`Loaded ${builtGraph.nodes.size.toLocaleString()} nodes, ${builtGraph.edges.length.toLocaleString()} edges`, { autoClose: 3000 });
    } catch (err) {
      console.error('Failed to load area:', err);
      toast.error(`Failed to load map data: ${err.message}`);
    }

    setIsLoading(false);
  }, []);

  // Handle node click on map — show pending confirmation
  const handleNodeClick = useCallback((nodeId) => {
    if (isAnimating) return;

    // Block clicks when selection is done — user must Reset first
    if (selectionMode === 'done') {
      toast.info('Selection complete. Click "Reset All" to pick new points.', { autoClose: 2000 });
      return;
    }

    // Set pending node for confirmation
    setPendingNode(nodeId);
  }, [isAnimating, selectionMode]);

  // Confirm the pending node
  const handleConfirmNode = useCallback(() => {
    if (!pendingNode) return;

    if (selectionMode === 'start') {
      if (pendingNode === endNode) {
        toast.warn('Please select a different node for start.', { autoClose: 2000 });
        setPendingNode(null);
        return;
      }
      setStartNode(pendingNode);
      setResults([]);
      setShowDashboard(false);
      setHighlightedAlgorithm(null);
      
      if (endNode) {
        setSelectionMode('done');
        toast.success('✅ Start point updated! Ready to run algorithms.', { autoClose: 2500 });
      } else {
        setSelectionMode('end');
        toast.success('✅ Start point confirmed! Now select the destination.', { autoClose: 2500 });
      }
    } else if (selectionMode === 'end') {
      if (pendingNode === startNode) {
        toast.warn('Please select a different node for destination.', { autoClose: 2000 });
        setPendingNode(null);
        return;
      }
      setEndNode(pendingNode);
      setResults([]);
      setShowDashboard(false);
      setHighlightedAlgorithm(null);
      setSelectionMode('done');
      toast.success('✅ Destination confirmed! Ready to run algorithms.', { autoClose: 2500 });
    }

    setPendingNode(null);
  }, [pendingNode, selectionMode, startNode]);

  // Cancel the pending node
  const handleCancelNode = useCallback(() => {
    setPendingNode(null);
  }, []);

  // Run selected algorithms
  const executeAlgorithms = useCallback((algorithmsToRun) => {
    if (!graph || !startNode || !endNode) return;

    const costFn = createCostFunction(weights, settings);
    const newResults = [];

    for (const algName of algorithmsToRun) {
      const runFn = ALGORITHM_MAP[algName];
      if (!runFn) continue;

      const result = runFn(graph, startNode, endNode, costFn);

      // Calculate path length in km
      let pathLength = 0;
      if (result.path.length > 1) {
        for (let i = 0; i < result.path.length - 1; i++) {
          const n1 = graph.nodes.get(result.path[i]);
          const n2 = graph.nodes.get(result.path[i + 1]);
          if (n1 && n2) {
            pathLength += haversine(n1.lat, n1.lng, n2.lat, n2.lng);
          }
        }
      }

      newResults.push({
        algorithm: algName,
        ...result,
        pathLength,
      });

      if (result.path.length === 0) {
        toast.warn(`${algName}: No path found!`, { autoClose: 3000 });
      }
    }

    setResults(newResults);
    setShowDashboard(true);
  }, [graph, startNode, endNode, weights, settings]);

  const handleRun = useCallback(() => {
    executeAlgorithms(selectedAlgorithms);
  }, [executeAlgorithms, selectedAlgorithms]);

  const handleRunAll = useCallback(() => {
    executeAlgorithms(ALL_ALGORITHMS);
  }, [executeAlgorithms]);

  const handleReplay = useCallback(() => {
    if (results.length > 0) {
      setResults([...results]);
    }
  }, [results]);

  const handleReset = useCallback(() => {
    setStartNode(null);
    setEndNode(null);
    setPendingNode(null);
    setResults([]);
    setShowDashboard(false);
    setSelectionMode('start');
    setHighlightedAlgorithm(null);
    setIsAnimating(false);
    toast.info('All cleared.', { autoClose: 1500 });
  }, []);

  const handleChangeNodeLocation = useCallback((type) => {
    if (isAnimating) {
      toast.warn('Cannot change location while animating. Reset first.', { autoClose: 2000 });
      return;
    }
    
    setResults([]);
    setShowDashboard(false);
    setHighlightedAlgorithm(null);
    
    if (type === 'start') {
      setStartNode(null);
      setSelectionMode('start');
      toast.info('Select a new START point on the map.', { autoClose: 2000 });
    } else if (type === 'end') {
      setEndNode(null);
      setSelectionMode('end');
      toast.info('Select a new END point on the map.', { autoClose: 2000 });
    }
  }, [isAnimating]);

  // Filter results for map display based on highlighted algorithm
  const displayResults = highlightedAlgorithm
    ? results.filter(r => r.algorithm === highlightedAlgorithm)
    : results;

  const activeArea = AREAS[selectedArea] || null;

  return (
    <div className={`h-screen w-screen flex flex-col lg:flex-row overflow-hidden ${darkMode ? 'dark bg-surface-950' : 'bg-gray-50'}`}>
      {/* Map takes remaining space */}
      <div className="flex-1 relative min-h-0">
        <MapView
          graph={graph}
          startNode={startNode}
          endNode={endNode}
          onNodeClick={handleNodeClick}
          pendingNode={pendingNode}
          onConfirmNode={handleConfirmNode}
          onCancelNode={handleCancelNode}
          onChangeLocation={handleChangeNodeLocation}
          results={displayResults}
          animationSpeed={animationSpeed}
          isAnimating={isAnimating}
          setIsAnimating={setIsAnimating}
          activeArea={activeArea}
          selectionMode={selectionMode}
          darkMode={darkMode}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[1500] bg-surface-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-surface-300">Loading map data...</p>
              <p className="text-xs text-surface-500 mt-1">Fetching from Overpass API</p>
            </div>
          </div>
        )}

        {/* No graph prompt */}
        {!graph && !isLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
            <div className="bg-surface-900/90 backdrop-blur-xl rounded-2xl p-8 border border-surface-700/50 text-center max-w-sm pointer-events-auto">
              <div className="text-4xl mb-3">🗺️</div>
              <h2 className="text-lg font-bold text-surface-200 mb-2">Select an Area</h2>
              <p className="text-sm text-surface-400 mb-4">
                Choose a neighborhood from the sidebar to load the road network graph.
              </p>
              <button
                onClick={() => handleLoadArea('dhanmondi')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-semibold
                  hover:shadow-lg hover:shadow-accent-cyan/25 transition-all"
              >
                Load Dhanmondi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar
        weights={weights}
        setWeights={setWeights}
        settings={settings}
        setSettings={setSettings}
        selectedAlgorithms={selectedAlgorithms}
        setSelectedAlgorithms={setSelectedAlgorithms}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        onRun={handleRun}
        onReplay={handleReplay}
        hasResults={results.length > 0}
        onRunAll={handleRunAll}
        onReset={handleReset}
        isAnimating={isAnimating}
        isLoading={isLoading}
        startNode={startNode}
        endNode={endNode}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        onLoadArea={handleLoadArea}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Comparison Dashboard — Overlay from bottom */}
      {showDashboard && results.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-96 z-[1800] max-h-[60vh] overflow-y-auto
          bg-surface-950/95 backdrop-blur-xl border-t border-surface-700/50 animate-slide-up custom-scrollbar"
          id="comparison-dashboard"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-surface-200 flex items-center gap-2">
                📊 Comparison Dashboard
              </h2>
              <button
                onClick={() => setShowDashboard(false)}
                className="text-surface-500 hover:text-surface-200 transition-colors text-xs px-2 py-1 rounded hover:bg-surface-800"
                id="close-dashboard"
              >
                ✕ Close
              </button>
            </div>
            <ComparisonTable results={results} highlightedAlgorithm={highlightedAlgorithm} setHighlightedAlgorithm={setHighlightedAlgorithm} />
            <ComparisonCharts results={results} />
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        theme={darkMode ? 'dark' : 'light'}
        toastStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          fontSize: '13px',
        }}
      />
    </div>
  );
}
