

The goal of this application and its results can be broken down into two main areas: **Solving a Real-World Logistics Crisis** and **Comparing AI Strategies**.

### 1. What is the Goal of this Illustration?
The core goal is to model and solve a complex **Supply Chain / Logistics Problem** using Constraint Satisfaction Problem (CSP) algorithms. 

During a fuel crisis, there is a chaotic imbalance between supply (depots) and demand (fuel stations). If dispatchers just send trucks arbitrarily, you get "irrational behavior"—long travel distances, wasted fuel, missed delivery time-windows, and depleted stations. 

This app illustrates how AI algorithms can mathematically calculate the **perfect dispatch schedule**, ensuring that:
* No truck travels further than its fuel range allows.
* No depot exceeds its daily quota of fuel.
* Every station gets refueled within its specific required time window.
* No two distribution companies try to fill the exact same station at the exact same time.

### 2. What Do the Results Mean?
When you click **"Solve"**, the application yields two types of results:

#### A. The Map Result (The Logistical Schedule)
The resulting dashed lines on the map represent the **valid supply plan**. 
* It answers: *"Which distributor depot should send a vehicle to which fuel station, and at exactly what hour?"*
* If a station was critical (red), the algorithm successfully found a valid depot with enough quota and a truck in range to service it without breaking any rules.

#### B. The Chart/Dashboard Results (The Algorithmic Performance)
Since you are running multiple algorithms (Greedy, AC-3, Forward Checking, etc.) to solve the exact same problem, the charts show you **which AI approach is best**:
* **Total Cost:** Represents the "quality" of the logistics plan. A lower cost means the algorithm successfully matched stations to *nearby* depots and avoided late deliveries and heavy fuel consumption. (Heuristics like *LCV* usually find the cheapest routes).
* **Time (ms) & Constraint Checks:** Measures computational speed. *Greedy* might be lightning fast but provide a high-cost route, whereas *AC-3* might take a bit longer but guarantee mathematical perfection.
* **Backtracks:** Measures how many times the AI hit a "dead end" in its logic and had to undo a choice. Fewer backtracks mean the algorithm was smarter about its guesses (e.g., *MRV* guessing the hardest-to-fill stations first).