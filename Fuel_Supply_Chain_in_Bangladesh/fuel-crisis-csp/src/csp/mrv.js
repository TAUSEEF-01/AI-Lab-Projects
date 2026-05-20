import { haversineDistance } from '../utils/haversine';

/**
 * Backtracking with MRV (Minimum Remaining Values) Heuristic
 * Always assign the variable with the fewest legal values first
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
   * Select unassigned variable with minimum remaining values (MRV)
   */
  function selectUnassignedVariable() {
    let minDomainSize = Infinity;
    let selectedStation = null;
    
    for (const station of stations) {
      if (!assignment[station.id]) {
        // Count valid values in domain
        const validValues = domainMap[station.id].filter(value => {
          const { distributor, time } = value;
          return isConsistent(station, distributor, time);
        });
        
        if (validValues.length < minDomainSize) {
          minDomainSize = validValues.length;
          selectedStation = station;
        }
      }
    }
    
    return selectedStation;
  }
  
  async function backtrack() { 
    await new Promise(r => setTimeout(r, 0));
    // Check if assignment is complete
    if (Object.keys(assignment).length === stations.length) {
      return true;
    }
    
    // Select variable using MRV heuristic
    const station = selectUnassignedVariable();
    
    if (!station) {
      return false;
    }
    
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
          const progress = Object.keys(assignment).length;
          onProgress(progress, stations.length, { ...assignment });
        }
        
        if (await backtrack()) {
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
  
  const solutionFound = await backtrack();
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
