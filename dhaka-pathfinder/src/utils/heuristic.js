/**
 * Multi-factor heuristic cost function.
 * Computes edge cost based on distance, traffic, road type, vehicle, security, time, and events.
 */

// Traffic level multipliers
const TRAFFIC_MULTIPLIERS = {
  low: 1.0,
  medium: 1.5,
  high: 2.5,
  gridlock: 5.0,
};

// Road type multipliers (inversely proportional to typical speed)
const ROAD_TYPE_MULTIPLIERS = {
  highway: 0.5,
  primary: 0.8,
  secondary: 1.0,
  tertiary: 1.3,
  residential: 1.5,
  service: 2.0,
  footway: 3.0,
};

// Vehicle-specific multipliers per road type
const VEHICLE_MULTIPLIERS = {
  car: {
    highway: 0.5, primary: 0.7, secondary: 1.0, tertiary: 1.2,
    residential: 1.5, service: 2.0, footway: 10.0,
  },
  bike: {
    highway: 3.0, primary: 1.5, secondary: 1.0, tertiary: 0.8,
    residential: 0.6, service: 0.7, footway: 1.5,
  },
  rickshaw: {
    highway: 5.0, primary: 2.0, secondary: 1.2, tertiary: 0.8,
    residential: 0.6, service: 0.5, footway: 2.0,
  },
  bus: {
    highway: 0.4, primary: 0.6, secondary: 0.9, tertiary: 1.5,
    residential: 2.5, service: 4.0, footway: 10.0,
  },
};

// Security risk multipliers
const SECURITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.5,
  high: 2.5,
};

// City center bounding box for occasion events
const CITY_CENTER_BBOX = [23.725, 90.395, 23.755, 90.425];

/**
 * Check if a time represents rush hour.
 * Rush hours: 8-10am and 5-8pm.
 */
function isRushHour(hour) {
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
}

/**
 * Check if a node is in the city center.
 */
function isInCityCenter(lat, lng) {
  const [s, w, n, e] = CITY_CENTER_BBOX;
  return lat >= s && lat <= n && lng >= w && lng <= e;
}

/**
 * Default weight configuration.
 */
export const DEFAULT_WEIGHTS = {
  distance: 1.0,
  traffic: 1.0,
  roadType: 1.0,
  vehicle: 1.0,
  security: 1.0,
  timeOfDay: 1.0,
  occasion: 1.0,
};

/**
 * Default settings.
 */
export const DEFAULT_SETTINGS = {
  vehicleType: 'car',
  timeOfDay: 12, // 24hr format
  occasionActive: false,
};

/**
 * Create a cost function with the given weights and settings.
 * Returns: (fromNode, toNode, edge) => cost
 */
export function createCostFunction(weights, settings) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const s = { ...DEFAULT_SETTINGS, ...settings };

  return (fromNode, toNode, edge) => {
    // Base distance
    const baseDist = edge.distance;

    // Traffic
    const trafficBase = TRAFFIC_MULTIPLIERS[edge.trafficLevel] || 1.0;
    const trafficFactor = Math.pow(trafficBase, w.traffic);

    // Road type
    const roadTypeBase = ROAD_TYPE_MULTIPLIERS[edge.roadType] || 1.0;
    const roadTypeFactor = Math.pow(roadTypeBase, w.roadType);

    // Vehicle
    const vehicleMults = VEHICLE_MULTIPLIERS[s.vehicleType] || VEHICLE_MULTIPLIERS.car;
    const vehicleBase = vehicleMults[edge.roadType] || 1.0;
    const vehicleFactor = Math.pow(vehicleBase, w.vehicle);

    // Security
    const secRisk = toNode.securityRisk || 'low';
    const securityBase = SECURITY_MULTIPLIERS[secRisk] || 1.0;
    const securityFactor = Math.pow(securityBase, w.security);

    // Time of day
    let timeFactor = 1.0;
    if (isRushHour(s.timeOfDay)) {
      timeFactor = Math.pow(2.0, w.timeOfDay);
    }

    // Occasion/event
    let occasionFactor = 1.0;
    if (s.occasionActive) {
      const midLat = (fromNode.lat + toNode.lat) / 2;
      const midLng = (fromNode.lng + toNode.lng) / 2;
      if (isInCityCenter(midLat, midLng)) {
        occasionFactor = Math.pow(3.0, w.occasion);
      }
    }

    // Final cost
    return baseDist * w.distance * trafficFactor * roadTypeFactor *
           vehicleFactor * securityFactor * timeFactor * occasionFactor;
  };
}
