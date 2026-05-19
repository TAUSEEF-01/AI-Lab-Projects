import { haversineDistance } from '../utils/haversine';
import { calculateAssignmentCost } from '../utils/costFunction';

/**
 * Pure Backtracking Search for CSP
 * Naive exhaustive assignment with constraint checking
 */
export function solveCSP(stations, distributors, params, onProgress) {
  const startTime = performance.now();
  let backtracks = 0;
  let constraintChecks = 0;
  
  // Create assignment object
  const assignment = {};
  
  // Track distributor quotas used
  const quotaUsed = {};
  distributors.forEach(d => {
    quotaUsed[d.id] = 0;
  });
  
  // Track time slot conflicts
  const timeSlotAssignments = {}; // { time: Set(distributorIds) }
  
  /**
   * Check if assignment is consistent with constraints
   */
  function isConsistent(station, distributor, time) {
    constraintChecks++;
    
    // 1. Range constraint - vehicle can reach station
    const distance = haversineDistance(
      distributor.depotLat,
      distributor.depotLng,
      station.lat,
      station.lng
    );
    
    const vehicle = distributor.vehicles[0];
    const maxDistance = (vehicle.range * vehicle.currentFuel) / 100;
    
    if (distance > maxDistance) {
      return false;
    }
    
    // 2. Distance constraint - within max pump distance
    if (distance > params.maxPumpDistance) {
      return false;
    }
    
    // 3. Quota constraint - distributor has enough quota
    const fuelNeeded = station.capacity - station.currentLevel;
    if (quotaUsed[distributor.id] + fuelNeeded > distributor.quota) {
      return false;
    }
    
    // 4. Time window constraint
    if (time < station.timeWindow.start || time > station.timeWindow.end) {
      // Allow with penalty, but check if it's within acceptable range
      const maxDeviation = params.maxTimeWindow;
      if (Math.abs(time - station.timeWindow.start) > maxDeviation &&
          Math.abs(time - station.timeWindow.end) > maxDeviation) {
        return false;
      }
    }
    
    // 5. Conflict constraint - no two distributors at same station/time
    const timeKey = `${station.id}-${time}`;
    if (timeSlotAssignments[timeKey] && 
        timeSlotAssignments[timeKey] !== distributor.id) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Recursive backtracking search
   */
  function backtrack(stationIndex) {
    // Base case - all stations assigned
    if (stationIndex >= stations.length) {
      return true;
    }
    
    const station = stations[stationIndex];
    
    // Try each distributor
    for (const distributor of distributors) {
      // Try different time slots within the window
      const timeSlots = generateTimeSlots(station.timeWindow, params.maxTimeWindow);
      
      for (const time of timeSlots) {
        if (isConsistent(station, distributor, time)) {
          // Make assignment
          const fuelNeeded = station.capacity - station.currentLevel;
          assignment[station.id] = {
            distributorId: distributor.id,
            time,
            fuelAmount: fuelNeeded
          };
          quotaUsed[distributor.id] += fuelNeeded;
          const timeKey = `${station.id}-${time}`;
          timeSlotAssignments[timeKey] = distributor.id;
          
          // Progress callback
          if (onProgress) {
            onProgress(stationIndex + 1, stations.length);
          }
          
          // Recurse
          if (backtrack(stationIndex + 1)) {
            return true;
          }
          
          // Backtrack
          backtracks++;
          delete assignment[station.id];
          quotaUsed[distributor.id] -= fuelNeeded;
          delete timeSlotAssignments[timeKey];
        }
      }
    }
    
    return false;
  }
  
  // Start search
  const solutionFound = backtrack(0);
  const endTime = performance.now();
  
  return {
    assignment: solutionFound ? assignment : null,
    backtracks,
    constraintChecks,
    timeTaken: endTime - startTime,
    solutionFound
  };
}

/**
 * Generate time slots to try
 */
function generateTimeSlots(timeWindow, maxWindow) {
  const slots = [];
  const start = Math.max(0, timeWindow.start);
  const end = Math.min(maxWindow, timeWindow.end);
  
  // Generate slots every 2 hours
  for (let t = start; t <= end; t += 2) {
    slots.push(t);
  }
  
  // If no slots in window, try nearby times
  if (slots.length === 0) {
    slots.push(timeWindow.start, timeWindow.end);
  }
  
  return slots;
}
