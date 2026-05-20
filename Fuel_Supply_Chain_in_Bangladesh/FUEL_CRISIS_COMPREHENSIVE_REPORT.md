# Comprehensive Report: Fuel Supply Chain Constraint Satisfaction Problem

## 1. Application Functionality & Workflow
The application simulates, visually renders, and algorithmically resolves logistical chaos during a fuel crisis. Its workflow is mapped as follows:
1. **Initialization:** The app automatically generates a synthetic environment comprising Fuel Stations (Demand) and Distributor Depots (Supply) scattered across a bounding geographical map (default is Dhaka, Bangladesh) using seed-based RNG logic.
2. **Environmental Configuration:** The user adjusts global parameters via the interactive UI control sidebar. This tweaks constraints covering the number of stations, vehicle type limits, refuel time window strictness, and penalties for irrational behavior.
3. **Constraint Solving Mechanism:** Upon triggering execution, the application delegates the configured data to one (or all) selected AI Search Algorithms (Backtracking, Forward Checking, AC-3, LCV, MRV, Greedy).
4. **Live Logistics Visualization:** The system captures the algorithm's resolved layout and plots the mapped supply routes on an interactive CartoDB map in real time.
5. **Comparative Analytics:** Result payloads from the algorithms populate the lower-dashboard charts to cross-compare execution time, mathematical complexity (constraint checks/backtracks), and overall navigational efficiency (Total Cost).

---

## 2. Data Generation Methodology
Since real-time fuel reserves are inaccessible via public APIs without credentials, realistic deterministic data is generated at runtime via `./src/utils/dataGenerator.js`. 
- **Geospatial Boundaries:** Random mapping coordinates are clamped mathematically to city boundaries (e.g., for Dhaka: `Lat 23.7 – 24.0`, `Lng 90.3 – 90.6`).
- **Fuel Stations (Nodes of Demand):** 
  - *Capacity Limits:* Anywhere between $500\text{L}$ and $5,000\text{L}$.
  - *Current Safety Level:* A randomized percentage of the maximum capacity. Thresholds are used to flag stations dynamically as visual markers ('critical', 'low', or 'adequate').
  - *Time Windows:* An acceptable refuel target spanning a $2$ to $24$-hour span is allocated across a simulated 3-day projection constraint.
- **Distributor Depots (Nodes of Supply):**
  - *Supply Quota:* Stations hold hard limits between $15,000\text{L}$ and $45,000\text{L}$ of dispatchable capacity per active day.
  - *Vehicle Fleet Model:* Distributing depots command a fleet array ranging between $2$ to $5$ functional vehicles.
  - *Vehicle Modifiers:* Physical capabilities shift mathematically depending on selected modes:
    - *Trucks:* Up to $600\text{km}$ range | Consumption rate of $18\text{L}/100\text{km}$.
    - *Vans:* Up to $300\text{km}$ range | Consumption rate of $9\text{L}/100\text{km}$.
    - *Motorbikes:* Up to $80\text{km}$ range | Consumption rate of $3\text{L}/100\text{km}$.

---

## 3. CSP Considerations (Variables, Domains, Constraints)
The architecture formulates the distribution log-jam heavily based on matching hard conditions around the fundamental triple algorithm $(V, D, C)$.

### Variables ($V$)
- $V_s$: Stations requiring fuel assignments (Target Nodes).
- $V_d$: Distributor Depots responsible for dispatch (Origin Nodes).
*(Note: Vehicle/fleet characteristics tie directly into the domain scopes of their respective Distributor variable).*

### Domain ($D$)
The Domain equates to the boundaries of acceptable assignment criteria mapping $V_s \rightarrow V_d$:
- **Temporal Span:** The acceptable hour targets (allowable delivery interval logic).
- **Physical Reach Limit ($r$):** Combination of vehicle mileage thresholds vs geographic destination boundaries.
- **Supply Allowance:** Distributor quotas available to subtract per dispatch.

### Constraints ($C$)
Attempted assignments are rejected (prompting backtracks) if they fail these hard checks derived in `isConsistent()` tests:
1. **Range Constraint:** A vehicle must hold enough fuel to physically bridge the gap. Distance calculation must be $\le$ `VehicleRange` $\times$ `FuelPercentage`.
2. **Pump Radius Enforcement:** The geographical separation between the depot and assigned station cannot exceed the user's manual slider for "Max Pump Distance".
3. **Quota Capacity Consistency:** Assigned fuel requests cannot collectively surpass the distributor's daily limitation quota.
4. **Temporal Overlap Rule:** The assigned delivery hour has to naturally fall within a station’s specific (`timeWindow.start`, `timeWindow.end`) window constraints.
5. **Node Collision Limit:** A station entity cannot compute service by two distinctly different distributors at the exact identical time slot mapping.

---

## 4. Mathematical Equations Utilized
At the core root of CSP optimization logic and spatial tracking sit two specific metric evaluations.

### A. Haversine Distance Calculation (Spatial Metric)
Coordinates live on a spherical Earth topological model; standard flat plane Euclidean geometry fails over longer distances. The codebase (`haversine.js`) solves radial intersections utilizing Earth’s radius ($R = 6371\text{km}$):
$$ a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cdot\cos(\phi_2)\cdot\sin^2\left(\frac{\Delta \lambda}{2}\right) $$
$$ c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right) $$
$$ d = R \cdot c $$
*(Where $\phi$ denotes latitude and $\lambda$ longitudinal points converted mathematically to radians).*

### B. Route Optimization Generation (Objective Cost Logic)
Total system cost embodies the algorithmic "fitness" of a solved logistic graph. Embedded inside `costFunction.js`, it determines which AI algorithm resolved the cheapest/smartest routes preventing resource loss.
$$ Total Cost = \sum_{i=1}^{n} (F_{cost}) + \sum_{i=1}^{n} (T_{penalty}) + \sum_{i=1}^{n} (I_{penalty}) $$

Expanded, these layers map against:
1. **Fuel Operational Cost ($F_{cost}$):**
   $$ F_{cost} = d_i \times V_{consumption} \times 1.5 $$
   *(Distance multiplied by unique vehicle fuel consumption variables amplified by an economic factor of 1.5).*
2. **Time Window Violation Penalty ($T_{penalty}$):**
   $$ T_{penalty} = \min(|t_{assigned} - t_{start}|, |t_{assigned} - t_{end}|) \times W_{time} $$
   *(Tallying missed scheduling slots multiplied against `timePenaltyWeight` to inflict a punitive measure).*
3. **Irrational Geographic Behavior Penalty ($I_{penalty}$):**
   $$ I_{penalty} = (d_i - d_{min}) \times W_{irrational} \times 50 $$
   *(Triggered exclusively if assigned $d_i$ stretches $>20\%$ further than the absolute closest valid depot, punishing agents that jump locations redundantly).*

---

## 5. Result Dissection & Algorithmic Benchmarks
Post-resolution, interpreting the analytical dashboards yields insight into the structural capability of modern searching protocols:

* **Total Cost Analysis:** Defines the routing success metric. A drastically lower numeric cost dictates a heavily optimized distribution frame (fewer missed curfews, less wasted gasoline, localized mapping selection).
* **Execution Time (ms):** Highlights logic cycle latency. *Greedy Algorithms* tend to process almost instantly because they select immediate "good" paths without forward consideration, contrasting with brute-force *Backtracking* which requires massive system overhead logic.
* **Constraint Checks:** Evaluates mathematical processing load. Displays exactly how many potential paths the AI generated and assessed against the rulebook framework before coming to a consensus.
* **Backtracks Computed:** Dictates predictive failure rates. Registers exactly how many instances the solver encountered a scenario failure/dead-end prompting an absolute reversal up the decision tree logic model. **Zero (0) Backtracks** indicates that the AI encountered a loosely governed environment where its very first logic tree route completed the task without collision (or a Greedy bypass).

By correlating heuristics like **MRV** (prioritizing the most physically constrained stations first) and **LCV** (evaluating solutions minimizing secondary node disruption), the end-user gains profound illustration of exactly why basic brute-forcing is detrimental in real-world crisis supply chains over heuristically modeled Artificial Intelligence pathfinding.