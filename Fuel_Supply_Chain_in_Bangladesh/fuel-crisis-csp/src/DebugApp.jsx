import { useState } from 'react';
import { generateFuelStations, generateDistributors } from './utils/dataGenerator';
import * as greedy from './csp/greedy';

function DebugApp() {
  const [output, setOutput] = useState('Click button to test');
  
  const runTest = () => {
    try {
      setOutput('Generating data...');
      
      const stations = generateFuelStations(5, 12345);
      const distributors = generateDistributors(2, 'truck', 12345);
      
      setOutput(`Generated ${stations.length} stations and ${distributors.length} distributors\n\nRunning greedy algorithm...`);
      
      const params = {
        maxTimeWindow: 24,
        maxPumpDistance: 50,
        irrationalBehaviorWeight: 1.0
      };
      
      const result = greedy.solveCSP(stations, distributors, params);
      
      setOutput(`Result:\n${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      setOutput(`ERROR: ${error.message}\n\nStack: ${error.stack}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Test</h1>
      <button
        onClick={runTest}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
      >
        Run Test
      </button>
      <pre className="bg-gray-800 p-4 rounded overflow-auto max-h-96">
        {output}
      </pre>
    </div>
  );
}

export default DebugApp;
