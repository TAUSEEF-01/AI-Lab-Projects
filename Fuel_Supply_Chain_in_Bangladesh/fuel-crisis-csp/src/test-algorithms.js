// Simple test script to verify algorithms work
import { generateFuelStations, generateDistributors } from './utils/dataGenerator';
import * as greedy from './csp/greedy';

export function testAlgorithms() {
  console.log('=== Testing CSP Algorithms ===');
  
  try {
    // Generate small test scenario
    const stations = generateFuelStations(5, 12345);
    const distributors = generateDistributors(2, 'truck', 12345);
    
    console.log('Generated stations:', stations);
    console.log('Generated distributors:', distributors);
    
    const params = {
      maxTimeWindow: 24,
      maxPumpDistance: 50,
      irrationalBehaviorWeight: 1.0
    };
    
    console.log('Running greedy algorithm...');
    const result = greedy.solveCSP(stations, distributors, params);
    
    console.log('Result:', result);
    
    if (result.solutionFound) {
      console.log('✓ Algorithm test PASSED');
      return true;
    } else {
      console.log('✗ No solution found');
      return false;
    }
  } catch (error) {
    console.error('✗ Algorithm test FAILED:', error);
    return false;
  }
}
