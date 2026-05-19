# Fuel Crisis CSP Solver - Bangladesh

An interactive web application that models and solves the Fuel Distribution Crisis in Bangladesh as a Constraint Satisfaction Problem (CSP).

## Problem Statement

This application addresses the fuel supply chain crisis by modeling it as a formal CSP with:

### Variables (V)
- **Fuel Stations**: Location, capacity, current fuel level, time window for refueling
- **Distributors**: Depot location, supply quota, fleet of vehicles
- **Vehicles**: Fuel range, consumption rate, current fuel level

### Domain (D)
- Refuel time windows (1-72 hours, user-adjustable)
- Maximum pump distance (1-50 km)
- Vehicle ranges (truck: 400km, van: 250km, motorbike: 80km)
- Supply quotas per distributor
- Station capacity constraints

### Constraints (C)
1. **Range Constraint**: Vehicles can only refuel stations within their remaining range
2. **Capacity Constraint**: Stations cannot exceed max capacity or drop below minimum safety level
3. **Temporal Constraint**: Stations must be refueled within their time window
4. **Quota Constraint**: Distributors cannot exceed their supply quota
5. **Irrational Behavior Penalty**: Routes deviating >20% from optimal incur cost penalty
6. **Conflict Constraint**: No two distributors at same station in same time slot

## Algorithms Implemented

All algorithms return: assignment, backtracks, constraint checks, execution time, and solution status.

1. **Backtracking Search** - Naive exhaustive assignment with constraint checking
2. **Forward Checking** - Prunes domains of unassigned variables after each assignment
3. **AC-3 (Arc Consistency)** - Enforces arc consistency before and during search
4. **MRV Heuristic** - Assigns variable with fewest legal values first
5. **LCV Heuristic** - Chooses value that rules out fewest options for neighbors
6. **Greedy Assignment** - Fast baseline without backtracking

## Cost Function

```
Total Cost = Σ (route_distance × fuel_consumption) 
           + Σ (time_penalty for late refuels) 
           + Σ (irrational_behavior_penalty)
```

## Features

### Interactive Map (Leaflet.js)
- Color-coded fuel stations (green=adequate, yellow=low, red=critical)
- Distributor depot markers
- Route visualization with polylines
- Click stations/depots for detailed information
- Animated assignment process

### Control Panel
- Adjustable parameters:
  - Number of stations (5-30)
  - Number of distributors (2-10)
  - Vehicle range (50-500 km)
  - Max time window (1-72 hours)
  - Max pump distance (1-50 km)
  - Irrational behavior penalty (0.0-3.0)
- Vehicle type selection
- Algorithm selection (individual or all)
- Rush scenario toggle (50% time reduction)
- Generate/Solve/Reset buttons

### Comparison Dashboard
- Results table with all metrics
- Bar charts:
  - Backtracks per algorithm
  - Execution time per algorithm
  - Total cost per algorithm
- Radar chart: Overall normalized performance
- Summary statistics (fastest, fewest backtracks, best cost)

## Tech Stack

- **React** (Vite) - Fast development and HMR
- **Tailwind CSS** - Dark theme styling
- **Leaflet.js** - Interactive maps with OpenStreetMap
- **Chart.js** - Performance visualizations
- **Pure JavaScript** - All CSP algorithms (no external CSP libraries)

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── MapView.jsx           # Leaflet map with markers and routes
│   ├── Sidebar.jsx           # Control panel with sliders and buttons
│   ├── ComparisonTable.jsx   # Algorithm results table
│   └── ComparisonCharts.jsx  # Chart.js visualizations
├── csp/
│   ├── backtracking.js       # Pure backtracking
│   ├── forwardChecking.js    # Backtracking + FC
│   ├── ac3.js                # Arc consistency (AC-3)
│   ├── mrv.js                # MRV heuristic
│   ├── lcv.js                # LCV heuristic
│   └── greedy.js             # Greedy baseline
├── utils/
│   ├── dataGenerator.js      # Synthetic data generation
│   ├── costFunction.js       # Cost calculation
│   └── haversine.js          # Distance utility
├── App.jsx                   # Main application
└── main.jsx                  # Entry point
```

## Data Generation

Since there's no live API for fuel stations, the app generates realistic synthetic data:

- **Stations**: Random locations within Dhaka bounds (23.7-24.0°N, 90.3-90.6°E)
  - Capacity: 500-5000L
  - Current level: Random percentage of capacity
  - Time window: 2-24 hour window within next 3 days

- **Distributors**: Random depot locations
  - Quota: 1000-8000L/day
  - Fleet size: 2-5 vehicles
  - Color-coded for visualization

- **Seeded RNG**: Scenarios are reproducible with same seed

## Usage

1. **Generate Scenario**: Click "Generate Random Scenario" to create new data
2. **Adjust Parameters**: Use sliders to modify constraints
3. **Select Algorithm**: Choose one or all algorithms to run
4. **Solve**: Click "Solve CSP" to run the solver(s)
5. **Analyze Results**: View map visualization, comparison table, and charts
6. **Reset**: Clear results and start over

## Performance Notes

- Algorithms run asynchronously to prevent UI blocking
- Progress updates during solving
- Notifications for user feedback
- Handles infeasible scenarios gracefully

## Integration with Lab Assignment 1

This CSP solver can be combined with pathfinding algorithms (A*, Dijkstra, etc.) from Lab Assignment 1 to create a comprehensive fuel distribution system that:
1. Assigns distributors to stations (CSP)
2. Finds optimal routes between depots and stations (Pathfinding)

## License

MIT

## Author

AI Lab Project - Fuel Supply Chain Optimization
