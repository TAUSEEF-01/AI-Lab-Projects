/**
 * Generate synthetic fuel station and distributor data
 */

// Dhaka city bounding box
const DHAKA_BOUNDS = {
  minLat: 23.7,
  maxLat: 24.0,
  minLng: 90.3,
  maxLng: 90.6
};

// Seeded random number generator for reproducibility
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  range(min, max) {
    return min + this.next() * (max - min);
  }
  
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}

/**
 * Generate random fuel stations
 */
export function generateFuelStations(count, seed = 42) {
  const rng = new SeededRandom(seed);
  const stations = [];
  
  for (let i = 0; i < count; i++) {
    const capacity = rng.int(500, 5000);
    const currentLevel = rng.int(0, capacity);
    const levelPercent = (currentLevel / capacity) * 100;
    
    // Determine status based on fuel level
    let status = 'adequate';
    if (levelPercent < 20) status = 'critical';
    else if (levelPercent < 50) status = 'low';
    
    // Random time window (2-24 hours from now)
    const windowStart = rng.int(0, 48); // hours from now
    const windowDuration = rng.int(2, 24); // hours
    
    stations.push({
      id: `station-${i + 1}`,
      name: `Fuel Station ${i + 1}`,
      lat: rng.range(DHAKA_BOUNDS.minLat, DHAKA_BOUNDS.maxLat),
      lng: rng.range(DHAKA_BOUNDS.minLng, DHAKA_BOUNDS.maxLng),
      capacity,
      currentLevel,
      minLevel: Math.floor(capacity * 0.1), // 10% safety level
      status,
      timeWindow: {
        start: windowStart,
        end: windowStart + windowDuration
      },
      assigned: false,
      assignedDistributor: null,
      assignedTime: null
    });
  }
  
  return stations;
}

/**
 * Generate random distributors
 */
export function generateDistributors(count, vehicleType, seed = 42) {
  const rng = new SeededRandom(seed + 1000);
  const distributors = [];
  
  const vehicleRanges = {
    truck: 400,
    van: 250,
    motorbike: 80
  };
  
  const vehicleConsumption = {
    truck: 0.3, // L/km
    van: 0.15,
    motorbike: 0.05
  };
  
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#06b6d4', '#84cc16'
  ];
  
  for (let i = 0; i < count; i++) {
    const fleetSize = rng.int(2, 5);
    const vehicles = [];
    
    for (let j = 0; j < fleetSize; j++) {
      vehicles.push({
        id: `vehicle-${i + 1}-${j + 1}`,
        type: vehicleType,
        range: vehicleRanges[vehicleType],
        consumption: vehicleConsumption[vehicleType],
        currentFuel: rng.int(75, 100) // percentage
      });
    }
    
    distributors.push({
      id: `distributor-${i + 1}`,
      name: `Distributor ${i + 1}`,
      depotLat: rng.range(DHAKA_BOUNDS.minLat, DHAKA_BOUNDS.maxLat),
      depotLng: rng.range(DHAKA_BOUNDS.minLng, DHAKA_BOUNDS.maxLng),
      quota: rng.int(15000, 45000), // liters per day
      vehicles,
      color: colors[i % colors.length],
      assignedStations: []
    });
  }
  
  return distributors;
}

/**
 * Apply rush scenario - reduces all time windows by 50%
 */
export function applyRushScenario(stations) {
  return stations.map(station => ({
    ...station,
    timeWindow: {
      start: Math.floor(station.timeWindow.start * 0.5),
      end: Math.floor(station.timeWindow.end * 0.5)
    }
  }));
}
