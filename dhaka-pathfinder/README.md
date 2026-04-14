# Dhaka Pathfinder 🗺️🚗

**Dhaka Pathfinder** is an interactive, real-world pathfinding visualization tool and analytics dashboard built to test, compare, and simulate classic graph-traversal algorithms across the complex road networks of Dhaka, Bangladesh.

Developed as an Artificial Intelligence Lab project, this application directly fetches OpenStreetMap geometry using the Overpass API, parses it into an interconnected node graph, and deploys 7 different pathfinding algorithms through a dynamic, penalty-weighted heuristic engine to discover the most optimal routes.

## 🚀 Features & Architecture

### 1. Robust Map Data & Parsing Engine
- **Live Overpass API Integration:** Pulls dynamic geographic metadata (roads, highways, alleys) based on user-selected neighborhoods (e.g., Dhanmondi, Gulshan) rather than relying on abstract, hardcoded grids.
- **Resilient Fallback Networking:** Engineered to cycle seamlessly across 3 public independent Overpass servers (`overpass-api.de`, `kumi.systems`, `lz4.overpass-api.de`). This eliminates catastrophic system failures caused by rate limits and `504 Gateway Timeout` errors.
- **Graph Builder:** An internal geographic parser immediately compiles thousands of unordered coordinate segments into a highly optimized Adjacency List to perform mathematical graph theory traversals.

### 2. Multi-Variable Heuristic Cost Engine
Unlike traditional graph search tools that rely solely on Euclidean Distance (`cost = distance`), this system incorporates a multi-variable edge-relaxation engine to simulate real-world navigation:
- **Distance:** Base Haversine geographic distance.
- **Traffic Congestion:** Dynamically scaled penalties mimicking dense intersections.
- **Road Entity Types:** Cost prioritization heavily favoring multi-lane highways (primary) over narrow residential streets.
- **Vehicle Profile Constraints:** Modifies allowable edges and speeds depending on if the user selects Car, Bike, or Rickshaw.
- **Temporal Mechanics:** Simulates "Rush Hour" conditions based on time sliders.
- **Occasion Toggles:** Models localized security or event anomalies, causing routing engines to dynamically steer around the dense city center.

### 3. Integrated AI Pathfinding Algorithms
Supports sequential processing and visual simulation of 7 major algorithms out of the box:
1. **BFS (Breadth-First Search):** Unweighted baseline uniform-step traversal.
2. **DFS (Depth-First Search):** Blind, naive deep exploration.
3. **Dijkstra’s Algorithm:** Ground truth, guaranteed optimal (lowest-cost) weighted search.
4. **A* (A-Star) Search:** High-efficiency, heuristically-informed graph search targeting the exact geographic destination coordinate using Haversine approximations.
5. **Greedy Best-First Search:** Hyper-aggressive, heuristic-biased searching pushing pure speed over formal accuracy.
6. **Bidirectional BFS:** Dual-origin swarm collision routing that dramatically cuts search time.
7. **IDA* (Iterative Deepening A*):** Highly memory-efficient heuristic exploration mapping bounded cost thresholds.

### 4. Interactive Simulation & Control Systems
- **Intelligent Select & Confirm System:** Two-step confirmation system when placing Map points, ensuring you aren't accidentally resetting computation paths by misclicking.
- **Live Visual Animations:** Leaflet.js-powered animation queues vividly render the 'visited boundaries' and final paths sequentially arrayed across the map without blocking the UI thread.
- **Replay Capabilities:** Watch any algorithm's specific simulation execution on command via localized "Replay" hooks directly attached to React's `useMemo` states.

### 5. Analytics & Comparison Dashboard
- **Telemetry Engine:** Once processing concludes, a comprehensive table tracks raw execution milliseconds, path distance mapping, heuristic total costs, and gross nodes-visited expansion metrics.
- **Responsive Dashboard Overlay:** Sits natively atop the layout, intelligently adapting its own CSS boundary frame strictly alongside the collapsible sidebar viewport, minimizing dead canvas space.
- **Detailed Single-Path Isolation:** Users can click to highlight/isolate any single mathematical path on the map out of the swarm of algorithms for detailed review.

---

## 💻 Tech Stack
*   **Frontend Framework:** React (via Vite)
*   **Design & Layout:** Tailwind CSS (featuring Glassmorphism, dynamic fluid collapsing, and nested dark themes)
*   **Map Rendering Library:** Leaflet.js
*   **Mapping Provider:** OpenStreetMap (CARTO tiles API)
*   **Graph Logic:** Pure ES6 JavaScript (No heavyweight graph networking dependencies)

## 🛠️ Installation & Setup

1. Assemble the environment
\`\`\`bash
npm install
\`\`\`

2. Boot the development server
\`\`\`bash
npm run dev
\`\`\`

3. The system will operate locally at `http://localhost:5173`. Wait slightly for the Overpass API to fully compile the Dhanmondi testbed region upon initial load.

---

## 📈 Future Expansion
*   **Off-thread Processing:** Web Workers can be integrated to port heavy heuristic calculation loops away from React's DOM thread, guaranteeing 60FPS fluid UI even during 10,000+ node A* iterations.
*   **Caching Storage:** Adding LocalStorage integration to instantly pull saved regional maps without redundantly querying OpenStreetMap endpoints.
