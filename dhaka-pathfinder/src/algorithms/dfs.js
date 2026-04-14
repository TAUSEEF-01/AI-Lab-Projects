/**
 * Depth-First Search (unweighted).
 * Iterative implementation using a stack.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - ignored for DFS
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
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

  const totalCost = path.length > 0 ? path.length - 1 : 0;

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
