# Quick Start Guide

## Installation

```bash
cd fuel-crisis-csp
npm install
```

## Running the Application

```bash
npm run dev
```

Open your browser to: **http://localhost:5173/**

## First Steps

### 1. Generate a Scenario
Click the **"Generate Random Scenario"** button in the sidebar. This creates:
- Random fuel stations across Dhaka
- Distributor depots with vehicles
- Realistic fuel levels and time windows

### 2. Explore the Map
- **Green circles** = Stations with adequate fuel
- **Yellow circles** = Stations with low fuel
- **Red circles** = Stations with critical fuel
- **Colored squares** = Distributor depots
- Click any marker to see details

### 3. Adjust Parameters (Optional)
Use the sliders to modify:
- Number of stations (5-30)
- Number of distributors (2-10)
- Vehicle range (50-500 km)
- Time constraints (1-72 hours)
- Distance limits (1-50 km)

### 4. Solve the Problem
1. Select an algorithm from the dropdown (or choose "All Algorithms")
2. Click **"Solve CSP"**
3. Wait for the solver to complete

### 5. View Results
After solving, you'll see:
- **Map**: Routes drawn from depots to assigned stations
- **Table**: Detailed metrics for each algorithm
- **Charts**: Visual comparison of performance

## Understanding the Results

### Comparison Table
- **Solution Found**: ✓ = Success, ✗ = No solution
- **Assignments**: Number of stations assigned
- **Backtracks**: How many times the algorithm backtracked
- **Constraint Checks**: Total constraint evaluations
- **Time (ms)**: Execution time
- **Total Cost**: Overall cost of the solution

### Performance Charts
1. **Backtracks Chart**: Lower is better (less searching)
2. **Time Chart**: Lower is better (faster execution)
3. **Cost Chart**: Lower is better (more efficient solution)
4. **Radar Chart**: Larger area is better (normalized performance)

## Tips

### For Quick Results
- Use fewer stations (5-10)
- Use fewer distributors (2-3)
- Select "Greedy" algorithm

### For Comparison
- Use medium scenario (10-15 stations, 3-5 distributors)
- Select "All Algorithms"
- Compare the results in charts

### For Challenge
- Use many stations (25-30)
- Enable "Rush Scenario" toggle
- Reduce vehicle range
- Try different algorithms

### If No Solution Found
The message "No feasible assignment found" means constraints are too tight. Try:
- Increase vehicle range
- Increase max pump distance
- Increase max time window
- Add more distributors
- Reduce number of stations

## Example Scenarios

### Easy Scenario
- Stations: 5
- Distributors: 3
- Vehicle: Truck (400km)
- Time Window: 24 hours
- Result: All algorithms should find solutions quickly

### Medium Scenario
- Stations: 15
- Distributors: 5
- Vehicle: Van (250km)
- Time Window: 12 hours
- Result: Good for comparing algorithm performance

### Hard Scenario
- Stations: 25
- Distributors: 4
- Vehicle: Motorbike (80km)
- Time Window: 6 hours
- Rush Scenario: ON
- Result: May not find solutions, tests algorithm limits

## Keyboard Shortcuts

- **Ctrl+R**: Refresh page (resets everything)
- **F5**: Refresh page
- **F12**: Open browser developer tools (for debugging)

## Troubleshooting

### Map Not Showing
- Check browser console for errors (F12)
- Ensure internet connection (for OpenStreetMap tiles)
- Try refreshing the page

### Solver Taking Too Long
- Reduce number of stations
- Use Greedy algorithm for quick results
- Refresh page to cancel

### Charts Not Displaying
- Ensure you've clicked "Solve CSP"
- Check that at least one algorithm found a solution
- Try refreshing the page

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Next Steps

1. **Experiment**: Try different parameter combinations
2. **Analyze**: Compare algorithm performance across scenarios
3. **Document**: Take screenshots for your lab report
4. **Integrate**: Combine with Lab Assignment 1 (Pathfinding)

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review PROJECT_SUMMARY.md for technical details
3. Inspect browser console for error messages
4. Check the code comments in src/ files

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

To preview the production build:
```bash
npm run preview
```

---

**Enjoy solving the Fuel Crisis CSP!** 🚛⛽🗺️
