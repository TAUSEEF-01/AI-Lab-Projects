/**
 * Deterministic synthetic traversal costs for every directed edge.
 * Ground-truth style costs for comparing algorithms; independent of live UI sliders.
 */

import {
  createCostFunction,
  DEFAULT_WEIGHTS,
  DEFAULT_SETTINGS,
  TRAFFIC_MULTIPLIERS,
  ROAD_TYPE_MULTIPLIERS,
} from './heuristic';

/** Fixed reference scenario used only to mint the synthetic dataset. */
export const SYNTHETIC_DATASET_SETTINGS = {
  vehicleType: 'car',
  timeOfDay: 12,
  occasionActive: false,
};

/** Small deterministic perturbation per arc so adjacent edges are not identical. */
function edgeCostJitter(fromId, toId) {
  const x = (fromId * 73856093) ^ (toId * 19349663);
  const u = ((x >>> 0) % 10001) / 10000;
  return 0.92 + u * 0.16;
}

/**
 * Attach syntheticCost to every adjacency edge and build graph-level stats for heuristics.
 * @param {{ adjacency: Map<number, object[]>, nodes: Map<number, object> }} graph
 */
export function attachSyntheticCosts(graph) {
  const { adjacency, nodes } = graph;
  const baseCost = createCostFunction(DEFAULT_WEIGHTS, {
    ...DEFAULT_SETTINGS,
    ...SYNTHETIC_DATASET_SETTINGS,
  });

  let sumCpKm = 0;
  let edgeCount = 0;
  let minCpKm = Infinity;
  let maxCpKm = 0;

  for (const [fromId, outs] of adjacency) {
    const fromNode = nodes.get(fromId);
    if (!fromNode) continue;
    for (const edge of outs) {
      const toNode = nodes.get(edge.neighbor);
      if (!toNode) continue;
      const base = baseCost(fromNode, toNode, edge);
      edge.syntheticCost = base * edgeCostJitter(fromId, edge.neighbor);
      const cpKm = edge.syntheticCost / Math.max(edge.distance, 1e-9);
      sumCpKm += cpKm;
      edgeCount += 1;
      minCpKm = Math.min(minCpKm, cpKm);
      maxCpKm = Math.max(maxCpKm, cpKm);
    }
  }

  if (edgeCount === 0) {
    graph.syntheticStats = { minCostPerKm: 1, maxCostPerKm: 1, avgCostPerKm: 1, edgeCount: 0 };
    graph.heuristicNodeMeta = new Map();
    return;
  }

  const avgCostPerKm = sumCpKm / edgeCount;
  graph.syntheticStats = {
    minCostPerKm: minCpKm,
    maxCostPerKm: maxCpKm,
    avgCostPerKm,
    edgeCount,
  };

  const heuristicNodeMeta = new Map();
  for (const [nodeId, outs] of adjacency) {
    if (outs.length === 0) {
      heuristicNodeMeta.set(nodeId, {
        avgCpKm: avgCostPerKm,
        avgTrafficMult: 1,
        avgRoadMult: 1,
      });
      continue;
    }
    let sumLocal = 0;
    let sumT = 0;
    let sumR = 0;
    for (const e of outs) {
      sumLocal += e.syntheticCost / Math.max(e.distance, 1e-9);
      sumT += TRAFFIC_MULTIPLIERS[e.trafficLevel] || 1;
      sumR += ROAD_TYPE_MULTIPLIERS[e.roadType] || 1;
    }
    const n = outs.length;
    heuristicNodeMeta.set(nodeId, {
      avgCpKm: sumLocal / n,
      avgTrafficMult: sumT / n,
      avgRoadMult: sumR / n,
    });
  }
  graph.heuristicNodeMeta = heuristicNodeMeta;
}
