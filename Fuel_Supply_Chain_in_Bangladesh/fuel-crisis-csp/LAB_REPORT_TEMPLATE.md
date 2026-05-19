# Combined Lab Report: Pathfinding & CSP for Fuel Distribution

## Lab Assignment 1 & 2 - Integrated Report

**Course**: Artificial Intelligence Lab  
**Topic**: Fuel Supply Chain Optimization in Bangladesh  
**Student Name**: [Your Name]  
**Student ID**: [Your ID]  
**Date**: [Date]  
**Instructor**: [Instructor Name]

---

## Executive Summary

This report presents a comprehensive solution to the fuel distribution crisis in Bangladesh using two complementary AI techniques:
1. **Pathfinding Algorithms** (Lab 1): Finding optimal routes on road networks
2. **Constraint Satisfaction Problem (CSP) Solving** (Lab 2): Assigning distributors to fuel stations

The integrated system addresses both the assignment problem (which distributor serves which station) and the routing problem (what path should vehicles take).

---

## Part 1: Pathfinding Algorithms (Lab Assignment 1)

### 1.1 Problem Statement
[Describe the pathfinding problem - finding routes from distributor depots to fuel stations on a road network]

### 1.2 Algorithms Implemented
- A* Search
- Dijkstra's Algorithm
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- [Others if implemented]

### 1.3 Implementation Details
[Describe your pathfinding implementation]

### 1.4 Results & Analysis
[Include screenshots, performance comparisons, and analysis]

---

## Part 2: Constraint Satisfaction Problem (Lab Assignment 2)

### 2.1 Problem Definition

#### 2.1.1 Real-World Context
The fuel distribution crisis in Bangladesh involves:
- Limited fuel supply at stations
- Multiple distributors with capacity constraints
- Time-sensitive refueling requirements
- Geographic and logistical constraints
- Irrational behavior patterns (inefficient routing)

#### 2.1.2 CSP Formulation

**Variables (V):**
- Fuel stations: {S₁, S₂, ..., Sₙ}
- Each station has: location (lat, lng), capacity, current fuel level, time window

**Domain (D):**
- For each station Sᵢ: D(Sᵢ) = {(distributor, time) | distributor ∈ Distributors, time ∈ TimeWindow}
- Distributors: {D₁, D₂, ..., Dₘ}
- Time slots: Discrete hours within 1-72 hour window
- Vehicle ranges: Truck (400km), Van (250km), Motorbike (80km)

**Constraints (C):**
1. **Range Constraint**: distance(Dⱼ, Sᵢ) ≤ vehicle_range
2. **Capacity Constraint**: min_level ≤ fuel_level ≤ max_capacity
3. **Temporal Constraint**: assignment_time ∈ [start_window, end_window]
4. **Quota Constraint**: Σ fuel_supplied ≤ distributor_quota
5. **Irrational Behavior Penalty**: deviation > 20% from optimal → penalty
6. **Conflict Constraint**: No two distributors at same station simultaneously

### 2.2 Cost Function

```
Total Cost = Σ (route_distance × fuel_consumption × 1.5)
           + Σ (time_penalty × |assigned_time - preferred_time|)
           + Σ (irrational_penalty × excess_distance × 50)

Where:
- route_distance: Haversine distance (km)
- fuel_consumption: L/km (truck: 0.3, van: 0.15, motorbike: 0.05)
- time_penalty: Cost per hour deviation (default: 100)
- irrational_penalty: Weight for inefficient routing (0.0-3.0)
```

### 2.3 Algorithms Implemented

#### 2.3.1 Backtracking Search
**Description**: Naive exhaustive search with constraint checking  
**Pseudocode**:
```
function BACKTRACKING(assignment, stations):
    if assignment is complete:
        return assignment
    
    station = SELECT-UNASSIGNED-STATION(stations)
    for each (distributor, time) in DOMAIN(station):
        if CONSISTENT(station, distributor, time):
            add {station: (distributor, time)} to assignment
            result = BACKTRACKING(assignment, stations)
            if result ≠ failure:
                return result
            remove {station: (distributor, time)} from assignment
    
    return failure
```

**Characteristics**:
- Complete: Always finds solution if one exists
- Time Complexity: O(d^n) where d = domain size, n = variables
- Space Complexity: O(n)

#### 2.3.2 Forward Checking
**Description**: Prunes domains of unassigned variables after each assignment  
**Key Improvement**: Detects failures early by checking domain wipeout

**Pseudocode**:
```
function FORWARD-CHECKING(assignment, domains):
    if assignment is complete:
        return assignment
    
    station = SELECT-UNASSIGNED-STATION()
    for each value in DOMAIN(station):
        if CONSISTENT(station, value):
            add {station: value} to assignment
            saved_domains = COPY(domains)
            
            if PRUNE-DOMAINS(domains, station, value):
                result = FORWARD-CHECKING(assignment, domains)
                if result ≠ failure:
                    return result
            
            RESTORE(domains, saved_domains)
            remove {station: value} from assignment
    
    return failure
```

#### 2.3.3 AC-3 (Arc Consistency)
**Description**: Enforces arc consistency before and during search  
**Key Improvement**: Reduces domain sizes through constraint propagation

**Pseudocode**:
```
function AC-3():
    queue = ALL-ARCS()
    while queue is not empty:
        (Xi, Xj) = queue.pop()
        if REVISE(Xi, Xj):
            if DOMAIN(Xi) is empty:
                return false
            for each Xk in NEIGHBORS(Xi) - {Xj}:
                queue.add((Xk, Xi))
    return true

function REVISE(Xi, Xj):
    revised = false
    for each x in DOMAIN(Xi):
        if no value y in DOMAIN(Xj) satisfies constraint(x, y):
            remove x from DOMAIN(Xi)
            revised = true
    return revised
```

#### 2.3.4 MRV (Minimum Remaining Values) Heuristic
**Description**: Variable ordering heuristic - choose variable with fewest legal values  
**Key Improvement**: Fails fast on impossible branches

**Selection Strategy**:
```
function SELECT-UNASSIGNED-VARIABLE():
    min_domain_size = ∞
    selected = null
    
    for each unassigned variable V:
        legal_values = COUNT-LEGAL-VALUES(V)
        if legal_values < min_domain_size:
            min_domain_size = legal_values
            selected = V
    
    return selected
```

#### 2.3.5 LCV (Least Constraining Value) Heuristic
**Description**: Value ordering heuristic - choose value that rules out fewest options  
**Key Improvement**: Maximizes flexibility for future assignments

**Ordering Strategy**:
```
function ORDER-DOMAIN-VALUES(variable):
    values = []
    for each value in DOMAIN(variable):
        constraint_count = COUNT-CONSTRAINTS(variable, value)
        values.add((value, constraint_count))
    
    return SORT(values, by=constraint_count, ascending=true)
```

#### 2.3.6 Greedy Assignment
**Description**: Fast baseline - assign each variable to locally best value  
**Key Improvement**: No backtracking, O(n) time complexity

**Algorithm**:
```
function GREEDY-ASSIGNMENT(stations, distributors):
    assignment = {}
    sorted_stations = SORT-BY-URGENCY(stations)
    
    for each station in sorted_stations:
        best_cost = ∞
        best_assignment = null
        
        for each (distributor, time) in DOMAIN(station):
            if CONSISTENT(station, distributor, time):
                cost = CALCULATE-COST(station, distributor, time)
                if cost < best_cost:
                    best_cost = cost
                    best_assignment = (distributor, time)
        
        if best_assignment is not null:
            assignment[station] = best_assignment
        else:
            return failure
    
    return assignment
```

### 2.4 Implementation

#### 2.4.1 Technology Stack
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS (dark theme)
- **Maps**: Leaflet.js with OpenStreetMap
- **Charts**: Chart.js
- **Language**: Pure JavaScript (no external CSP libraries)

#### 2.4.2 Project Structure
```
src/
├── components/
│   ├── MapView.jsx           # Leaflet visualization
│   ├── Sidebar.jsx           # Control panel
│   ├── ComparisonTable.jsx   # Results table
│   └── ComparisonCharts.jsx  # Performance charts
├── csp/
│   ├── backtracking.js
│   ├── forwardChecking.js
│   ├── ac3.js
│   ├── mrv.js
│   ├── lcv.js
│   └── greedy.js
└── utils/
    ├── dataGenerator.js
    ├── costFunction.js
    └── haversine.js
```

#### 2.4.3 Data Generation
Since no live API exists for Bangladesh fuel stations, synthetic data is generated:
- **Location**: Random within Dhaka bounds (23.7-24.0°N, 90.3-90.6°E)
- **Stations**: Capacity (500-5000L), current level, time windows
- **Distributors**: Depot locations, quotas (1000-8000L/day), fleet size (2-5)
- **Seeded RNG**: Reproducible scenarios

### 2.5 Experimental Results

#### 2.5.1 Test Scenarios

**Scenario 1: Small (Easy)**
- Stations: 5
- Distributors: 3
- Vehicle: Truck (400km)
- Time Window: 24 hours

[Include screenshot of map and results]

**Results**:
| Algorithm | Solution | Backtracks | Checks | Time (ms) | Cost |
|-----------|----------|------------|--------|-----------|------|
| Backtracking | ✓ | [X] | [Y] | [Z] | [C] |
| Forward Checking | ✓ | [X] | [Y] | [Z] | [C] |
| AC-3 | ✓ | [X] | [Y] | [Z] | [C] |
| MRV | ✓ | [X] | [Y] | [Z] | [C] |
| LCV | ✓ | [X] | [Y] | [Z] | [C] |
| Greedy | ✓ | 0 | [Y] | [Z] | [C] |

**Scenario 2: Medium**
- Stations: 15
- Distributors: 5
- Vehicle: Van (250km)
- Time Window: 12 hours

[Include screenshot and results table]

**Scenario 3: Large (Hard)**
- Stations: 25
- Distributors: 4
- Vehicle: Motorbike (80km)
- Time Window: 6 hours
- Rush Scenario: ON

[Include screenshot and results table]

#### 2.5.2 Performance Analysis

[Include charts showing:]
1. Backtracks comparison (bar chart)
2. Execution time comparison (bar chart)
3. Solution cost comparison (bar chart)
4. Overall performance radar chart

**Key Findings**:
- Greedy is fastest but may not find optimal solutions
- MRV and LCV reduce backtracks significantly
- AC-3 preprocessing helps in constrained scenarios
- Forward checking detects failures early
- Pure backtracking is slowest but most straightforward

### 2.6 Visualization Features

#### 2.6.1 Interactive Map
- Color-coded stations (green/yellow/red by fuel level)
- Distributor depot markers
- Route polylines showing assignments
- Click markers for detailed information
- Legend for interpretation

[Include screenshot of map with routes]

#### 2.6.2 Control Panel
- Real-time parameter adjustment
- Algorithm selection
- Scenario generation
- Rush mode toggle

[Include screenshot of sidebar]

#### 2.6.3 Comparison Dashboard
- Comprehensive results table
- Multiple performance charts
- Summary statistics

[Include screenshot of dashboard]

---

## Part 3: Integration of Pathfinding & CSP

### 3.1 Two-Phase Approach

**Phase 1: CSP Assignment**
- Input: Stations, distributors, constraints
- Output: Assignment of distributors to stations
- Algorithms: Backtracking, FC, AC-3, MRV, LCV, Greedy

**Phase 2: Pathfinding**
- Input: Depot locations, assigned stations, road network
- Output: Optimal routes for each vehicle
- Algorithms: A*, Dijkstra, BFS, DFS

### 3.2 Combined System Architecture

```
┌─────────────────────────────────────────────────┐
│           Fuel Distribution System              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │   CSP Solver │────────>│   Pathfinder    │  │
│  │  (Lab 2)     │         │   (Lab 1)       │  │
│  └──────────────┘         └─────────────────┘  │
│        │                           │            │
│        │ Assignments               │ Routes     │
│        ▼                           ▼            │
│  ┌──────────────────────────────────────────┐  │
│  │        Visualization & Analysis          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3.3 Benefits of Integration
1. **Complete Solution**: Both assignment and routing
2. **Optimization**: Minimize total distance and time
3. **Constraint Satisfaction**: Respect all limitations
4. **Real-World Applicability**: Practical fuel distribution

---

## Part 4: Conclusions

### 4.1 Key Achievements
- ✅ Implemented 6 CSP algorithms from scratch
- ✅ Created interactive visualization system
- ✅ Modeled real-world fuel crisis problem
- ✅ Comprehensive performance analysis
- ✅ Integration-ready with pathfinding

### 4.2 Algorithm Comparison

**Best for Speed**: Greedy (no backtracking)  
**Best for Optimality**: AC-3 with MRV/LCV  
**Best for Simple Problems**: Pure Backtracking  
**Best for Complex Problems**: Forward Checking + MRV

### 4.3 Lessons Learned
[Describe what you learned about:]
- CSP problem formulation
- Algorithm trade-offs
- Heuristic effectiveness
- Real-world constraint modeling

### 4.4 Future Work
- Real-time data integration
- Multi-day scheduling
- Dynamic re-planning
- Machine learning for parameter tuning
- Mobile application

---

## Part 5: References

1. Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
2. Mackworth, A. K. (1977). Consistency in networks of relations. *Artificial Intelligence*, 8(1), 99-118.
3. Haralick, R. M., & Elliott, G. L. (1980). Increasing tree search efficiency for constraint satisfaction problems. *Artificial Intelligence*, 14(3), 263-313.
4. Leaflet.js Documentation: https://leafletjs.com/
5. Chart.js Documentation: https://www.chartjs.org/

---

## Appendices

### Appendix A: Source Code
[Link to GitHub repository or include key code snippets]

### Appendix B: User Manual
[Reference to QUICK_START.md]

### Appendix C: Additional Screenshots
[Include more screenshots of different scenarios]

### Appendix D: Performance Data
[Include raw performance data tables]

---

**End of Report**
