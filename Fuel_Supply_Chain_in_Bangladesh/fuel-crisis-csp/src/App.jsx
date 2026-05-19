import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ComparisonTable from './components/ComparisonTable';
import ComparisonCharts from './components/ComparisonCharts';
import { generateFuelStations, generateDistributors, applyRushScenario, REGION_BOUNDS } from './utils/dataGenerator';
import { calculateTotalCost } from './utils/costFunction';
import * as backtracking from './csp/backtracking';
import * as forwardChecking from './csp/forwardChecking';
import * as ac3 from './csp/ac3';
import * as mrv from './csp/mrv';
import * as lcv from './csp/lcv';
import * as greedy from './csp/greedy';
import { testAlgorithms } from './test-algorithms';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fuel-csp-theme') || 'dark');
  const [params, setParams] = useState({
    region: 'dhaka',
    numStations: 10,
    numDistributors: 3,
    vehicleRange: 400,
    maxTimeWindow: 24,
    maxPumpDistance: 50,
    irrationalBehaviorWeight: 1.0,
    vehicleType: 'truck',
    selectedAlgorithm: 'all',
    rushScenario: false
  });
  
  const [stations, setStations] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [results, setResults] = useState([]);
  const [solving, setSolving] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [notification, setNotification] = useState(null);
  
  // Custom Edit Mode State
  const [editMode, setEditMode] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const handleToggleEditMode = (mode) => {
    setEditMode(mode);
    setSelectedEntity(null); // Clear selection when toggling
    if (mode) {
      showNotification('Edit Mode Enabled. Click map to add entities.', 'info');
    }
  };

  const handleMapClick = (lat, lng) => {
    if (!editMode) return;
    const choice = window.confirm("Add a Fuel Station? (Click 'Cancel' to add a Distributor instead)");
    
    if (choice) {
      // Add Station
      const newStation = {
        id: `station-custom-${Date.now()}`,
        name: `Custom Station`,
        lat,
        lng,
        capacity: 2000,
        currentLevel: 1000,
        minLevel: 200,
        status: 'adequate',
        timeWindow: { start: 0, end: 24 },
        assigned: false,
        assignedDistributor: null,
        assignedTime: null
      };
      setStations(prev => [...prev, newStation]);
      showNotification('Added Custom Station', 'success');
    } else {
      // Add Distributor
      const newDistributor = {
        id: `distributor-custom-${Date.now()}`,
        name: `Custom Depot`,
        depotLat: lat,
        depotLng: lng,
        quota: 25000,
        vehicles: [],
        color: '#10b981', // Emerald
        assignedStations: []
      };
      setDistributors(prev => [...prev, newDistributor]);
      showNotification('Added Custom Distributor', 'success');
    }
  };

  const handleEntityClick = (type, id) => {
    if (!editMode) return;
    setSelectedEntity({ type, id });
  };

  const updateEntity = (type, id, data) => {
    if (type === 'station') {
      setStations(prev => prev.map(s => {
        if (s.id === id) {
          // Auto-recalculate status for stations
          const current = data.currentLevel !== undefined ? data.currentLevel : s.currentLevel;
          const cap = data.capacity !== undefined ? data.capacity : s.capacity;
          const pct = (current / cap) * 100;
          let status = 'adequate';
          if (pct < 20) status = 'critical';
          else if (pct < 50) status = 'low';
          return { ...s, ...data, status };
        }
        return s;
      }));
    } else if (type === 'distributor') {
      setDistributors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fuel-csp-theme', theme);
  }, [theme]);

  
  // Generate initial scenario
  useEffect(() => {
    generateScenario();
    // Run test on mount
    console.log('Running algorithm test...');
    testAlgorithms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const generateScenario = (currentParams = params) => {
    try {
      const seed = Date.now();
      console.log('Generating scenario with seed:', seed);
      
      let newStations = generateFuelStations(currentParams.numStations, currentParams.region, seed);
      const newDistributors = generateDistributors(currentParams.numDistributors, currentParams.vehicleType, currentParams.region, seed);
      
      console.log('Generated stations:', newStations.length);
      console.log('Generated distributors:', newDistributors.length);
      
      if (currentParams.rushScenario) {
        newStations = applyRushScenario(newStations);
        console.log('Applied rush scenario');
      }
      
      setStations(newStations);
      setDistributors(newDistributors);
      setAssignment(null);
      setResults([]);
      setAnimationStep(0);
      
      showNotification('New scenario generated', 'success');
    } catch (error) {
      console.error('Error generating scenario:', error);
      showNotification(`Error generating scenario: ${error.message}`, 'error');
    }
  };
  
  const handleParamsChange = (newParams) => {
    setParams(prev => {
      const updatedParams = { ...prev, ...newParams };
      
      // If any structural parameter changed, regenerate the scenario
      if (
        'region' in newParams ||
        'numStations' in newParams || 
        'numDistributors' in newParams || 
        'vehicleType' in newParams || 
        'rushScenario' in newParams
      ) {
        setTimeout(() => generateScenario(updatedParams), 0);
      }
      
      return updatedParams;
    });
  };
  
  const handleGenerate = () => {
    generateScenario();
  };
  
  const handleReset = () => {
    setAssignment(null);
    setResults([]);
    setAnimationStep(0);
    showNotification('Reset complete', 'info');
  };
  
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleSolve = async () => {
    console.log('Starting solve with params:', params);
    console.log('Stations:', stations.length);
    console.log('Distributors:', distributors.length);
    
    setSolving(true);
    setResults([]);
    setAssignment(null);
    
    const algorithms = params.selectedAlgorithm === 'all' 
      ? ['backtracking', 'forwardChecking', 'ac3', 'mrv', 'lcv', 'greedy']
      : [params.selectedAlgorithm];
    
    const algorithmMap = {
      backtracking: { module: backtracking, name: 'Backtracking' },
      forwardChecking: { module: forwardChecking, name: 'Forward Checking' },
      ac3: { module: ac3, name: 'AC-3' },
      mrv: { module: mrv, name: 'MRV Heuristic' },
      lcv: { module: lcv, name: 'LCV Heuristic' },
      greedy: { module: greedy, name: 'Greedy' }
    };
    
    const newResults = [];
    
    for (const algId of algorithms) {
      const alg = algorithmMap[algId];
      
      try {
        console.log(`Running ${alg.name}...`);
        showNotification(`Running ${alg.name}...`, 'info');
        
        // Run algorithm
        let result;
        try {
          console.log(`Calling solveCSP for ${alg.name}`);
          result = await alg.module.solveCSP(
            stations,
            distributors,
            params,
            calculateTotalCost,
            (current, total, currentAssignment) => {
              setAnimationStep(current);
              if (currentAssignment) setAssignment(currentAssignment);
            }
          );
          console.log(`${alg.name} result:`, result);
        } catch (err) {
          console.error(`Error in ${alg.name}:`, err);
          throw err;
        }
        
        newResults.push({
          algorithmName: alg.name,
          ...result
        });
        
        // Use first successful solution for visualization
        if (result.solutionFound && !assignment) {
          setAssignment(result.assignment);
        }
        
      } catch (error) {
        console.error(`Error running ${alg.name}:`, error);
        showNotification(`Error in ${alg.name}: ${error.message}`, 'error');
        newResults.push({
          algorithmName: alg.name,
          solutionFound: false,
          backtracks: 0,
          constraintChecks: 0,
          timeTaken: 0,
          totalCost: null,
          assignment: null
        });
      }
    }
    
    console.log('All results:', newResults);
    setResults(newResults);
    setSolving(false);
    
    const successCount = newResults.filter(r => r.solutionFound).length;
    if (successCount === 0) {
      showNotification('No feasible assignment found — try relaxing constraints', 'error');
    } else {
      showNotification(`${successCount} algorithm(s) found solutions`, 'success');
    }
  };
  
  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-[#07080a] text-slate-850 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar Panel */}
      <Sidebar
        params={params}
        onParamsChange={handleParamsChange}
        onGenerate={handleGenerate}
        onSolve={handleSolve}
        onReset={handleReset}
        solving={solving}
        theme={theme}
        editMode={editMode}
        onToggleEditMode={handleToggleEditMode}
        selectedEntity={selectedEntity}
        stations={stations}
        distributors={distributors}
        updateEntity={updateEntity}
      />
      
      {/* Main Analytics Hub */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-slate-200 dark:border-slate-900 transition-colors duration-300">
        {/* Top Premium cyber header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/75 dark:bg-[#090b0f]/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 font-mono">
                Fuel Chain Bangladesh
              </span>
              <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200 dark:border-indigo-800/40 rounded-full font-mono">
                CSP SOLVER CORE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0e1117] border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-400 transition-colors duration-300">
              <span className={`w-2.5 h-2.5 rounded-full ${solving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]'}`}></span>
              STATUS: {solving ? 'OPTIMIZING' : 'STANDBY'}
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-[#0e1117] border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 17a5 5 0 100-10 5 5 0 000 10z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Global Notifications System (Modern dynamic toast) */}
        {notification && (
          <div className={`
            fixed top-20 right-6 z-[9999] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 backdrop-blur-md text-sm transition-all duration-300 transform translate-y-0
            ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/75 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-emerald-900/10 dark:shadow-emerald-950/20' : ''}
            ${notification.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/75 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 shadow-rose-900/10 dark:shadow-rose-950/20' : ''}
            ${notification.type === 'info' ? 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/30 text-indigo-800 dark:text-indigo-300 shadow-slate-900/10 dark:shadow-slate-950/25' : ''}
          `}>
            {notification.type === 'success' && (
              <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium font-mono">{notification.message}</span>
          </div>
        )}
        
        {/* Main Split Panels */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#07080a] transition-colors duration-300">
          {/* Top Panel: Map Area */}
          <div className="h-[55%] p-4 relative flex flex-col">
            <div className="flex-1 bg-white dark:bg-[#090b0f] border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative transition-colors duration-300">
              <MapView
                stations={stations}
                distributors={distributors}
                assignment={assignment}
                animationStep={animationStep}
                theme={theme}
                region={params.region}
                editMode={editMode}
                onMapClick={handleMapClick}
                onEntityClick={handleEntityClick}
              />
              
              {/* Real-time Computing overlay */}
              {solving && (
                <div className="absolute top-4 left-4 z-[1000] glass-panel-glow-blue px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs font-mono border border-indigo-500/25 text-indigo-600 dark:text-indigo-300">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  <span>CSP RUNNING • EVALUATED STATES: {animationStep}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Panel: Comparative Analytics */}
          <div className="h-[45%] px-4 pb-4 overflow-y-auto">
            <div className="space-y-4 max-w-7xl mx-auto">
              <ComparisonTable results={results} />
              <ComparisonCharts results={results} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

