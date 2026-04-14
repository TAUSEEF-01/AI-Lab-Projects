/**
 * IDA* (Iterative Deepening A*).
 * Uses iterative deepening with f-cost threshold.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - (fromNode, toNode, edge) => cost
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { haversine } from '../utils/haversine';

export function runAlgorithm(graph, startId, endId, costFn) {
  const startTime = performance.now();
  const { adjacency, nodes } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - startTime };
  }

  const endNode = nodes.get(endId);

  function h(nodeId) {
    const node = nodes.get(nodeId);
    return haversine(node.lat, node.lng, endNode.lat, endNode.lng);
  }

  const visitedOrder = [];
  const MAX_ITERATIONS = 500000; // Safety limit
  let iterations = 0;

  function search(path, g, threshold) {
    const current = path[path.length - 1];
    const f = g + h(current);

    if (f > threshold) return { found: false, threshold: f };
    
    iterations++;
    if (iterations > MAX_ITERATIONS) return { found: false, threshold: Infinity };

    visitedOrder.push(current);

    if (current === endId) return { found: true, threshold: f, cost: g };

    let minThreshold = Infinity;
    const neighbors = adjacency.get(current) || [];
    const currentNode = nodes.get(current);

    for (const edge of neighbors) {
      if (path.includes(edge.neighbor)) continue; // Avoid cycles

      const neighborNode = nodes.get(edge.neighbor);
      const edgeCost = costFn(currentNode, neighborNode, edge);

      path.push(edge.neighbor);
      const result = search(path, g + edgeCost, threshold);

      if (result.found) return result;
      if (result.threshold < minThreshold) minThreshold = result.threshold;

      path.pop();
    }

    return { found: false, threshold: minThreshold };
  }

  let threshold = h(startId);
  const pathStack = [startId];
  let finalResult = null;

  // Use Set for faster cycle detection
  const MAX_DEPTH_ITERS = 100;
  let depthIter = 0;

  while (depthIter < MAX_DEPTH_ITERS && iterations < MAX_ITERATIONS) {
    depthIter++;
    const result = search(pathStack, 0, threshold);

    if (result.found) {
      finalResult = { path: [...pathStack], totalCost: result.cost };
      break;
    }

    if (result.threshold === Infinity) break;
    threshold = result.threshold;
  }

  if (finalResult) {
    return {
      path: finalResult.path,
      visitedOrder,
      totalCost: finalResult.totalCost,
      timeTaken: performance.now() - startTime,
    };
  }

  return {
    path: [],
    visitedOrder,
    totalCost: 0,
    timeTaken: performance.now() - startTime,
  };
}
