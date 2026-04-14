import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Algorithm colors
const ALGORITHM_COLORS = {
  BFS: '#f59e0b',
  DFS: '#ef4444',
  Dijkstra: '#3b82f6',
  'A*': '#10b981',
  'Greedy BFS': '#8b5cf6',
  'Bidirectional BFS': '#ec4899',
  'IDA*': '#06b6d4',
};

export default function MapView({
  graph,
  startNode,
  endNode,
  onNodeClick,
  pendingNode,
  onConfirmNode,
  onCancelNode,
  onChangeLocation,
  results,
  animationSpeed,
  isAnimating,
  setIsAnimating,
  activeArea,
  selectionMode,
  darkMode,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const edgeLayerRef = useRef(null);
  const markersRef = useRef({ start: null, end: null, pending: null });
  const animationLayersRef = useRef([]);
  const animationTimersRef = useRef([]);
  const pathLayersRef = useRef([]);
  const legendRef = useRef(null);

  // Speed mapping: ms per node
  const speedMs = useMemo(() => {
    switch (animationSpeed) {
      case 'slow': return 50;
      case 'medium': return 10;
      case 'fast': return 1;
      default: return 10;
    }
  }, [animationSpeed]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [23.8103, 90.4125],
      zoom: 14,
      zoomControl: false,
    });

    // Add initial tile layer
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Fix for map not fully rendering when container size changes natively
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch tile layer on dark/light mode change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    map.removeLayer(tileLayerRef.current);

    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Move tile layer to bottom
    tileLayerRef.current.bringToBack();
  }, [darkMode]);

  // Handle map clicks for node selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !graph) return;

    const handleClick = (e) => {
      if (!graph.nodes || graph.nodes.size === 0) return;

      const { lat, lng } = e.latlng;

      // Find nearest graph node
      let nearestId = null;
      let minDist = Infinity;

      for (const [nodeId, node] of graph.nodes) {
        const d = Math.pow(node.lat - lat, 2) + Math.pow(node.lng - lng, 2);
        if (d < minDist) {
          minDist = d;
          nearestId = nodeId;
        }
      }

      if (nearestId !== null) {
        onNodeClick(nearestId);
      }
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [graph, onNodeClick]);

  // Center map on active area
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeArea) return;

    map.setView(activeArea.center, 15, { animate: true });
  }, [activeArea]);

  // Draw graph edges
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !graph) return;

    // Remove old edge layer
    if (edgeLayerRef.current) {
      map.removeLayer(edgeLayerRef.current);
    }

    const lines = [];
    const drawnEdges = new Set();

    for (const [nodeId, neighbors] of graph.adjacency) {
      const fromNode = graph.nodes.get(nodeId);
      if (!fromNode) continue;

      for (const edge of neighbors) {
        const edgeKey = [Math.min(nodeId, edge.neighbor), Math.max(nodeId, edge.neighbor)].join('-');
        if (drawnEdges.has(edgeKey)) continue;
        drawnEdges.add(edgeKey);

        const toNode = graph.nodes.get(edge.neighbor);
        if (!toNode) continue;

        lines.push([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]);
      }
    }

    const edgeLayer = L.layerGroup();
    for (const line of lines) {
      L.polyline(line, {
        color: darkMode ? '#334155' : '#cbd5e1',
        weight: 1,
        opacity: 0.5,
      }).addTo(edgeLayer);
    }

    edgeLayer.addTo(map);
    edgeLayerRef.current = edgeLayer;
  }, [graph, darkMode]);

  // Draw start/end markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !graph) return;

    // Remove old markers
    if (markersRef.current.start) {
      map.removeLayer(markersRef.current.start);
      markersRef.current.start = null;
    }
    if (markersRef.current.end) {
      map.removeLayer(markersRef.current.end);
      markersRef.current.end = null;
    }

    if (startNode) {
      const node = graph.nodes.get(startNode);
      if (node) {
        const marker = L.circleMarker([node.lat, node.lng], {
          radius: 10,
          fillColor: '#10b981',
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        
        marker.bindTooltip('START', { permanent: true, direction: 'top', className: 'marker-tooltip start-tooltip' });
        
        // Interactive popup for changing location
        const popupContent = document.createElement('div');
        popupContent.className = 'text-center min-w-[120px] pb-1';
        popupContent.innerHTML = `
          <div class="font-bold text-[10px] mb-2 text-surface-400 tracking-wider">START POINT</div>
          <button class="w-full px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-md text-[11px] font-semibold transition-colors" id="change-start-btn">
            Change Location
          </button>
        `;
        marker.bindPopup(popupContent, { closeButton: false, offset: [0, -5] });
        popupContent.querySelector('#change-start-btn').onclick = () => {
          marker.closePopup();
          if (onChangeLocation) onChangeLocation('start');
        };

        markersRef.current.start = marker;
      }
    }

    if (endNode) {
      const node = graph.nodes.get(endNode);
      if (node) {
        const marker = L.circleMarker([node.lat, node.lng], {
          radius: 10,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        
        marker.bindTooltip('END', { permanent: true, direction: 'top', className: 'marker-tooltip end-tooltip' });

        // Interactive popup for changing location
        const popupContent = document.createElement('div');
        popupContent.className = 'text-center min-w-[120px] pb-1';
        popupContent.innerHTML = `
          <div class="font-bold text-[10px] mb-2 text-surface-400 tracking-wider">END POINT</div>
          <button class="w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-md text-[11px] font-semibold transition-colors" id="change-end-btn">
            Change Location
          </button>
        `;
        marker.bindPopup(popupContent, { closeButton: false, offset: [0, -5] });
        popupContent.querySelector('#change-end-btn').onclick = () => {
          marker.closePopup();
          if (onChangeLocation) onChangeLocation('end');
        };

        markersRef.current.end = marker;
      }
    }
  }, [startNode, endNode, graph, onChangeLocation]);

  // Draw pending node marker (pulsing yellow)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !graph) return;

    // Remove old pending marker
    if (markersRef.current.pending) {
      map.removeLayer(markersRef.current.pending);
      markersRef.current.pending = null;
    }

    if (pendingNode) {
      const node = graph.nodes.get(pendingNode);
      if (node) {
        const marker = L.circleMarker([node.lat, node.lng], {
          radius: 12,
          fillColor: '#fbbf24',
          color: '#fbbf24',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.4,
          className: 'pending-marker-pulse',
        }).addTo(map);
        marker.bindTooltip('?', { permanent: true, direction: 'top', className: 'marker-tooltip pending-tooltip' });
        markersRef.current.pending = marker;
      }
    }
  }, [pendingNode, graph]);

  // Clear previous animations and paths
  const clearAnimations = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear timers
    for (const timer of animationTimersRef.current) {
      clearTimeout(timer);
    }
    animationTimersRef.current = [];

    // Clear animation layers
    for (const layer of animationLayersRef.current) {
      map.removeLayer(layer);
    }
    animationLayersRef.current = [];

    // Clear path layers
    for (const layer of pathLayersRef.current) {
      map.removeLayer(layer);
    }
    pathLayersRef.current = [];

    // Clear legend
    if (legendRef.current) {
      map.removeControl(legendRef.current);
      legendRef.current = null;
    }
  }, []);

  // Animate results
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !graph || !results) return;

    clearAnimations();

    if (results.length === 0) return;

    const algorithmEntries = results.filter(r => r.path.length > 0 || r.visitedOrder.length > 0);
    if (algorithmEntries.length === 0) {
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);

    let totalDelay = 0;

    algorithmEntries.forEach((result, algIdx) => {
      const color = ALGORITHM_COLORS[result.algorithm] || '#ffffff';
      const visitedGroup = L.layerGroup().addTo(map);
      animationLayersRef.current.push(visitedGroup);

      // Animate visited nodes
      const visited = result.visitedOrder || [];
      // Cap animation at 2000 nodes for performance
      const maxAnimate = Math.min(visited.length, 2000);
      const step = Math.max(1, Math.floor(visited.length / maxAnimate));

      for (let i = 0; i < visited.length; i += step) {
        const nodeId = visited[i];
        const node = graph.nodes.get(nodeId);
        if (!node) continue;

        const timer = setTimeout(() => {
          L.circleMarker([node.lat, node.lng], {
            radius: 3,
            fillColor: '#fbbf24',
            color: '#fbbf24',
            weight: 0,
            fillOpacity: 0.5,
          }).addTo(visitedGroup);
        }, totalDelay + (i / step) * speedMs);

        animationTimersRef.current.push(timer);
      }

      const visitAnimDuration = (maxAnimate) * speedMs;

      // Draw final path after visited animation
      const pathTimer = setTimeout(() => {
        if (result.path.length > 1) {
          const pathCoords = result.path
            .map(id => graph.nodes.get(id))
            .filter(Boolean)
            .map(n => [n.lat, n.lng]);

          const pathLine = L.polyline(pathCoords, {
            color: color,
            weight: 5,
            opacity: 0.9,
            dashArray: null,
          }).addTo(map);

          pathLayersRef.current.push(pathLine);
        }

        // If last algorithm, finish animation
        if (algIdx === algorithmEntries.length - 1) {
          setTimeout(() => setIsAnimating(false), 200);
        }
      }, totalDelay + visitAnimDuration + 300);

      animationTimersRef.current.push(pathTimer);
      totalDelay += visitAnimDuration + 500;
    });

    // Add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = '<h4>Algorithms</h4>';
      for (const result of algorithmEntries) {
        const color = ALGORITHM_COLORS[result.algorithm] || '#ffffff';
        div.innerHTML += `<div class="legend-item"><span class="legend-color" style="background:${color}"></span>${result.algorithm}</div>`;
      }
      return div;
    };
    legend.addTo(map);
    legendRef.current = legend;

  }, [results, graph, speedMs, clearAnimations, setIsAnimating]);

  // Expose clearAnimations via a public-facing effect
  useEffect(() => {
    return () => clearAnimations();
  }, [clearAnimations]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" id="map-container" />

      {/* Selection mode indicator — only when no pending node */}
      {graph && selectionMode !== 'done' && !pendingNode && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-xl px-5 py-3 border backdrop-blur-md shadow-lg
          ${selectionMode === 'start'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${selectionMode === 'start' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div>
              <div className="text-sm font-semibold">
                {selectionMode === 'start' ? '📍 Click to set START point' : '🎯 Click to set END point'}
              </div>
              <div className="text-[10px] opacity-70">
                {selectionMode === 'start' ? 'Select any point on the road network' : 'Select destination on the road network'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation popup for pending node */}
      {pendingNode && graph && (() => {
        const node = graph.nodes.get(pendingNode);
        if (!node) return null;
        return (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
            <div className={`rounded-xl overflow-hidden border shadow-2xl backdrop-blur-xl
              ${selectionMode === 'start'
                ? 'bg-surface-900/95 border-emerald-500/40'
                : 'bg-surface-900/95 border-red-500/40'
              }`}
            >
              <div className="px-4 py-3">
                <div className="text-xs text-surface-400 mb-1">
                  {selectionMode === 'start' ? '📍 Set as START point?' : '🎯 Set as END point?'}
                </div>
                <div className="text-[10px] text-surface-500 font-mono mb-3">
                  Node #{pendingNode} • ({node.lat.toFixed(5)}, {node.lng.toFixed(5)})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onConfirmNode}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02]
                      ${selectionMode === 'start'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/30 hover:shadow-lg'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30 hover:shadow-lg'
                      }`}
                    id="confirm-node-btn"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={onCancelNode}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-surface-400 bg-surface-800 border border-surface-700/50
                      hover:text-surface-200 hover:bg-surface-700 transition-all"
                    id="cancel-node-btn"
                  >
                    ✗ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating info */}
      {graph && (
        <div className={`absolute top-3 left-3 z-[1000] backdrop-blur-md rounded-lg px-3 py-2 text-xs border
          ${darkMode ? 'bg-surface-900/80 text-surface-300 border-surface-700/50' : 'bg-white/80 text-gray-700 border-gray-200'}`}
        >
          <span className="text-accent-cyan font-medium">{graph.nodes.size.toLocaleString()}</span> nodes · <span className="text-accent-violet font-medium">{graph.edges.length.toLocaleString()}</span> edges
        </div>
      )}

      {isAnimating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-accent-amber/20 backdrop-blur-md rounded-full px-4 py-1.5 text-xs text-accent-amber border border-accent-amber/30 animate-pulse-glow">
          ⚡ Animating...
        </div>
      )}
    </div>
  );
}
