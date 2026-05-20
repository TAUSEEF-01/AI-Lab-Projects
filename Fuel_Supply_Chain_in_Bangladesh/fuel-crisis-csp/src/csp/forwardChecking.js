import { haversineDistance } from '../utils/haversine';

/**
 * Backtracking with Forward Checking
 * Prune domains of unassigned variables after each assignment
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
  
  // Track distributor schedule conflicts
  const busyDistributors = new Set(); // Stores "distributorId-time"
  
  // Initialize domains for each station
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
    
    // Conflict constraint - same distributor cannot be at two places at the same time
    const schedKey = `${distributor.id}-${time}`;
    if (busyDistributors.has(schedKey)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Forward checking - prune domains of unassigned variables
   */
  function forwardCheck(assignedStation, assignedDistributor, assignedTime) {
    const savedDomains = {};
    
    // For each unassigned station
    for (const station of stations) {
      if (assignment[station.id]) continue;
      
      savedDomains[station.id] = [...domainMap[station.id]];
      const newDomain = [];
      
      // Filter domain values that are still consistent
      for (const value of domainMap[station.id]) {
        const { distributor, time } = value;
        
        // 1. Quota constraint check
        const fuelNeeded = station.capacity - station.currentLevel;
        const projectedQuota = quotaUsed[distributor.id] + fuelNeeded;
        
        if (projectedQuota > distributor.quota) {
          continue;
        }
        
        // 2. Conflict constraint check (same distributor cannot be booked at same time slot)
        if (distributor.id === assignedDistributor.id && time === assignedTime) {
          continue;
        }
        
        newDomain.push(value);
      }
      
      domainMap[station.id] = newDomain;
      
      // Domain wipeout - no valid values left
      if (newDomain.length === 0) {
        return { success: false, savedDomains };
      }
    }
    
    return { success: true, savedDomains };
  }
  
  async function backtrack(stationIndex) { 
    await new Promise(r => setTimeout(r, 0));
    if (stationIndex >= stations.length) {
      return true;
    }
    
    const station = stations[stationIndex];
    
    // Try values from domain
    for (const value of domainMap[station.id]) {
      const { distributor, time } = value;
      
      if (isConsistent(station, distributor, time)) {
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
          onProgress(stationIndex + 1, stations.length, { ...assignment });
        }
        
        // Forward check
        const fcResult = forwardCheck(station, distributor, time);
        
        if (fcResult.success) {
          if (await backtrack(stationIndex + 1)) {
            return true;
          }
        }
        
        // Restore domains
        if (fcResult.savedDomains) {
          Object.assign(domainMap, fcResult.savedDomains);
        }
        
        backtracks++;
        delete assignment[station.id];
        quotaUsed[distributor.id] -= fuelNeeded;
        busyDistributors.delete(schedKey);
      }
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
