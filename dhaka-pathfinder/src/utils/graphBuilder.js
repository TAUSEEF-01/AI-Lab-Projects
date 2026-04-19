/**
 * Graph builder: parse OSM data into adjacency list.
 * Merges nodes within 5m and assigns road metadata.
 */

import { haversine, haversineMeters } from './haversine';

// Road type hierarchy with default speed multipliers (higher = slower = more costly)
const ROAD_TYPE_MAP = {
  motorway: 'highway',
  motorway_link: 'highway',
  trunk: 'highway',
  trunk_link: 'highway',
  primary: 'primary',
  primary_link: 'primary',
  secondary: 'secondary',
  secondary_link: 'secondary',
  tertiary: 'tertiary',
  tertiary_link: 'tertiary',
  residential: 'residential',
  living_street: 'residential',
  service: 'service',
  unclassified: 'residential',
  footway: 'footway',
  path: 'footway',
  pedestrian: 'footway',
  cycleway: 'footway',
  track: 'service',
};

// Traffic levels assigned based on road type
const TRAFFIC_BY_ROAD = {
  highway: 'high',
  primary: 'high',
  secondary: 'medium',
  tertiary: 'medium',
  residential: 'low',
  service: 'low',
  footway: 'low',
};

// Security risk zones (defined as bounding boxes with risk levels)
const SECURITY_ZONES = [
  { bbox: [23.72, 90.40, 23.74, 90.43], risk: 'high' },   // Old Dhaka area
  { bbox: [23.74, 90.38, 23.76, 90.40], risk: 'medium' }, // Near railways
];

function deterministicMediumChance(lat, lng, nodeId) {
  const h = Math.sin((lat + 90) * 12.9898 + (lng + 180) * 78.233 + nodeId * 0.001) * 43758.5453;
  const u = h - Math.floor(h);
  return u < 0.1;
}

function getSecurityRisk(lat, lng, nodeId) {
  for (const zone of SECURITY_ZONES) {
    const [s, w, n, e] = zone.bbox;
    if (lat >= s && lat <= n && lng >= w && lng <= e) {
      return zone.risk;
    }
  }
  return deterministicMediumChance(lat, lng, nodeId) ? 'medium' : 'low';
}

/**
 * Build a graph from OSM data.
 * @param {{ nodes: Map, ways: Array }} osmData
 * @returns {{ adjacency: Map, nodes: Map, edges: Array }}
 */
export function buildGraph(osmData) {
  const { nodes: rawNodes, ways } = osmData;

  // Step 1: Identify which nodes are actually used by ways
  const usedNodeIds = new Set();
  for (const way of ways) {
    for (const nodeId of way.nodeRefs) {
      if (rawNodes.has(nodeId)) {
        usedNodeIds.add(nodeId);
      }
    }
  }

  // Step 2: Merge nodes within 5 meters
  const mergeMap = new Map(); // oldId → newId
  const nodeList = [];
  for (const nodeId of usedNodeIds) {
    nodeList.push({ id: nodeId, ...rawNodes.get(nodeId) });
  }

  // Simple quadratic merge for small datasets; for larger, use spatial indexing
  const merged = new Set();
  for (let i = 0; i < nodeList.length; i++) {
    if (merged.has(nodeList[i].id)) continue;
    mergeMap.set(nodeList[i].id, nodeList[i].id);

    for (let j = i + 1; j < nodeList.length; j++) {
      if (merged.has(nodeList[j].id)) continue;
      const dist = haversineMeters(
        nodeList[i].lat, nodeList[i].lng,
        nodeList[j].lat, nodeList[j].lng
      );
      if (dist < 5) {
        mergeMap.set(nodeList[j].id, nodeList[i].id);
        merged.add(nodeList[j].id);
      }
    }
  }

  // Step 3: Build final node map (only non-merged nodes)
  const graphNodes = new Map();
  for (const nodeId of usedNodeIds) {
    if (!merged.has(nodeId)) {
      const data = rawNodes.get(nodeId);
      const securityRisk = getSecurityRisk(data.lat, data.lng, nodeId);
      graphNodes.set(nodeId, { lat: data.lat, lng: data.lng, securityRisk });
    }
  }

  // Step 4: Build adjacency list from ways
  const adjacency = new Map();
  const edges = [];

  // Initialize adjacency for all nodes
  for (const nodeId of graphNodes.keys()) {
    adjacency.set(nodeId, []);
  }

  for (const way of ways) {
    const highwayTag = way.tags.highway || 'residential';
    const roadType = ROAD_TYPE_MAP[highwayTag] || 'residential';
    const trafficLevel = TRAFFIC_BY_ROAD[roadType] || 'medium';
    const isOneway = way.tags.oneway === 'yes';

    const resolvedNodes = way.nodeRefs
      .map(id => mergeMap.get(id) || id)
      .filter(id => graphNodes.has(id));

    // Remove consecutive duplicates
    const dedupNodes = [];
    for (let i = 0; i < resolvedNodes.length; i++) {
      if (i === 0 || resolvedNodes[i] !== resolvedNodes[i - 1]) {
        dedupNodes.push(resolvedNodes[i]);
      }
    }

    for (let i = 0; i < dedupNodes.length - 1; i++) {
      const fromId = dedupNodes[i];
      const toId = dedupNodes[i + 1];
      const fromNode = graphNodes.get(fromId);
      const toNode = graphNodes.get(toId);

      const distance = haversine(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);

      const edgeData = {
        from: fromId,
        to: toId,
        distance,
        roadType,
        trafficLevel,
        highwayTag,
      };

      // Add forward edge
      adjacency.get(fromId).push({ neighbor: toId, ...edgeData });
      edges.push(edgeData);

      // Add reverse edge (unless one-way)
      if (!isOneway) {
        const reverseEdge = { ...edgeData, from: toId, to: fromId };
        adjacency.get(toId).push({ neighbor: fromId, ...reverseEdge });
        edges.push(reverseEdge);
      }
    }
  }

  return { adjacency, nodes: graphNodes, edges };
}
