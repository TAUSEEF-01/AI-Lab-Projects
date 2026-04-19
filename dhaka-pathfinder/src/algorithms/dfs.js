/**
 * Depth-First Search (unweighted expansion).
 * Iterative implementation using a stack; path cost from costFn along the found route.
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
  const stack = [startId];
  parent.set(startId, null);
  const visitedOrder = [];
  let found = false;

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    if (current === endId) {
      found = true;
      break;
    }

    const neighbors = adjacency.get(current) || [];
    // Reverse to maintain a consistent order
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const edge = neighbors[i];
      if (!visited.has(edge.neighbor)) {
        parent.set(edge.neighbor, current);
        stack.push(edge.neighbor);
      }
    }
  }

  // Reconstruct path
  const path = [];
  if (found) {
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
