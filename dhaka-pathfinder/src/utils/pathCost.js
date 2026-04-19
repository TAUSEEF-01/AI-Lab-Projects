/**
 * Sum edge costs along a node path using the given cost function.
 */
export function computePathCost(graph, path, costFn) {
  const { nodes, adjacency } = graph;
  if (!path || path.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const fromNode = nodes.get(path[i]);
    const toNode = nodes.get(path[i + 1]);
    const edge = (adjacency.get(path[i]) || []).find((e) => e.neighbor === path[i + 1]);
    if (fromNode && toNode && edge) {
      sum += costFn(fromNode, toNode, edge);
    }
  }
  return sum;
}
