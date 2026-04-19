/**
 * Greedy Best-First Search.
 * Uses only heuristic (haversine distance to goal) — no accumulated cost.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - used only for total cost calculation, not for search priority
 * @param {function(number): number} [heuristicFn] - optional h(n); defaults to Haversine km to goal
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { MinHeap } from './minHeap';
import { haversine } from '../utils/haversine';

export function runAlgorithm(graph, startId, endId, costFn, heuristicFn) {
  const start = performance.now();
  const { adjacency, nodes } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - start };
  }

  const endNode = nodes.get(endId);

  function h(nodeId) {
    if (heuristicFn) return heuristicFn(nodeId);
    const node = nodes.get(nodeId);
    return haversine(node.lat, node.lng, endNode.lat, endNode.lng);
  }

  const visited = new Set();
  const parent = new Map();
  const visitedOrder = [];

  const heap = new MinHeap((a, b) => a.priority - b.priority);

  parent.set(startId, null);
  heap.push({ nodeId: startId, priority: h(startId) });

  while (!heap.isEmpty()) {
    const { nodeId: current } = heap.pop();

    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    if (current === endId) break;

    const neighbors = adjacency.get(current) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.neighbor)) {
        if (!parent.has(edge.neighbor)) {
          parent.set(edge.neighbor, current);
        }
        heap.push({ nodeId: edge.neighbor, priority: h(edge.neighbor) });
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

  // Calculate total cost along the path using costFn
  let totalCost = 0;
  if (path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = nodes.get(path[i]);
      const toNode = nodes.get(path[i + 1]);
      const edges = adjacency.get(path[i]) || [];
      const edge = edges.find(e => e.neighbor === path[i + 1]);
      if (edge) {
        totalCost += costFn(fromNode, toNode, edge);
      }
    }
  }

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
