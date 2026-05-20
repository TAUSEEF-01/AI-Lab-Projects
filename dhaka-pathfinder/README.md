# Dhaka Pathfinder 🗺️🚗
### *An Interactive Real-World AI Pathfinding Simulator & Dynamic Heuristic Engine*

**Dhaka Pathfinder** is a highly interactive, real-world Artificial Intelligence pathfinding simulator. It parses real geographical road networks of Dhaka, Bangladesh directly from the **OpenStreetMap (OSM)** database via the **Overpass API**, compiles them into an optimized Adjacency List graph, and executes 7 different search algorithms.

Designed as an academic AI Lab project, this application showcases the difference between **uninformed search**, **informed heuristic search**, and **dynamic penalty-weighted edge relaxation** mimicking complex city constraints (traffic congestion, road classes, security risk zones, rush hours, vehicle type suitability, and passenger gender safety).

---

## 🎯 Academic Learning Objectives & Contributions
1. **Uninformed vs. Informed Search:** Concrete comparison of search space expansion (node count) and optimality gap between algorithms like BFS, DFS, Dijkstra, A*, Greedy BFS, Bi-BFS, and Iterative Deepening A* (IDA*).
2. **Multi-Variable Heuristic Formulation:** Design of a cost-aware heuristic function that incorporates dynamic spatial-temporal parameters while maintaining mathematical **admissibility** and **consistency**.
3. **Graph Topology Pruning (Safety Constraints):** Implements dynamic edge pruning ($C(edge) = \infty$) to model real-world high-risk environments at night for female passengers, showing how graph layout adjusts to security constraints.
4. **Separation of Concerns in UI Simulation:** Solves simulation testing issues by distinguishing between **parameter modifications** (which randomize coordinates to test varied layouts) and **vehicle changes** (which preserve coordinates to directly compare vehicle profiles over the exact same route).

---

## ⚙️ Heuristics & Dynamic Cost Engine

Instead of abstract grid-based pathfinding, Dhaka Pathfinder evaluates edge costs on-the-fly using real-world physical models.

### 1. Total Edge Cost Equation $C(edge)$
Every road segment (edge) has a base spatial distance and a synthetic base traversal time $T$ (derived from length and road class speed limits). When traversing from Node $u$ to Node $v$, the dynamic cost $C(u, v)$ is calculated as:

$$
C(u, v) = C_{dist} + C_{traffic} + C_{safety} + C_{risk} + C_{road} + C_{vehicle} + C_{time} + C_{occasion}
$$

Where:
- **Base Distance/Time Cost:** $C_{dist} = T \times w_{dist}$ (where $w_{dist}$ is the user distance slider weight).
- **Traffic Delay:** $C_{traffic} = (\text{traffic\_level} \times 0.1) \times T \times w_{traffic}$.
- **Security & Safety Penalties:** 
  - $C_{safety} = (10 - \text{safety\_level}) \times 0.05 \times T \times w_{sec} \times M_{female}$
  - $C_{risk} = \text{risk\_level} \times 0.05 \times T \times w_{sec} \times M_{female}$
- **Road Class Penalty:** $C_{road} = \max(0, B_{road} - 1) \times T \times w_{road}$ (prioritizes arterial highways over narrow alleys).
- **Vehicle Constraint Penalty:** $C_{vehicle} = \max(0, B_{vehicle} - 1) \times T \times w_{vehicle}$ (penalizes heavy buses in narrow residential streets or slow rickshaws on highways).
- **Rush Hour Temporal Cost:** $C_{time} = 0.5 \times T \times w_{timeOfDay}$ *(active only if Time of Day falls within 8:00–10:00 AM or 5:00–8:00 PM)*.
- **Occasion Cost:** $C_{occasion} = 1.5 \times T \times w_{occasion}$ *(active only if Occasion toggle is enabled and coordinates are inside the city center bounding box)*.

#### 🛡️ Passenger Gender Pruning (High-Risk Night Pruning)
To model absolute passenger safety, the cost function implements an dynamic pruning threshold:
*   If the selected passenger is **Female** AND the time is **Late Night** (6:00 PM to 6:00 AM):
    *   Any edge with $\text{risk\_level} \ge 7$ or $\text{safety\_level} \le 4$ yields $C(u, v) = \infty$.
    *   This forces the search algorithm to completely bypass these streets, proving A* or Dijkstra will find a longer safe detour rather than exposing the passenger.

---

### 2. The Admissible Heuristic Function $h(n)$
For informed algorithms like **A\*** and **IDA\*** to guarantee mathematical optimality (i.e. finding the absolute cheapest path), the heuristic function $h(n)$ estimating cost from node $n$ to goal $g$ must be **admissible**—it must never overestimate the actual remaining cost: $h(n) \le h^*(n)$.

To maintain admissibility across multi-weighted variables:
1. **Haversine Baseline:** We compute the straight-line distance $dKm$ between node coordinates (which is always shorter than physical winding streets).
2. **Global Minimum Cost-per-Kilometer ($\min_{cpk}$):** The graph pre-calculates the absolute cheapest cost rate across the entire map. By multiplying $dKm$ by $\min_{cpk}$, the heuristic guarantees it remains lower than any possible actual road cost.
3. **Weight Scaling:** The heuristic scales dynamically with user-adjusted weights:

$$
h(n) = \max\left(0, \ dKm \cdot \min_{cpk} \cdot w_{dist}\right)
$$

To guide search more aggressively during rush hours or occasions, the engine uses a **cost-aware heuristic modifier** which incorporates local node safety risks and temporal variables:

$$
h_{cost\_aware}(n) = \max\left(0, \ dKm \cdot \min_{cpk} \cdot \left[ w_{dist} + 0.4 \cdot w_{sec} \cdot \max\left(0, \frac{\text{sec}_n}{\text{sec}_g} - 1\right) + 0.22 \cdot w_{time} \cdot I_{rush} + 0.38 \cdot w_{occ} \cdot I_{city} \right] \right)
$$

---

## 🧮 AI Pathfinding Algorithms Compared

The simulator implements and visualizes 7 fundamental pathfinding algorithms:

| Algorithm | Category | Heuristic Guided? | Optimality Guarantee? | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BFS** | Uninformed | ❌ No | Only for Unweighted | $O(V + E)$ | $O(V)$ |
| **DFS** | Uninformed | ❌ No | ❌ No | $O(V + E)$ | $O(V)$ |
| **Dijkstra** | Uninformed | ❌ No | **✅ Yes (Cheapest Path)** | $O((V + E) \log V)$ | $O(V)$ |
| **A\*** | Informed | **✅ Yes** | **✅ Yes (Cheapest Path)** | $O((V + E) \log V)$ | $O(V)$ |
| **Greedy BFS** | Informed | **✅ Yes** | ❌ No | $O((V + E) \log V)$ | $O(V)$ |
| **Bi-BFS** | Uninformed | ❌ No | Only for Unweighted | $O(V^{d/2})$ | $O(V^{d/2})$ |
| **IDA\*** | Informed | **✅ Yes** | **✅ Yes (Cheapest Path)** | $O(b^d)$ (worst case) | **$O(d)$ (Ultra-low Memory)** |

### Comparative Insights for Teachers
*   **BFS vs. Dijkstra:** BFS explores uniform layers and is optimal for *distance* hops, but ignores traffic/road weights. Dijkstra expands search in order of weight cost, guaranteeing the lowest cost path.
*   **Dijkstra vs. A\***: Dijkstra expands in all directions equally (circular wavefront). A* applies the heuristic to pull the wavefront directly toward the destination, reducing the search space (visited nodes) by up to **60-80%** while achieving the exact same optimal cost.
*   **A\* vs. Greedy BFS:** Greedy BFS prioritizes $h(n)$ alone. It is extremely fast and visits minimal nodes, but often gets trapped in detours or chooses highly sub-optimal routes.
*   **IDA\* Benefits:** While A* holds all open nodes in memory, IDA* uses depth-first searches bounded by cost thresholds. This drops memory usage from $O(V)$ down to $O(d)$ (path depth), making it ideal for memory-constrained embedded routing hardware.

---

## 🔄 Live Interactive Simulation Mechanics

To provide a state-of-the-art interactive experience, the application implements distinct coordinate-selection states:

### 1. Separation of Concerns in State Triggers
*   **Parameter Changes (Weights, Rush Hour, Events):** Adjusting sliders or toggle switches automatically **regenerates two new random start and end points** on the active map. This enables quick testing of parameters across different parts of the city.
*   **Vehicle Changes (Car, Bike, Rickshaw, Bus):** Switching vehicles **preserves the current start and end points**. This allows you to directly compare how travel routes, time costs, and optimal paths change for a bike vs. a car over the exact same journey.

### 2. Real-Time Recalculation
- Adjusting any weight slider, changing vehicle type, or switching map options automatically **re-runs all active algorithms instantly** in the background. The final paths, performance metrics, and comparison charts update on your screen in real time.

---

## 💻 Tech Stack & Architecture

*   **Core UI Engine:** React 18, Vite (for hot module replacement and building).
*   **Design Language:** HSL-tailored custom HSL dark-theme styling, glassy overlays, smooth height-adjusting sheets, and micro-interactions.
*   **Mapping:** Leaflet.js and OpenStreetMap (CARTO dark/light tile layers).
*   **Graph Builder:** Dynamic geographic network assembler, merging coordinates within 5 meters to resolve disjoint GPS segments into a single connected traversable graph.

---

## 🚀 Running the Project Locally

Follow these quick commands to spin up the local server on your computer:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to **`http://localhost:5173`** (or the URL shown in your terminal).
4. Select an area in the sidebar (e.g. **Dhanmondi** or **Gulshan**) to fetch OpenStreetMap data. 
5. Start moving weights, switching vehicles, or changing passenger safety settings to see the pathfinder instantly adapt in real time!