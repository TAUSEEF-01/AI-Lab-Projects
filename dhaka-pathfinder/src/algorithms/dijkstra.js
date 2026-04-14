/**
 * Dijkstra's Algorithm (Uniform Cost Search).
 * Uses a min-heap with edge costs.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - (fromNode, toNode, edge) => cost
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { MinHeap } from './minHeap';

export function runAlgorithm(graph, startId, endId, costFn) {
  const start = performance.now();
  const { adjacency, nodes } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - start };
  }

  const dist = new Map();
  const parent = new Map();
  const visited = new Set();
  const visitedOrder = [];

  const heap = new MinHeap((a, b) => a.priority - b.priority);

  dist.set(startId, 0);
  parent.set(startId, null);
  heap.push({ nodeId: startId, priority: 0 });

  while (!heap.isEmpty()) {
    const { nodeId: current, priority: currentDist } = heap.pop();

    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    if (current === endId) break;

    const neighbors = adjacency.get(current) || [];
    const currentNode = nodes.get(current);

    for (const edge of neighbors) {
      if (visited.has(edge.neighbor)) continue;

      const neighborNode = nodes.get(edge.neighbor);
      const edgeCost = costFn(currentNode, neighborNode, edge);
      const newDist = currentDist + edgeCost;

      if (!dist.has(edge.neighbor) || newDist < dist.get(edge.neighbor)) {
        dist.set(edge.neighbor, newDist);
        parent.set(edge.neighbor, current);
        heap.push({ nodeId: edge.neighbor, priority: newDist });
      }
    }
  }

  // Reconstruct path
  const path = [];
  if (parent.has(endId) && visited.has(endId)) {
    let current = endId;
    while (current !== null) {
      path.unshift(current);
      current = parent.get(current);
    }
  }

  const totalCost = dist.get(endId) || 0;

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
