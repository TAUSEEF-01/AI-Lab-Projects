# Heuristics, Edge Costs, and Synthetic Data in Dhaka Pathfinder

This document explains the internal mechanics of how map constraints are generated, how path costs are calculated, and how user-defined weights dictate the behavior of our routing algorithms (like A\* and Dijkstra).

## 1. Synthetic Data Generation

Since raw OpenStreetMap (OSM) data only provides basic geographical nodes and edges (roads), we dynamically generate realistic attributes for each edge to simulate real-world conditions in Dhaka. This is handled in `src/utils/syntheticDataset.js`.

### How it works:

- **Deterministic Randomness**: We use a seeded Pseudo-Random Number Generator (PRNG) via `d3-random`. The seed is derived from the connected Node IDs, ensuring that an edge will always receive the exact same traffic and risk levels every time the graph is loaded.
- **Road-Type Influence**: The generated stats are heavily influenced by the `roadType` (e.g., highway, primary, residential, footway).
- **Core Attributes Generated**:
  - **`avg_speed`**: Base speed limit depending on the road size and reduced dynamically by the traffic level.
  - **`timeCost`**: The base time to traverse the edge (calculated as `distance / avg_speed`).
  - **`traffic_level` (1-10)**: Normal distribution. Highways tend to have higher traffic; narrow roads have lower.
  - **`risk_level` (1-10)**: Narrow footways or poorly lit service roads have higher base risk levels than major highways.
  - **`safety_level` (1-10)**: Calculated as the inverse of risk (`11 - risk_level`).

---

## 2. The Cost Function & Heuristic Function

When a routing algorithm evaluates which road to take next, it calculates movement penalties using two primary functions defined in `src/utils/heuristic.js`:

### The Cost Function (`createCostFunction`)

The cost function determines the **actual penalty** of moving from Node A to Node B. Instead of passing a statically computed graph weight, the algorithm evaluates edge costs _on the fly_.

The cost is computed by applying user-defined multipliers (from the UI sliders) against the synthetic data:

- **Base Cost**: `timeCost` (if time weight is high) or `distance` (if distance weight is high).
- **Traffic Penalty**: `traffic_level * timeCost * trafficWeight`.
- **Security Penalty**: `risk_level * timeCost * securityWeight`.

**Strict Dynamic Constraints (e.g., Passenger Gender & Time):**
We also inject real-world contextual rules into the cost function:

- If the passenger is set to **Female** and it is **Late Night** (6 PM to 6 AM), paths with a `risk_level >= 7` or `safety_level <= 4` explicitly return a cost of `Infinity`.
- Returning `Infinity` makes the edge entirely impassable, strictly forcing the algorithms to route entirely around dangerous areas rather than just penalizing them.

### The Heuristic Function (`createHeuristic`)

Algorithms like **A\*** and **IDA\*** use a heuristic to guess the remaining distance to the destination.

- We use the **Haversine formula** to calculate the straight-line ("as the crow flies") distance between the current node and the target.
- For A\* to guarantee the shortest optimal path, the heuristic must be **admissible** (it must never overestimate the true cost).

---

## 3. How Weights Alter the Results

The UI features a set of sliders (Distance, Time, Traffic, Security). By modifying these, you explicitly change the underlying values in the `costFunction`, allowing identical algorithms to yield vastly different routes.

- **High Distance Weight (`w.distance`)**: The algorithm ignores traffic delays and safety features, opting purely for the shortest spatial route.
- **High Time + Traffic Weight (`w.time` & `w.traffic`)**: The algorithm heavily penalizes edges with a high `traffic_level`. It might choose a path that is physically twice as long if it involves highways with low traffic, achieving a faster arrival time.
- **High Security Weight (`w.security`)**: The algorithm accepts massive detours to stick to roads with high `safety_level` and low `risk_level` scores.
- **Passenger Specifics ("Female" setting)**: Changes the very topology of the graph. By returning `Infinity` on high-risk roads at night, the algorithm completely removes those roads from its awareness. The graph effectively becomes disconnected in dangerous neighborhoods, ensuring maximum safety compliance at the cost of significantly longer travel distances.

---

## 4. Mathematical Equation of the Heuristic Function

The full equation for the heuristic cost estimate $h(n)$ from a current node $n$ to the goal node $g$ is dynamically constructed as follows:

$$
h(n) = \max\left(0, \ dKm \cdot \min_{cpk} \cdot \left( w_{dist} + 0.4 \cdot w_{sec} \cdot \max\left(0, \frac{sec_n}{sec_g} - 1\right) + 0.22 \cdot w_{time} \cdot I_{rush} + 0.38 \cdot w_{occ} \cdot I_{city} \right) \right)
$$

**Where:**

- $dKm$: The Haversine distance from node $n$ to goal $g$ in kilometers.
- $\min_{cpk}$: The globally computed minimum synthetic cost-per-kilometer across the entire graph.
- $w_{dist}, w_{sec}, w_{time}, w_{occ}$: The normalized user-defined weights for Distance, Security, Time/Rush Hour, and Occasion.
- $sec_n, sec_g$: The categorical security multiplier values for node $n$ and goal $g$.
- $I_{rush}$: An indicator variable (1 if it is currently rush hour, 0 otherwise).
- $I_{city}$: An indicator variable (1 if the midpoint between $n$ and $g$ is within the city center bounding box and the occasion setting is active, 0 otherwise).

---

## 5. Ensuring Heuristic Admissibility

For algorithms like **A\*** to guarantee finding the optimal (cheapest) path, the heuristic function $h(n)$ must be **admissible**. This means it **must never overestimate** the true cost to reach the goal from the current node ($h(n) \le h^*(n)$).

Here is how admissibility is maintained in a complex, multi-weighted routing system:

### 1. Absolute Shortest Path (Straight-Line Distance)

We base the distance calculation on the **Haversine (Euclidean) distance** ($dKm$). Because physical roads curve and turn, the true road distance will always be $\ge$ the straight-line distance. This guarantees an underestimation of the spatial distance.

### 2. Global Minimum Cost-Per-Kilometer ($\min_{cpk}$)

Since actual edge costs are modified by traffic, risk, and speed, we find the single "cheapest" stretch of road in the entire map (`minCpKm` calculated in `syntheticDataset.js`). Multiplying the straight-line distance by this absolute best-case cost rate ensures that even if the remaining path is a straight, empty highway with zero risk, the heuristic's guess remains lower than or equal to the actual cost.

### 3. Modifying with User Weights (The Catch)

In the dynamic heuristic equation, extra penalties are added conditionally (e.g., $0.4 \cdot w_{sec}$ for security differences, or $0.22 \cdot w_{time}$ for rush hour).

To strictly guarantee theoretical admissibility, these added penalties must represent the **absolute minimum unavoidable penalty** for _any_ path. If there is _any_ path that can completely bypass the city center or avoid specific risks, adding arbitrary penalties might cause the heuristic to overestimate the true optimal cost, breaking admissibility.

**Strictly Admissible Formula:**
To be 100% mathematically flawless, the heuristic relying solely on the absolute minimum properties (stripping out conditional additions) is:

$$
h_{admissible}(n) = \max\left(0, \ dKm \cdot \min_{cpk} \cdot w_{dist}\right)
$$

Adding the environmental weights (like security or rush hour) to the heuristic makes it "cost-aware" and speeds up the search towards preferred roads by guiding the algorithm more aggressively, but falling back to the strict formula above is required if pure mathematical admissibility must be guaranteed.

---

## 6. Total Actual Cost Equation

Based on the independent-factor implementation, the true path cost evaluated for each edge dynamically avoids multiplying zeros.

If the passenger is **Female** at **Night** AND the road is **High-Risk** ($risk\_level \ge 7$ or $safety\_level \le 4$):
$$ C(edge) = \infty $$

Otherwise, the total cost $C(edge)$ is the sum of the **Weighted Base Time** and **every conditionally active independent penalty**:

$$
C(edge) = C_{dist} + C_{traffic} + C_{safety} + C_{risk} + C_{road} + C_{veh} + C_{time} + C_{occ}
$$

**Where:**
$T = \text{baseTimeCost}$

- **Distance/Time Base:** $C_{dist} = T \times w_{dist}$
- **Traffic Penalty:** $C_{traffic} = (traffic\_level \cdot 0.1) \times T \times w_{traffic}$
- **Safety Penalty:** $C_{safety} = (10 - safety\_level) \cdot 0.05 \times T \times w_{sec} \times M_{female}$
- **Risk Penalty:** $C_{risk} = (risk\_level \cdot 0.05) \times T \times w_{sec} \times M_{female}$
- **Road Type Penalty:** $C_{road} = \max(0, B_{road} - 1) \times T \times w_{road}$
- **Vehicle Penalty:** $C_{veh} = \max(0, B_{veh} - 1) \times T \times w_{veh}$
- **Rush Hour Penalty:** $C_{time} = 0.5 \times T \times w_{timeOfDay}$ _(only if Rush Hour)_
- **Occasion Penalty:** $C_{occ} = 1.5 \times T \times w_{occ}$ _(only if Occasion Active & in City Center)_

_(Note: $M_{female} = 5.0$ if female passenger at night, $1.5$ if female by day, and $1.0$ otherwise)._
