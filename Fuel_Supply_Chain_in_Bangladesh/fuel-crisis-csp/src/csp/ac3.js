import { haversineDistance } from '../utils/haversine';

/**
 * Backtracking with AC-3 (Arc Consistency)
 * Enforce arc consistency before and during search
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
  
  // Initialize domains
  const domainMap = {};
  stations.forEach(station => {
    domainMap[station.id] = generateDomain(station, distributors, params);
  });
  
  /**
   * AC-3 Algorithm - enforce arc consistency
   */
  function ac3() {
    const queue = [];
    
    // Initialize queue with all arcs
    for (let i = 0; i < stations.length; i++) {
      for (let j = 0; j < stations.length; j++) {
        if (i !== j) {
          queue.push([stations[i].id, stations[j].id]);
        }
      }
    }
    
    while (queue.length > 0) {
      const [xi, xj] = queue.shift();
      
      if (revise(xi, xj)) {
        if (domainMap[xi].length === 0) {
          return false; // Inconsistent
        }
        
        // Add neighbors back to queue
        for (const station of stations) {
          if (station.id !== xi && station.id !== xj) {
            queue.push([station.id, xi]);
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Revise domain of Xi to be arc consistent with Xj
   */
  function revise(xi, xj) {
    let revised = false;
    const newDomain = [];
    
    for (const valueI of domainMap[xi]) {
      let satisfiable = false;
      
      // Check if there exists a value in Xj's domain that satisfies constraint
      for (const valueJ of domainMap[xj]) {
        if (isCompatible(valueI, valueJ)) {
          satisfiable = true;
          break;
        }
      }
      
      if (satisfiable) {
        newDomain.push(valueI);
      } else {
        revised = true;
      }
    }
    
    domainMap[xi] = newDomain;
    return revised;
  }
  
  /**
   * Check if two assignments are compatible (don't violate constraints)
   */
  function isCompatible(value1, value2) {
    constraintChecks++;
    
    // Different distributors can work simultaneously
    // Same distributor cannot be at two places at same time
    if (value1.distributor.id === value2.distributor.id && value1.time === value2.time) {
      return false;
    }
    
    return true;
  }
  
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
  
  async function backtrack(stationIndex) { 
    await new Promise(r => setTimeout(r, 0));
    if (stationIndex >= stations.length) {
      return true;
    }
    
    const station = stations[stationIndex];
    
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
        
        if (await backtrack(stationIndex + 1)) {
          return true;
        }
        
        backtracks++;
        delete assignment[station.id];
        quotaUsed[distributor.id] -= fuelNeeded;
        busyDistributors.delete(schedKey);
      }
    }
    
    return false;
  }
  
  // Run AC-3 preprocessing
  const consistent = ac3();
  
  if (!consistent) {
    const endTime = performance.now();
    return {
      assignment: null,
      backtracks,
      constraintChecks,
      timeTaken: endTime - startTime,
      solutionFound: false
    };
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
