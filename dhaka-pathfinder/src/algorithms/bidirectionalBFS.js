/**
 * Bidirectional BFS.
 * Runs BFS simultaneously from start and end, meeting in the middle.
 * @param {Object} graph - { adjacency: Map, nodes: Map }
 * @param {number} startId
 * @param {number} endId
 * @param {Function} costFn - used to sum synthetic / weighted cost along the stitched path
 * @returns {{ path: number[], visitedOrder: number[], totalCost: number, timeTaken: number }}
 */
import { computePathCost } from '../utils/pathCost';

export function runAlgorithm(graph, startId, endId, costFn) {
  const start = performance.now();
  const { adjacency } = graph;

  if (!adjacency.has(startId) || !adjacency.has(endId)) {
    return { path: [], visitedOrder: [], totalCost: 0, timeTaken: performance.now() - start };
  }

  if (startId === endId) {
    return {
      path: [startId],
      visitedOrder: [startId],
      totalCost: 0,
      timeTaken: performance.now() - start,
    };
  }

  // Forward BFS state
  const visitedF = new Map(); // nodeId → parent
  const queueF = [startId];
  visitedF.set(startId, null);

  // Backward BFS state
  const visitedB = new Map(); // nodeId → parent (toward end)
  const queueB = [endId];
  visitedB.set(endId, null);

  const visitedOrder = [];
  let meetingNode = null;

  while (queueF.length > 0 || queueB.length > 0) {
    // Forward step
    if (queueF.length > 0) {
      const levelSize = queueF.length;
      for (let i = 0; i < levelSize; i++) {
        const current = queueF.shift();
        visitedOrder.push(current);

        if (visitedB.has(current)) {
          meetingNode = current;
          break;
        }

        const neighbors = adjacency.get(current) || [];
        for (const edge of neighbors) {
          if (!visitedF.has(edge.neighbor)) {
            visitedF.set(edge.neighbor, current);
            queueF.push(edge.neighbor);
          }
        }
      }
      if (meetingNode) break;
    }

    // Backward step
    if (queueB.length > 0) {
      const levelSize = queueB.length;
      for (let i = 0; i < levelSize; i++) {
        const current = queueB.shift();
        visitedOrder.push(current);

        if (visitedF.has(current)) {
          meetingNode = current;
          break;
        }

        const neighbors = adjacency.get(current) || [];
        for (const edge of neighbors) {
          if (!visitedB.has(edge.neighbor)) {
            visitedB.set(edge.neighbor, current);
            queueB.push(edge.neighbor);
          }
        }
      }
      if (meetingNode) break;
    }
  }

  // Reconstruct path
  const path = [];
  if (meetingNode !== null) {
    // Forward path: start → meeting
    const forwardPath = [];
    let node = meetingNode;
    while (node !== null) {
      forwardPath.unshift(node);
      node = visitedF.get(node);
    }

    // Backward path: meeting → end
    node = visitedB.get(meetingNode);
    while (node !== null) {
      forwardPath.push(node);
      node = visitedB.get(node);
    }

    path.push(...forwardPath);
  }

  const totalCost = computePathCost(graph, path, costFn);

  return {
    path,
    visitedOrder,
    totalCost,
    timeTaken: performance.now() - start,
  };
}
