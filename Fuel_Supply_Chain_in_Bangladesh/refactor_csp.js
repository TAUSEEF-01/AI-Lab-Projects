const fs = require('fs');
const path = require('path');

const dir = './fuel-crisis-csp/src/csp';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Signature change
  content = content.replace(
    /export\s+function\s+solveCSP\s*\(\s*stations,\s*distributors,\s*params,\s*onProgress\s*\)\s*\{/,
    `export async function solveCSP(variables, domains, constraints, costFn, onProgress) {\n  const stations = variables;\n  const distributors = domains;\n  const params = constraints;`
  );

  // Update backtrack function to be async
  content = content.replace(/function\s+backtrack\s*\(/g, 'async function backtrack(');
  content = content.replace(/if\s*\(\s*backtrack\(/g, 'if (await backtrack(');
  
  // Make the start search async
  content = content.replace(/const\s+solutionFound\s*=\s*backtrack\(/g, 'const solutionFound = await backtrack(');
  
  // For greedy which doesn't use backtrack, but uses a for loop
  if (file === 'greedy.js') {
    // Add yield inside the greedy loop
    content = content.replace(/for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*sortedStations.length;\s*i\+\+\s*\)\s*\{/,
      `for (let i = 0; i < sortedStations.length; i++) {\n    await new Promise(r => setTimeout(r, 0));`);
  } else {
    // Add yield inside the backtrack function
    content = content.replace(/async\s+function\s+backtrack\s*\([^)]*\)\s*\{/,
      `$& \n    await new Promise(r => setTimeout(r, 0));`);
  }

  // Update onProgress to pass assignment
  content = content.replace(/onProgress\(([^,]+),\s*([^\)]+)\)/g, 'onProgress($1, $2, { ...assignment })');

  // Update return object to include totalCost
  const returnPattern = /return\s*\{\s*assignment:\s*solutionFound\s*\?\s*assignment\s*:\s*null,\s*backtracks([^,]*?),\s*constraintChecks,\s*timeTaken:\s*endTime\s*-\s*startTime,\s*solutionFound\s*\};/;
  
  const returnMatch = content.match(returnPattern);
  if (returnMatch) {
    const returnBlock = returnMatch[0];
    const newReturn = `let totalCost = null;\n  if (solutionFound) {\n    totalCost = costFn(assignment, stations, distributors, params);\n  }\n\n  return {\n    assignment: solutionFound ? assignment : null,\n    backtracks${returnMatch[1]},\n    constraintChecks,\n    timeTaken: endTime - startTime,\n    totalCost,\n    solutionFound\n  };`;
    content = content.replace(returnBlock, newReturn);
  } else {
    // try looser match
    const looseReturnPattern = /return\s*\{\s*assignment:[^}]+\};/s;
    const looseMatch = content.match(looseReturnPattern);
    if (looseMatch) {
      const returnBlock = looseMatch[0];
      const newReturn = `let totalCost = null;\n  if (solutionFound) {\n    totalCost = costFn(assignment, stations, distributors, params);\n  }\n\n  ` + returnBlock.replace(/return\s*\{/, "return {\n    totalCost,");
      content = content.replace(returnBlock, newReturn);
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Processed', file);
});
