/**
 * A* Search Algorithm.
 * f(n) = g(n) + h(n), where h = haversine distance to goal.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - (fromNode, toNode, edge) => cost
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { MinHeap } from './minHeap';
import { haversine } from '../utils/haversine';

export function runAlgorithm(graph, startId, endId, costFn) {
  const start = performance.now();
  const { adjacency, nodes } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - start };
  }

  const endNode = nodes.get(endId);

  // Heuristic: haversine distance to goal
  function h(nodeId) {
    const node = nodes.get(nodeId);
    return haversine(node.lat, node.lng, endNode.lat, endNode.lng);
  }

  const gScore = new Map();
  const fScore = new Map();
  const parent = new Map();
  const visited = new Set();
  const visitedOrder = [];

  const heap = new MinHeap((a, b) => a.priority - b.priority);

  gScore.set(startId, 0);
  fScore.set(startId, h(startId));
  parent.set(startId, null);
  heap.push({ nodeId: startId, priority: fScore.get(startId) });

  while (!heap.isEmpty()) {
    const { nodeId: current } = heap.pop();

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
      const tentativeG = gScore.get(current) + edgeCost;

      if (!gScore.has(edge.neighbor) || tentativeG < gScore.get(edge.neighbor)) {
        gScore.set(edge.neighbor, tentativeG);
        const f = tentativeG + h(edge.neighbor);
        fScore.set(edge.neighbor, f);
        parent.set(edge.neighbor, current);
        heap.push({ nodeId: edge.neighbor, priority: f });
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

  const totalCost = gScore.get(endId) || 0;

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
