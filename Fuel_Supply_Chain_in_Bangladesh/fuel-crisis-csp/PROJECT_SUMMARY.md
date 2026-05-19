# Fuel Crisis CSP Solver - Project Summary

## Overview

A complete, interactive web application that models and solves the Fuel Distribution Crisis in Bangladesh as a Constraint Satisfaction Problem (CSP). The application provides real-time visualization, multiple solving algorithms, and comprehensive performance analysis.

## ✅ Completed Features

### 1. CSP Problem Definition
- **Variables**: Fuel stations, distributors, vehicles with complete attributes
- **Domains**: Time windows, distance constraints, vehicle ranges, quotas
- **Constraints**: 
  - Range constraint (vehicles can only reach stations within range)
  - Capacity constraint (station min/max levels)
  - Temporal constraint (time windows for refueling)
  - Quota constraint (distributor supply limits)
  - Irrational behavior penalty (>20% deviation from optimal)
  - Conflict constraint (no simultaneous assignments)

### 2. Six CSP Algorithms Implemented

All algorithms are fully functional and return complete metrics:

1. **Backtracking Search** (`src/csp/backtracking.js`)
   - Naive exhaustive assignment with constraint checking
   - Tracks backtracks and constraint checks

2. **Forward Checking** (`src/csp/forwardChecking.js`)
   - Prunes domains after each assignment
   - Detects domain wipeout early

3. **AC-3 (Arc Consistency)** (`src/csp/ac3.js`)
   - Enforces arc consistency preprocessing
   - Maintains consistency during search

4. **MRV Heuristic** (`src/csp/mrv.js`)
   - Selects variable with minimum remaining values
   - Dynamic variable ordering

5. **LCV Heuristic** (`src/csp/lcv.js`)
   - Chooses least constraining value first
   - Minimizes impact on future assignments

6. **Greedy Assignment** (`src/csp/greedy.js`)
   - Fast baseline without backtracking
   - Priority-based station ordering

### 3. Interactive Map Visualization (Leaflet.js)

**MapView Component** (`src/components/MapView.jsx`):
- OpenStreetMap tiles centered on Dhaka, Bangladesh
- Color-coded fuel station markers:
  - 🟢 Green = Adequate fuel (>50%)
  - 🟡 Yellow = Low fuel (20-50%)
  - 🔴 Red = Critical fuel (<20%)
- Distributor depot markers (color-coded squares)
- Route polylines showing assignments
- Interactive popups with detailed information
- Legend for easy interpretation
- Animation support for step-by-step visualization

### 4. Control Panel (Sidebar)

**Sidebar Component** (`src/components/Sidebar.jsx`):

**Adjustable Parameters:**
- Number of fuel stations: 5-30 (slider)
- Number of distributors: 2-10 (slider)
- Vehicle range: 50-500 km (slider)
- Max time window: 1-72 hours (slider)
- Max pump distance: 1-50 km (slider)
- Irrational behavior penalty: 0.0-3.0 (slider)
- Vehicle type: Truck (400km) / Van (250km) / Motorbike (80km)
- Algorithm selection: Individual or all algorithms
- Rush scenario toggle: Reduces time windows by 50%

**Action Buttons:**
- Generate Random Scenario
- Solve CSP
- Reset

### 5. Comparison Dashboard

**ComparisonTable Component** (`src/components/ComparisonTable.jsx`):
- Results table with columns:
  - Algorithm name
  - Solution found (✓/✗)
  - Number of assignments
  - Backtracks count
  - Constraint checks count
  - Execution time (ms)
  - Total cost
- Summary statistics cards:
  - Fastest algorithm
  - Fewest backtracks
  - Best solution cost

**ComparisonCharts Component** (`src/components/ComparisonCharts.jsx`):
- Bar chart: Backtracks per algorithm
- Bar chart: Execution time per algorithm
- Bar chart: Total cost per algorithm
- Radar chart: Overall normalized performance (4 metrics)
- All charts use Chart.js with dark theme

### 6. Cost Function

**Cost Calculation** (`src/utils/costFunction.js`):
```
Total Cost = Σ (route_distance × fuel_consumption × 1.5)
           + Σ (time_penalty × time_deviation)
           + Σ (irrational_behavior_penalty × excess_distance × 50)
```

Components:
- Route distance cost (Haversine distance × consumption)
- Time penalty (for assignments outside preferred window)
- Irrational behavior penalty (when >20% farther than nearest distributor)

### 7. Data Generation

**Synthetic Data Generator** (`src/utils/dataGenerator.js`):
- Seeded random number generator for reproducibility
- Dhaka city bounding box (23.7-24.0°N, 90.3-90.6°E)
- Realistic fuel station parameters:
  - Capacity: 500-5000L
  - Current level: Random percentage
  - Time windows: 2-24 hours
- Distributor parameters:
  - Depot locations
  - Quotas: 1000-8000L/day
  - Fleet size: 2-5 vehicles
- Rush scenario support

### 8. Utilities

**Haversine Distance** (`src/utils/haversine.js`):
- Accurate distance calculation between lat/lng coordinates
- Used for route cost and constraint checking

### 9. User Experience

- Dark theme throughout (Tailwind CSS)
- Real-time notifications (success/error/info)
- Progress tracking during solving
- Responsive layout
- Smooth animations
- No UI blocking during computation

## Technical Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS 3.4.1 (dark theme)
- **Maps**: Leaflet.js with OpenStreetMap
- **Charts**: Chart.js with react-chartjs-2
- **Language**: Pure JavaScript (ES6+)
- **No external CSP libraries** - all algorithms implemented from scratch

## Project Structure

```
fuel-crisis-csp/
├── src/
│   ├── components/
│   │   ├── MapView.jsx           # Leaflet map visualization
│   │   ├── Sidebar.jsx           # Control panel
│   │   ├── ComparisonTable.jsx   # Results table
│   │   └── ComparisonCharts.jsx  # Performance charts
│   ├── csp/
│   │   ├── backtracking.js       # Pure backtracking
│   │   ├── forwardChecking.js    # Forward checking
│   │   ├── ac3.js                # Arc consistency
│   │   ├── mrv.js                # MRV heuristic
│   │   ├── lcv.js                # LCV heuristic
│   │   └── greedy.js             # Greedy baseline
│   ├── utils/
│   │   ├── dataGenerator.js      # Synthetic data
│   │   ├── costFunction.js       # Cost calculation
│   │   └── haversine.js          # Distance utility
│   ├── App.jsx                   # Main application
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── README.md
└── PROJECT_SUMMARY.md
```

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at: **http://localhost:5173/**

## Usage Workflow

1. **Generate Scenario**: Click "Generate Random Scenario" to create fuel stations and distributors
2. **Adjust Parameters**: Use sliders to modify constraints and problem parameters
3. **Select Algorithm**: Choose one algorithm or "All Algorithms" to compare
4. **Solve**: Click "Solve CSP" to run the solver(s)
5. **Analyze**: View results on map, in comparison table, and performance charts
6. **Iterate**: Adjust parameters and re-solve to explore different scenarios

## Key Metrics Tracked

For each algorithm:
- **Solution Found**: Boolean success indicator
- **Assignments Made**: Number of stations successfully assigned
- **Backtracks**: Number of times algorithm backtracked
- **Constraint Checks**: Total constraint evaluations
- **Execution Time**: Milliseconds to complete
- **Total Cost**: Calculated cost of solution

## Integration with Lab Assignment 1

This CSP solver can be combined with pathfinding algorithms (A*, Dijkstra, BFS, DFS) from Lab Assignment 1 to create a comprehensive system:

1. **CSP Phase**: Assign distributors to stations (this application)
2. **Pathfinding Phase**: Find optimal routes on road network (Lab 1)
3. **Combined Report**: Unified documentation of both assignments

## Performance Characteristics

- **Greedy**: Fastest, may not find optimal solution
- **Backtracking**: Complete but slowest
- **Forward Checking**: Faster than pure backtracking
- **AC-3**: Good preprocessing, reduces search space
- **MRV**: Efficient variable ordering
- **LCV**: Good value ordering, reduces backtracks

## Future Enhancements (Optional)

- Real-time data integration (if API becomes available)
- Multi-day scheduling
- Vehicle routing optimization
- Fuel price optimization
- Historical data analysis
- Export results to PDF/CSV
- Save/load scenarios

## Testing Recommendations

1. **Small scenarios** (5 stations, 2 distributors): All algorithms should find solutions quickly
2. **Medium scenarios** (15 stations, 5 distributors): Compare algorithm performance
3. **Large scenarios** (30 stations, 10 distributors): Test scalability
4. **Rush scenarios**: Enable rush mode to test tight constraints
5. **Infeasible scenarios**: Reduce quotas or ranges to test failure handling

## Documentation

- **README.md**: User-facing documentation
- **PROJECT_SUMMARY.md**: This file - technical overview
- **Code comments**: Inline documentation in all files
- **JSDoc**: Function documentation for utilities

## Compliance with Requirements

✅ Complete CSP definition (V, D, C)
✅ All 6 algorithms implemented
✅ Map visualization with Leaflet.js
✅ Cost function with 3 components
✅ Interactive controls (all sliders and options)
✅ Comparison dashboard (table + 4 charts)
✅ Synthetic data generation
✅ React + Vite + Tailwind CSS
✅ No backend required
✅ Proper project structure
✅ Dark theme
✅ Real-world problem modeling
✅ Bangladesh/Dhaka context

## Status

🟢 **COMPLETE AND FUNCTIONAL**

The application is fully implemented, tested, and ready to use. All requirements from the specification have been met.
