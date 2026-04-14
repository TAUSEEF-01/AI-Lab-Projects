/**
 * OpenStreetMap data fetching via Overpass API with localStorage caching.
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];
// Predefined bounding boxes for Dhaka sub-areas [south, west, north, east]
export const AREAS = {
  dhanmondi: {
    name: 'Dhanmondi',
    bbox: [23.735, 90.370, 23.765, 90.400],
    center: [23.750, 90.385],
  },
  gulshan: {
    name: 'Gulshan',
    bbox: [23.775, 90.405, 23.800, 90.425],
    center: [23.787, 90.415],
  },
  mirpur: {
    name: 'Mirpur',
    bbox: [23.800, 90.350, 23.830, 90.380],
    center: [23.815, 90.365],
  },
  motijheel: {
    name: 'Motijheel',
    bbox: [23.720, 90.405, 23.740, 90.425],
    center: [23.730, 90.415],
  },
  uttara: {
    name: 'Uttara',
    bbox: [23.860, 90.385, 23.885, 90.410],
    center: [23.873, 90.397],
  },
};

/**
 * Build an Overpass QL query for highway data within a bounding box.
 */
function buildQuery(bbox) {
  const [south, west, north, east] = bbox;
  return `
    [out:json][timeout:60];
    (
      way["highway"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;
}

/**
 * Fetch OSM data for the given area key.
 * Caches result in localStorage.
 * Returns { nodes: Map<id, {lat, lng}>, ways: [{id, nodeRefs, tags}] }
 */
export async function fetchOSMData(areaKey) {
  const cacheKey = `osm_cache_${areaKey}`;

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Convert nodes back to Map
      const nodes = new Map(parsed.nodes);
      return { nodes, ways: parsed.ways };
    }
  } catch (e) {
    console.warn('Cache read failed, fetching fresh data:', e);
  }

  const area = AREAS[areaKey];
  if (!area) {
    throw new Error(`Unknown area: ${areaKey}`);
  }

  const query = buildQuery(area.bbox);

  let response = null;
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (response.ok) {
        break; // Success!
      } else {
        lastError = new Error(`Overpass API error: ${response.status} ${response.statusText} on ${endpoint}`);
        console.warn(lastError.message);
      }
    } catch (e) {
      lastError = new Error(`Failed to connect to ${endpoint}: ${e.message}`);
      console.warn(lastError.message);
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error('All Overpass API endpoints failed.');
  }

  const data = await response.json();

  // Parse elements
  const nodes = new Map();
  const ways = [];

  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, { lat: element.lat, lng: element.lon });
    } else if (element.type === 'way') {
      ways.push({
        id: element.id,
        nodeRefs: element.nodes || [],
        tags: element.tags || {},
      });
    }
  }

  // Cache in localStorage
  try {
    const toCache = {
      nodes: Array.from(nodes.entries()),
      ways,
    };
    localStorage.setItem(cacheKey, JSON.stringify(toCache));
  } catch (e) {
    console.warn('Cache write failed (storage full?):', e);
  }

  return { nodes, ways };
}

/**
 * Clear cached data for an area.
 */
export function clearCache(areaKey) {
  if (areaKey) {
    localStorage.removeItem(`osm_cache_${areaKey}`);
  } else {
    // Clear all osm caches
    for (const key of Object.keys(AREAS)) {
      localStorage.removeItem(`osm_cache_${key}`);
    }
  }
}
