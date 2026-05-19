import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { REGION_BOUNDS } from '../utils/dataGenerator';

export default function MapView({ stations, distributors, assignment, animationStep, theme, region = 'dhaka', editMode, onMapClick, onEntityClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    try {
      const initialRegion = REGION_BOUNDS[region] || REGION_BOUNDS.dhaka;
      
      // Create map centered on initial region
      const map = L.map(mapRef.current, {
        zoomControl: false // Move zoom control later or use custom styled leaflet zoom
      }).setView(initialRegion.center, initialRegion.zoom);
      
      // Add custom zoom controls at top-right
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
      
      // Get tile layer URL based on initial theme
      const initialUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      // Add CartoDB tiles
      const tileLayer = L.tileLayer(initialUrl, {
        attribution: '© CartoDB / © OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle dynamic theme-based tile changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const url = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(url);
  }, [theme]);
  
  // Handle region changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const currentRegion = REGION_BOUNDS[region] || REGION_BOUNDS.dhaka;
    mapInstanceRef.current.setView(currentRegion.center, currentRegion.zoom, { animate: true, duration: 1 });
  }, [region]);
  
  // Handle map clicks in edit mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const handleMapClick = (e) => {
      if (editMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    
    if (editMode) {
      mapInstanceRef.current.on('click', handleMapClick);
      mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
    } else {
      mapInstanceRef.current.off('click', handleMapClick);
      mapInstanceRef.current.getContainer().style.cursor = '';
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
        mapInstanceRef.current.getContainer().style.cursor = '';
      }
    };
  }, [editMode, onMapClick]);
  
  // Update markers and routes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!stations || !distributors) return;
    
    try {
      const map = mapInstanceRef.current;
      
      // Clear existing markers and routes
      markersRef.current.forEach(marker => marker.remove());
      routesRef.current.forEach(route => route.remove());
      markersRef.current = [];
      routesRef.current = [];
    
    // Add fuel station markers
    stations.forEach(station => {
      const color = station.status === 'critical' ? '#f43f5e' :
                    station.status === 'low' ? '#f59e0b' : '#10b981';
      
      const isAssigned = assignment && assignment[station.id];
      const opacity = isAssigned ? 1.0 : 0.65;
      
      // Halo Ring effect for Critical or Low stations
      if (station.status === 'critical' || station.status === 'low') {
        const halo = L.circleMarker([station.lat, station.lng], {
          radius: 15,
          fillColor: color,
          color: 'transparent',
          fillOpacity: 0.18,
          interactive: false
        }).addTo(map);
        markersRef.current.push(halo);
      }
      
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 7.5,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: opacity,
        fillOpacity: opacity,
        className: editMode ? 'cursor-pointer hover:stroke-indigo-500 hover:stroke-[3px] transition-all' : ''
      }).addTo(map);
      
      if (editMode) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onEntityClick) onEntityClick('station', station.id);
        });
      } else {
        // Popup with station details using responsive CSS variables
        const levelPercent = ((station.currentLevel / station.capacity) * 100).toFixed(1);
        let popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; line-height: 1.5; color: var(--text-secondary); padding: 2px;">
            <div style="font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 13px; margin-bottom: 6px; border-b: 1px solid var(--glass-border); padding-bottom: 4px; color: var(--text-primary);">
              📍 ${station.name}
            </div>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <div>Status: <span style="color: ${color}; font-weight: bold; text-transform: uppercase;">${station.status}</span></div>
              <div>Fuel Level: <span style="font-weight: bold; font-family: 'Space Grotesk'; color: var(--text-primary);">${station.currentLevel}L</span> / ${station.capacity}L (${levelPercent}%)</div>
              <div>Time Window: <span style="font-weight: bold; font-family: 'Space Grotesk'; color: var(--text-primary);">${station.timeWindow.start}h - ${station.timeWindow.end}h</span></div>
            </div>
        `;
        
        if (isAssigned) {
          const dist = distributors.find(d => d.id === assignment[station.id].distributorId);
          popupContent += `
            <div style="margin-top: 10px; padding-top: 8px; border-t: 1px dashed var(--glass-border);">
              <div style="font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: ${dist.color}; margin-bottom: 4px;">🚚 Delivery Assigned</div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div>Depot: <span style="font-weight: 600; color: var(--text-primary);">${dist.name}</span></div>
                <div>ETA Hour: <span style="font-weight: 600; font-family: 'Space Grotesk'; color: var(--text-primary);">${assignment[station.id].time}h</span></div>
                <div>Load Qty: <span style="font-weight: 600; font-family: 'Space Grotesk'; color: var(--text-primary);">${assignment[station.id].fuelAmount}L</span></div>
              </div>
            </div>
          `;
        }
        
        popupContent += '</div>';
        marker.bindPopup(popupContent);
      }
      
      markersRef.current.push(marker);
    });
    
    // Add distributor depot markers
    distributors.forEach(distributor => {
      const icon = L.divIcon({
        className: `custom-depot-marker ${editMode ? 'hover:scale-110 transition-transform cursor-pointer' : ''}`,
        html: `<div style="
          background-color: ${distributor.color};
          width: 14px;
          height: 14px;
          border-radius: 4px;
          border: 2px solid white;
          box-shadow: 0 0 10px ${distributor.color};
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      
      const marker = L.marker([distributor.depotLat, distributor.depotLng], {
        icon
      }).addTo(map);
      
      if (editMode) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onEntityClick) onEntityClick('distributor', distributor.id);
        });
      } else {
        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; line-height: 1.5; color: var(--text-secondary); padding: 2px;">
            <div style="font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 13px; margin-bottom: 6px; border-b: 1px solid var(--glass-border); padding-bottom: 4px; color: ${distributor.color};">
              🏢 ${distributor.name} Depot
            </div>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <div>Active Fleet: <span style="font-weight: bold; color: var(--text-primary);">${distributor.vehicles.length} Trucks</span></div>
              <div>Daily Quota: <span style="font-weight: bold; font-family: 'Space Grotesk'; color: var(--text-primary);">${distributor.quota}L/day</span></div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
      }
      
      markersRef.current.push(marker);
    });
    
    // Draw routes if assignment exists
    if (assignment) {
      Object.entries(assignment).forEach(([stationId, assignmentData]) => {
        const station = stations.find(s => s.id === stationId);
        const distributor = distributors.find(d => d.id === assignmentData.distributorId);
        
        if (station && distributor) {
          // Add Polyline with cyber march animation class
          const route = L.polyline(
            [
              [distributor.depotLat, distributor.depotLng],
              [station.lat, station.lng]
            ],
            {
              color: distributor.color,
              weight: 3.5,
              opacity: 0.85,
              className: 'route-flow',
              dashArray: '6, 12'
            }
          ).addTo(map);
          
          routesRef.current.push(route);
        }
      });
    }
    
    } catch (error) {
      console.error('Error updating map:', error);
    }
    
  }, [stations, distributors, assignment, animationStep, editMode, onEntityClick]);
  
  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl" />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-2xl text-xs text-slate-700 dark:text-slate-200 min-w-44 z-[1000] transition-colors duration-300">
        <div className="font-bold mb-3 tracking-wider text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono border-b border-slate-250 dark:border-slate-900 pb-1.5 flex items-center gap-1.5 transition-colors duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Logistic Legend
        </div>
        <div className="space-y-2 font-medium">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
            </span>
            <span>Adequate Fuel (&gt;50%)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f59e0b]"></span>
            </span>
            <span>Low Fuel (20%-50%)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f43f5e]"></span>
            </span>
            <span>Critical Fuel (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2.5 border-t border-slate-200 dark:border-slate-900 pt-2 mt-2 transition-colors duration-300">
            <div className="w-3.5 h-3.5 bg-indigo-500/25 border border-indigo-400/40 rounded flex items-center justify-center font-bold text-[8px] text-indigo-650 dark:text-indigo-300 font-mono shadow-[0_0_10px_rgba(99,102,241,0.15)] transition-colors duration-300">
              D
            </div>
            <span>Distributor Depot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
