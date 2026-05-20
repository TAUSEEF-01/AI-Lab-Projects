import { haversineDistance } from '../utils/haversine';
import { calculateAssignmentCost } from '../utils/costFunction';

/**
 * Greedy Assignment Algorithm
 * Assign each variable to its locally best value without backtracking
 * Fast baseline algorithm
 */
export async function solveCSP(variables, domains, constraints, costFn, onProgress) {
  const stations = variables;
  const distributors = domains;
  const params = constraints;
  const startTime = performance.now();
  let constraintChecks = 0;
  
  const assignment = {};
  const quotaUsed = {};
  distributors.forEach(d => {
    quotaUsed[d.id] = 0;
  });
  
  // Track distributor schedule conflicts
  const busyDistributors = new Set(); // Stores "distributorId-time"
  
  // Sort stations by urgency (critical status and tight time windows first)
  const sortedStations = [...stations].sort((a, b) => {
    // Priority: critical > low > adequate
    const statusPriority = { critical: 3, low: 2, adequate: 1 };
    const priorityDiff = statusPriority[b.status] - statusPriority[a.status];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by time window urgency
    const windowA = a.timeWindow.end - a.timeWindow.start;
    const windowB = b.timeWindow.end - b.timeWindow.start;
    return windowA - windowB;
  });
  
  function isConsistent(station, distributor, time) {
    constraintChecks++;
    
    const distance = haversineDistance(
      distributor.depotLat,
      distributor.depotLng,
      station.lat,
      station.lng
    );
    
    const vehicle = distributor.vehicles[0];
    const maxDistance = (vehicle.range * vehicle.currentFuel) / 100;
    
    if (distance > maxDistance || distance > params.maxPumpDistance) {
      return false;
    }
    
    const fuelNeeded = station.capacity - station.currentLevel;
    if (quotaUsed[distributor.id] + fuelNeeded > distributor.quota) {
      return false;
    }
    
    // Conflict constraint - same distributor cannot be at two places at the same time
    const schedKey = `${distributor.id}-${time}`;
    if (busyDistributors.has(schedKey)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Find best distributor and time for a station (greedy choice)
   */
  function findBestAssignment(station) {
    let bestCost = Infinity;
    let bestDistributor = null;
    let bestTime = null;
    
    // Try each distributor
    for (const distributor of distributors) {
      // Try time slots in the window
      const timeSlots = generateTimeSlots(station.timeWindow, params.maxTimeWindow);
      
      for (const time of timeSlots) {
        if (isConsistent(station, distributor, time)) {
          const cost = calculateAssignmentCost(station, distributor, time, params);
          
          if (cost < bestCost) {
            bestCost = cost;
            bestDistributor = distributor;
            bestTime = time;
          }
        }
      }
    }
    
    return { distributor: bestDistributor, time: bestTime };
  }
  
  // Greedy assignment
  let solutionFound = true;
  
  for (let i = 0; i < sortedStations.length; i++) {
    await new Promise(r => setTimeout(r, 0));
    const station = sortedStations[i];
    const { distributor, time } = findBestAssignment(station);
    
    if (!distributor) {
      // No valid assignment found for this station
      solutionFound = false;
      break;
    }
    
    const fuelNeeded = station.capacity - station.currentLevel;
    assignment[station.id] = {
      distributorId: distributor.id,
      time,
      fuelAmount: fuelNeeded
    };
    quotaUsed[distributor.id] += fuelNeeded;
    const schedKey = `${distributor.id}-${time}`;
    busyDistributors.add(schedKey);
    
    if (onProgress) {
      onProgress(i + 1, sortedStations.length, { ...assignment });
    }
  }
  
  const endTime = performance.now();
  
  let totalCost = null;
  if (solutionFound) {
    totalCost = costFn(assignment, stations, distributors, params);
  }

  return {
    totalCost,
    assignment: solutionFound ? assignment : null,
    backtracks: 0, // Greedy doesn't backtrack
    constraintChecks,
    timeTaken: endTime - startTime,
    solutionFound
  };
}

function generateTimeSlots(timeWindow, maxWindow) {
  const slots = [];
  const start = Math.max(0, timeWindow.start);
  const end = Math.min(maxWindow, timeWindow.end);
  
  for (let t = start; t <= end; t += 2) {
    slots.push(t);
  }
  
  if (slots.length === 0) {
    slots.push(timeWindow.start, timeWindow.end);
  }
  
  return slots;
}
