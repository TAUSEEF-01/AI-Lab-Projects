import { useState } from 'react';

// EntityEditor Component
function EntityEditor({ selectedEntity, stations, distributors, updateEntity }) {
  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500 font-mono text-xs text-center p-4">
        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        Click on the map to add a new entity, or click an existing marker to edit its properties.
      </div>
    );
  }

  const isStation = selectedEntity.type === 'station';
  const entity = isStation 
    ? stations.find(s => s.id === selectedEntity.id)
    : distributors.find(d => d.id === selectedEntity.id);

  if (!entity) return null;

  return (
    <div className="space-y-4">
      <div className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
        {isStation ? '⛽ Station Config' : '🏢 Depot Config'}
      </div>
      
      {isStation ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Name</label>
            <input 
              type="text" 
              value={entity.name}
              onChange={e => updateEntity('station', entity.id, { name: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Capacity (Liters)</label>
            <input 
              type="number" 
              value={entity.capacity}
              onChange={e => updateEntity('station', entity.id, { capacity: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Current Fuel (Liters)</label>
            <input 
              type="number" 
              max={entity.capacity}
              value={entity.currentLevel}
              onChange={e => updateEntity('station', entity.id, { currentLevel: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Name</label>
            <input 
              type="text" 
              value={entity.name}
              onChange={e => updateEntity('distributor', entity.id, { name: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Daily Quota (Liters)</label>
            <input 
              type="number" 
              value={entity.quota}
              onChange={e => updateEntity('distributor', entity.id, { quota: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">Fleet Vehicles ({entity.vehicles.length})</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {entity.vehicles.map((v, i) => (
                <div key={v.id} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center">
                  <div className="text-xs">
                    <span className="font-mono text-indigo-500">{v.type.toUpperCase()}</span>
                    <span className="ml-2 text-slate-500">{v.currentFuel}%</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newVehicles = entity.vehicles.filter(veh => veh.id !== v.id);
                      updateEntity('distributor', entity.id, { vehicles: newVehicles });
                    }}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                const newVehicles = [...entity.vehicles, {
                  id: `veh-${Date.now()}`,
                  type: 'truck',
                  range: 400,
                  consumption: 0.3,
                  currentFuel: 100
                }];
                updateEntity('distributor', entity.id, { vehicles: newVehicles });
              }}
              className="mt-2 w-full text-xs font-semibold py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              + Add Vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ 
  params, 
  onParamsChange, 
  onGenerate, 
  onSolve, 
  onReset,
  solving,
  theme,
  editMode,
  onToggleEditMode,
  selectedEntity,
  stations,
  distributors,
  updateEntity
}) {
  const [expanded, setExpanded] = useState({
    scenario: true,
    constraints: true,
    tuning: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const algorithms = [
    { id: 'all', name: 'All Algs', desc: 'Run all solvers for comparison' },
    { id: 'backtracking', name: 'BT', desc: 'Standard backtracking search' },
    { id: 'forwardChecking', name: 'FC', desc: 'Backtracking with forward pruning' },
    { id: 'ac3', name: 'AC-3', desc: 'Arc consistency pre-processing' },
    { id: 'mrv', name: 'MRV', desc: 'Minimum Remaining Values heuristic' },
    { id: 'lcv', name: 'LCV', desc: 'Least Constraining Value heuristic' },
    { id: 'greedy', name: 'Greedy', desc: 'Immediate heuristic, no backtrack' }
  ];
  
  const vehicleTypes = [
    { id: 'truck', name: 'Heavy Truck', range: '400km', desc: 'Primary logistic fleet', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h5l3 3v6a1 1 0 01-1 1h-1m-6 0h-2" />
      </svg>
    )},
    { id: 'van', name: 'Logistic Van', range: '250km', desc: 'Medium cargo carrier', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
    { id: 'motorbike', name: 'Rapid Bike', range: '80km', desc: 'Fast emergency runner', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    )}
  ];
  
  return (
    <div className="w-80 h-full bg-white dark:bg-[#090b0f] flex flex-col border-r border-slate-200 dark:border-slate-900 overflow-hidden text-slate-700 dark:text-slate-200 transition-colors duration-300">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#07080a] transition-colors duration-300 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">Logistics Control</h1>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">CSP CALIBRATION HUD</span>
          </div>
        </div>
        
        {/* Edit Mode Toggle */}
        <div className="mt-4 flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Custom Edit Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={editMode}
              onChange={(e) => onToggleEditMode(e.target.checked)}
              disabled={solving}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>
      
      {/* Main Parameters area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {editMode ? (
          <EntityEditor 
            selectedEntity={selectedEntity} 
            stations={stations} 
            distributors={distributors} 
            updateEntity={updateEntity} 
          />
        ) : (
          <>
            {/* Accordion 1: Scenario Settings */}
            <div className="border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-50 dark:bg-slate-950/20 overflow-hidden transition-colors duration-300">
              <button 
                onClick={() => toggleSection('scenario')}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/30 text-xs font-bold font-mono tracking-wider uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  1. Scenario Scale
                </span>
                <svg className={`w-4 h-4 transform transition-transform ${expanded.scenario ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expanded.scenario && (
                <div className="p-4 space-y-4">
                  {/* Region Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Supply Region</span>
                    </div>
                    <div className="relative">
                      <select 
                        value={params.region} 
                        onChange={(e) => onParamsChange({ region: e.target.value })}
                        disabled={solving}
                        className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
                      >
                        <option value="dhaka">Dhaka City</option>
                        <option value="chittagong">Chittagong</option>
                        <option value="sylhet">Sylhet</option>
                        <option value="khulna">Khulna</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Num Stations Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Fuel Stations</span>
                  <span className="font-mono text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/30 transition-colors duration-300">
                    {params.numStations}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={params.numStations}
                  onChange={(e) => onParamsChange({ numStations: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
              
              {/* Num Distributors Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Distributors</span>
                  <span className="font-mono text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/30 transition-colors duration-300">
                    {params.numDistributors}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={params.numDistributors}
                  onChange={(e) => onParamsChange({ numDistributors: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Accordion 2: Constraints Settings */}
        <div className="border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-50 dark:bg-slate-950/20 overflow-hidden transition-colors duration-300">
          <button 
            onClick={() => toggleSection('constraints')}
            className="w-full px-4 py-3 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/30 text-xs font-bold font-mono tracking-wider uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              2. Constraint Parameters
            </span>
            <svg className={`w-4 h-4 transform transition-transform ${expanded.constraints ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded.constraints && (
            <div className="p-4 space-y-4">
              {/* Vehicle Range Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Max Vehicle Range</span>
                  <span className="font-mono text-violet-650 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-900/30 transition-colors duration-300">
                    {params.vehicleRange} km
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={params.vehicleRange}
                  onChange={(e) => onParamsChange({ vehicleRange: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
              
              {/* Max Time Window Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Max Time Window</span>
                  <span className="font-mono text-violet-650 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-900/30 transition-colors duration-300">
                    {params.maxTimeWindow} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={params.maxTimeWindow}
                  onChange={(e) => onParamsChange({ maxTimeWindow: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
              
              {/* Max Pump Distance Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Max Depot-Pump Dist</span>
                  <span className="font-mono text-violet-650 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-900/30 transition-colors duration-300">
                    {params.maxPumpDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={params.maxPumpDistance}
                  onChange={(e) => onParamsChange({ maxPumpDistance: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Accordion 3: Optimization Tuning Settings */}
        <div className="border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-50 dark:bg-slate-950/20 overflow-hidden transition-colors duration-300">
          <button 
            onClick={() => toggleSection('tuning')}
            className="w-full px-4 py-3 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/30 text-xs font-bold font-mono tracking-wider uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
              3. Solver & Scenarios
            </span>
            <svg className={`w-4 h-4 transform transition-transform ${expanded.tuning ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded.tuning && (
            <div className="p-4 space-y-4">
              {/* Irrational Penalty Weight Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Irrational Route Penalty</span>
                  <span className="font-mono text-pink-650 dark:text-pink-400 font-bold bg-pink-50 dark:bg-pink-950/30 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-900/30 transition-colors duration-300">
                    {params.irrationalBehaviorWeight.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={params.irrationalBehaviorWeight}
                  onChange={(e) => onParamsChange({ irrationalBehaviorWeight: parseFloat(e.target.value) })}
                  className="w-full"
                  disabled={solving}
                />
              </div>
              
              {/* Rush scenario checkbox (futuristic switch slider styling) */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-900 bg-slate-100/30 dark:bg-slate-950/35 transition-colors duration-300">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-white leading-none">Rush Scenario</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">-50% Time Windows</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.rushScenario}
                    onChange={(e) => onParamsChange({ rushScenario: e.target.checked })}
                    disabled={solving}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                </label>
              </div>

              {/* Vehicle Type Card Selector */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">Vehicle Logistics Tier</span>
                <div className="grid grid-cols-1 gap-2">
                  {vehicleTypes.map(vt => {
                    const isSelected = params.vehicleType === vt.id;
                    return (
                      <button
                        key={vt.id}
                        onClick={() => !solving && onParamsChange({ vehicleType: vt.id })}
                        disabled={solving}
                        className={`
                          w-full p-2.5 flex items-start gap-3 rounded-xl border text-left transition-all duration-200
                          ${isSelected 
                            ? 'bg-indigo-500/10 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.06)] text-slate-900 dark:text-white' 
                            : 'bg-white dark:bg-[#0b0d13]/60 border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}
                        `}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-indigo-500/20 text-indigo-650 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600'}`}>
                          {vt.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold leading-none">{vt.name}</span>
                            <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded leading-none text-slate-550 dark:text-slate-400">
                              {vt.range}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block mt-1 leading-none">{vt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Picker Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 font-mono">Select Algorithm</span>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">Solver Engine</span>
          </div>
          
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
            {algorithms.map(alg => {
              const isSelected = params.selectedAlgorithm === alg.id;
              return (
                <button
                  key={alg.id}
                  onClick={() => !solving && onParamsChange({ selectedAlgorithm: alg.id })}
                  disabled={solving}
                  className={`
                    w-full py-2 px-3 text-left rounded-lg text-xs font-medium transition-all duration-200 flex flex-col gap-0.5 border
                    ${isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-900 dark:text-white font-semibold' 
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-950/50 text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{alg.name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>}
                  </div>
                  <span className={`text-[10px] transition-colors ${isSelected ? 'text-indigo-650 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-600'} font-normal font-sans`}>{alg.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
          </>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#07080a] space-y-2.5 transition-colors duration-300">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onGenerate}
            disabled={solving}
            className="w-full bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-40 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white py-2.5 px-3 rounded-xl transition duration-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
            Re-Gen
          </button>
          
          <button
            onClick={onReset}
            disabled={solving}
            className="w-full bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/15 hover:border-rose-200 dark:hover:border-rose-900/30 disabled:opacity-40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 py-2.5 px-3 rounded-xl transition duration-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset
          </button>
        </div>
        
        <button
          onClick={onSolve}
          disabled={solving}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95"
        >
          {solving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Optimizing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Solve Constraint
            </>
          )}
        </button>
      </div>
    </div>
  );
}
