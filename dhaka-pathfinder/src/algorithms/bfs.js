/**
 * Breadth-First Search (unweighted expansion).
 * Minimizes hop count; path cost is summed using costFn (e.g. synthetic edge costs).
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - used to sum synthetic / weighted cost along the found path
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { computePathCost } from '../utils/pathCost';

export function runAlgorithm(graph, startId, endId, costFn) {
  const start = performance.now();
  const { adjacency } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - start };
  }

  const visited = new Set();
  const parent = new Map();
  const queue = [startId];
  visited.add(startId);
  parent.set(startId, null);
  const visitedOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    visitedOrder.push(current);

    if (current === endId) {
      break;
    }

    const neighbors = adjacency.get(current) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.neighbor)) {
        visited.add(edge.neighbor);
        parent.set(edge.neighbor, current);
        queue.push(edge.neighbor);
      }
    }
  }

  // Reconstruct path
  const path = [];
  if (parent.has(endId)) {
    let current = endId;
    while (current !== null) {
      path.unshift(current);
      current = parent.get(current);
    }
  }

  const totalCost = computePathCost(graph, path, costFn);

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
