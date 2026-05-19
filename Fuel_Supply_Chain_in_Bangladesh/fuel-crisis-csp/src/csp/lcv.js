import { haversineDistance } from '../utils/haversine';

/**
 * Backtracking with LCV (Least Constraining Value) Heuristic
 * Choose the value that rules out the fewest options for neighbors
 */
export async function solveCSP(variables, domains, constraints, costFn, onProgress) {
  const stations = variables;
  const distributors = domains;
  const params = constraints;
  const startTime = performance.now();
  let backtracks = 0;
  let constraintChecks = 0;
  
  const assignment = {};
  const quotaUsed = {};
  distributors.forEach(d => {
    quotaUsed[d.id] = 0;
  });
  
  const domainMap = {};
  stations.forEach(station => {
    domainMap[station.id] = generateDomain(station, distributors, params);
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
    
    return true;
  }
  
  /**
   * Count how many values this assignment would rule out for unassigned variables
   */
  function countConstrainedValues(station, distributor, time) {
    let constrainedCount = 0;
    
    const fuelNeeded = station.capacity - station.currentLevel;
    const projectedQuota = quotaUsed[distributor.id] + fuelNeeded;
    
    // Check impact on other unassigned stations
    for (const otherStation of stations) {
      if (assignment[otherStation.id] || otherStation.id === station.id) {
        continue;
      }
      
      // Count how many domain values would become invalid
      for (const value of domainMap[otherStation.id]) {
        if (value.distributor.id === distributor.id) {
          const otherFuelNeeded = otherStation.capacity - otherStation.currentLevel;
          
          // Would this exceed quota?
          if (projectedQuota + otherFuelNeeded > distributor.quota) {
            constrainedCount++;
          }
          
          // Would this create time conflict?
          if (value.time === time) {
            constrainedCount++;
          }
        }
      }
    }
    
    return constrainedCount;
  }
  
  /**
   * Order domain values by LCV - least constraining first
   */
  function orderDomainValues(station) {
    const values = domainMap[station.id].filter(value => {
      const { distributor, time } = value;
      return isConsistent(station, distributor, time);
    });
    
    // Sort by number of constraints imposed (ascending)
    values.sort((a, b) => {
      const countA = countConstrainedValues(station, a.distributor, a.time);
      const countB = countConstrainedValues(station, b.distributor, b.time);
      return countA - countB;
    });
    
    return values;
  }
  
  async function backtrack(stationIndex) { 
    await new Promise(r => setTimeout(r, 0));
    if (stationIndex >= stations.length) {
      return true;
    }
    
    const station = stations[stationIndex];
    
    // Order values using LCV heuristic
    const orderedValues = orderDomainValues(station);
    
    for (const value of orderedValues) {
      const { distributor, time } = value;
      
      const fuelNeeded = station.capacity - station.currentLevel;
      assignment[station.id] = {
        distributorId: distributor.id,
        time,
        fuelAmount: fuelNeeded
      };
      quotaUsed[distributor.id] += fuelNeeded;
      
      if (onProgress) {
        onProgress(stationIndex + 1, stations.length, { ...assignment });
      }
      
      if (await backtrack(stationIndex + 1)) {
        return true;
      }
      
      backtracks++;
      delete assignment[station.id];
      quotaUsed[distributor.id] -= fuelNeeded;
    }
    
    return false;
  }
  
  const solutionFound = await backtrack(0);
  const endTime = performance.now();
  
  let totalCost = null;
  if (solutionFound) {
    totalCost = costFn(assignment, stations, distributors, params);
  }

  return {
    assignment: solutionFound ? assignment : null,
    backtracks,
    constraintChecks,
    timeTaken: endTime - startTime,
    totalCost,
    solutionFound
  };
}

function generateDomain(station, distributors, params) {
  const domain = [];
  const timeSlots = generateTimeSlots(station.timeWindow, params.maxTimeWindow);
  
  for (const distributor of distributors) {
    for (const time of timeSlots) {
      domain.push({ distributor, time });
    }
  }
  
  return domain;
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
