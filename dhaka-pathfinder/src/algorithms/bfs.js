/**
 * Breadth-First Search (unweighted).
 * Treats all edges equally (cost = 1).
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - ignored for BFS
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

  // Calculate total cost (count edges)
  const totalCost = path.length > 0 ? path.length - 1 : 0;

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
