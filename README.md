## Monte Carlo pick'em simulator

# Config in crunch-p.js

```
  // Simulation parameters
  const opponentCount = 22;
  const iterations = 30000;
  const myStartingWins = 0;
  const opponentStartingWins = new Array(opponentCount).fill(0);
  const mustWinOutright = true; // Set to false if you are willing to optimize for a tie (you might just end up picking all the favorites)

  // Compute parameters
  const numWorkers = Math.min(os.cpus().length, possiblePicks) - 1;
```

# fetch.js

- Pull pick distribution data from (https://football.fantasysports.yahoo.com/pickem/pickdistribution)
- Pull win probabilities from (https://levy-edge.statsinsider.com.au)

# crunch-p.js

- For every different combination of pick'em picks for a given week ( 2 ^ [num games] combinations):
- Simulate outcome where participant picks are drawn the Yahoo pick distribution and wins are drawn from win probabilities
- Keep and report the best combination.

# To run

`node ./auto/fetch.js && node ./auto/crunch-p.js`
