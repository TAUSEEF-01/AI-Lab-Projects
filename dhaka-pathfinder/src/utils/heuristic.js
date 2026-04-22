/**
 * Multi-factor heuristic cost function.
 * Computes edge cost based on distance, traffic, road type, vehicle, security, time, and events.
 */

import { haversine } from './haversine';

// Traffic level multipliers (exported for synthetic dataset + cost-aware heuristic)
export const TRAFFIC_MULTIPLIERS = {
  low: 1.0,
  medium: 1.5,
  high: 2.5,
  gridlock: 5.0,
};

// Road type multipliers (inversely proportional to typical speed)
export const ROAD_TYPE_MULTIPLIERS = {
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
export const SECURITY_MULTIPLIERS = {
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
  gender: 'neutral', // 'neutral' or 'female'
};

/**
 * Create a cost function with the given weights and settings.
 * Returns: (fromNode, toNode, edge) => cost
 */
export function createCostFunction(weights, settings) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const s = { ...DEFAULT_SETTINGS, ...settings };

  return (fromNode, toNode, edge) => {
    // If the edge has synthetic data properties (from syntheticDataset.js)
    if (edge.timeCost != null) {
      const timeCost = edge.timeCost * w.distance;
      
      // Calculate dynamic penalties using the weights
      const trafficDelay = edge.traffic_level * 0.1 * timeCost * w.traffic;
      let safetyPenalty = (10 - edge.safety_level) * 0.05 * timeCost * w.security;
      let riskPenalty = edge.risk_level * 0.05 * timeCost * w.security;
      
      // Gender factor for female passengers
      const isLateNight = s.timeOfDay >= 18 || s.timeOfDay <= 6; // 6 PM to 6 AM
      if (s.gender === 'female') {
        if (isLateNight) {
          // Extremely high-risk roads are simply unavailable at night
          if (edge.risk_level >= 7 || edge.safety_level <= 4) {
            return Infinity;
          }
          // Significantly amplify risk and safety penalties dynamically for the rest
          riskPenalty *= 5.0;
          safetyPenalty *= 5.0;
        } else {
          // Even during the day, add a slight cautious multiplier
          riskPenalty *= 1.5;
          safetyPenalty *= 1.5;
        }
      }
      
      return timeCost + trafficDelay + safetyPenalty + riskPenalty;
    }

    // Fallback if synthetic attributes are missing
    const baseDist = edge.distance;

    const trafficBase = TRAFFIC_MULTIPLIERS[edge.trafficLevel || 'medium'] || 1.0;
    const trafficFactor = Math.pow(trafficBase, w.traffic);

    const roadTypeBase = ROAD_TYPE_MULTIPLIERS[edge.roadType] || 1.0;
    const roadTypeFactor = Math.pow(roadTypeBase, w.roadType);

    const vehicleMults = VEHICLE_MULTIPLIERS[s.vehicleType] || VEHICLE_MULTIPLIERS.car;
    const vehicleBase = vehicleMults[edge.roadType] || 1.0;
    const vehicleFactor = Math.pow(vehicleBase, w.vehicle);

    const secRisk = toNode.securityRisk || 'low';
    let securityBase = SECURITY_MULTIPLIERS[secRisk] || 1.0;

    // Apply manual penalty for females in fallback calculator
    const isLateNight = s.timeOfDay >= 18 || s.timeOfDay <= 6;
    if (s.gender === 'female') {
        if (isLateNight) {
            if (secRisk === 'high') {
                return Infinity; // Totally unavailable
            }
            if (secRisk === 'medium') {
                securityBase *= 5.0;
            }
        } else {
            securityBase *= 1.5;
        }
    }

    const securityFactor = Math.pow(securityBase, w.security);

    let timeFactor = 1.0;
    if (isRushHour(s.timeOfDay)) {
      timeFactor = Math.pow(2.0, w.timeOfDay);
    }

    let occasionFactor = 1.0;
    if (s.occasionActive) {
      const midLat = (fromNode.lat + toNode.lat) / 2;
      const midLng = (fromNode.lng + toNode.lng) / 2;
      if (isInCityCenter(midLat, midLng)) {
        occasionFactor = Math.pow(3.0, w.occasion);
      }
    }

    return baseDist * w.distance * trafficFactor * roadTypeFactor *
           vehicleFactor * securityFactor * timeFactor * occasionFactor;
  };
}

/**
 * Weights for the cost-aware heuristic (same keys as DEFAULT_WEIGHTS for one set of sliders).
 * Each weight scales how strongly that factor influences h(n) relative to synthetic cost/km stats.
 */
export const DEFAULT_HEURISTIC_WEIGHTS = { ...DEFAULT_WEIGHTS };

/**
 * Heuristic informed by per-edge synthetic costs and local node metadata.
 * Falls back to plain Haversine km if the graph has no syntheticStats (e.g. tests).
 *
 * @param {Object} graph - { nodes, syntheticStats?, heuristicNodeMeta? }
 * @param {number} endId
 * @param {Record<string, number>} heuristicWeights - overrides for heuristic-only weights
 * @param {Record<string, unknown>} settings - live rush hour / occasion for h only
 * @returns {(nodeId: number) => number}
 */
export function createHeuristic(graph, endId, heuristicWeights, settings) {
  const endNode = graph.nodes.get(endId);
  if (!endNode) {
    return () => 0;
  }

  const stats = graph.syntheticStats;

  if (!stats || stats.edgeCount === 0) {
    return (nodeId) => {
      const node = graph.nodes.get(nodeId);
      if (!node) return 0;
      return haversine(node.lat, node.lng, endNode.lat, endNode.lng);
    };
  }

  const hw = { ...DEFAULT_HEURISTIC_WEIGHTS, ...heuristicWeights };
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const minR = stats.minCostPerKm;

  return (nodeId) => {
    if (nodeId === endId) return 0;
    const node = graph.nodes.get(nodeId);
    if (!node) return 0;

    const dKm = haversine(node.lat, node.lng, endNode.lat, endNode.lng);

    // Dynamic heuristic dependent on weights
    // Uses distance as base, adjusted if the user changes global weights
    let h = dKm * minR * hw.distance;

    // Apply baseline penalties purely to slightly adjust heuristic based on endNode
    const secN = SECURITY_MULTIPLIERS[node.securityRisk] || 1;
    const secG = SECURITY_MULTIPLIERS[endNode.securityRisk] || 1;
    h += dKm * minR * hw.security * Math.max(0, secN / secG - 1) * 0.4;

    if (isRushHour(s.timeOfDay)) {
      h += dKm * minR * hw.timeOfDay * 0.22;
    }

    if (s.occasionActive) {
      const midLat = (node.lat + endNode.lat) / 2;
      const midLng = (node.lng + endNode.lng) / 2;
      if (isInCityCenter(midLat, midLng)) {
        h += dKm * minR * hw.occasion * 0.38;
      }
    }

    return Math.max(0, h);
  };
}
