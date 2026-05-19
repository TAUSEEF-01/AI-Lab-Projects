import { haversineDistance } from './haversine';

/**
 * Calculate the total cost of a CSP assignment
 * 
 * Total Cost = Σ (route_distance × vehicle_fuel_consumption) 
 *            + Σ (time_penalty for late refuels) 
 *            + Σ (irrational_behavior_penalty)
 */
export function calculateTotalCost(assignment, stations, distributors, params) {
  let totalCost = 0;
  const {
    timePenaltyWeight = 100,
    irrationalBehaviorWeight = 1.0,
    maxTimeWindow = 24
  } = params;
  
  // Process each assignment
  for (const [stationId, assignmentData] of Object.entries(assignment)) {
    const station = stations.find(s => s.id === stationId);
    const distributor = distributors.find(d => d.id === assignmentData.distributorId);
    
    if (!station || !distributor) continue;
    
    // 1. Route distance cost
    const distance = haversineDistance(
      distributor.depotLat,
      distributor.depotLng,
      station.lat,
      station.lng
    );
    
    const vehicle = distributor.vehicles[0]; // Use first vehicle for simplicity
    const routeCost = distance * vehicle.consumption * 1.5; // fuel cost factor
    totalCost += routeCost;
    
    // 2. Time penalty (if assigned outside preferred window)
    const assignedTime = assignmentData.time || 0;
    if (assignedTime < station.timeWindow.start || assignedTime > station.timeWindow.end) {
      const timeDiff = Math.min(
        Math.abs(assignedTime - station.timeWindow.start),
        Math.abs(assignedTime - station.timeWindow.end)
      );
      totalCost += timeDiff * timePenaltyWeight;
    }
    
    // 3. Irrational behavior penalty
    // Find the nearest distributor to this station
    let minDistance = Infinity;
    for (const d of distributors) {
      const dist = haversineDistance(d.depotLat, d.depotLng, station.lat, station.lng);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }
    
    // If assigned distributor is > 20% farther than nearest, apply penalty
    if (distance > minDistance * 1.2) {
      const excessDistance = distance - minDistance;
      totalCost += excessDistance * irrationalBehaviorWeight * 50;
    }
  }
  
  return totalCost;
}

/**
 * Calculate cost for a single assignment (used during search)
 */
export function calculateAssignmentCost(station, distributor, time, params) {
  const {
    timePenaltyWeight = 100,
    irrationalBehaviorWeight = 1.0
  } = params;
  
  let cost = 0;
  
  // Route distance cost
  const distance = haversineDistance(
    distributor.depotLat,
    distributor.depotLng,
    station.lat,
    station.lng
  );
  
  const vehicle = distributor.vehicles[0];
  cost += distance * vehicle.consumption * 1.5;
  
  // Time penalty
  if (time < station.timeWindow.start || time > station.timeWindow.end) {
    const timeDiff = Math.min(
      Math.abs(time - station.timeWindow.start),
      Math.abs(time - station.timeWindow.end)
    );
    cost += timeDiff * timePenaltyWeight;
  }
  
  return cost;
}
