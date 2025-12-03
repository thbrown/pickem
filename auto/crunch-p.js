const fs = require("fs");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const os = require("os");

if (isMainThread) {
  // Main thread code
  const matchData = JSON.parse(
    fs.readFileSync("match-projections.json", "utf8")
  );

  // Simulation parameters
  const opponentCount = 22;
  const iterations = 30000;
  const myStartingWins = 0;
  const opponentStartingWins = new Array(opponentCount).fill(0);
  //const opponentStartingWins = [3,2,2,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0];

  const mustWinOutright = true;

  const data = convertData(matchData);
  console.log(data);

  const possiblePicks = Math.pow(2, data.length);

  // Compute parameters
  const freeCpuCount = Math.max(os.cpus().length - 1, 1);
  const numWorkers = Math.min(freeCpuCount, possiblePicks);

  console.log(
    `Using ${numWorkers} workers to process ${possiblePicks} combinations`
  );

  const picksPerWorker = Math.ceil(possiblePicks / numWorkers);


  let completedWorkers = 0;
  let bestPicks = [];
  let bestWinPercentage = 0;
  const allResults = {};

  // Create workers
  for (let w = 0; w < numWorkers; w++) {
    const startPick = w * picksPerWorker;
    const endPick = Math.min((w + 1) * picksPerWorker, possiblePicks);

    if (startPick >= possiblePicks) break;

    const worker = new Worker(__filename, {
      workerData: {
        data,
        startPick,
        endPick,
        iterations,
        opponentCount,
        myStartingWins,
        opponentStartingWins,
        mustWinOutright,
      },
    });

    worker.on("message", (result) => {
      // Merge results from worker
      Object.assign(allResults, result.allResults);

      if (result.bestWinPercentage > bestWinPercentage) {
        bestPicks = result.bestPicks;
        bestWinPercentage = result.bestWinPercentage;
      }

      completedWorkers++;
      console.log(`Worker ${w + 1}/${numWorkers} completed`);

      // All workers done
      if (completedWorkers === numWorkers) {
        printResults();
      }
    });

    worker.on("error", (error) => {
      console.error(`Worker error:`, error);
    });
  }

  function printResults() {
    console.log(
      "Self wins",
      myStartingWins,
      "Opponent Wins",
      opponentStartingWins
    );
    console.log("Best picks", bestPicks, "win%", bestWinPercentage);
    console.log(
      ["Matchup ", "Winner ", "H/A ", "Win%", "Diff", "Value"].join(" ")
    );

    for (let i = 0; i < data.length; i++) {
      const matchup =
        getNFLAbbreviation(data[i].away) +
        "@" +
        getNFLAbbreviation(data[i].home) +
        "\t";
      const pickedOdds = (
        bestPicks[i] === data[i].home
          ? data[i].homePickChance
          : 1 - data[i].homePickChance
      ).toFixed(2);
      const correctOdds = (
        bestPicks[i] === data[i].home
          ? data[i].homeWinChance
          : 1 - data[i].homeWinChance
      ).toFixed(2);
      const diff = Math.abs(correctOdds - pickedOdds).toFixed(2);

      if (correctOdds == "NaN") {
        console.log(
          "ERROR",
          bestPicks[i],
          correctOdds,
          data[i].homeWinChance,
          data[i].home,
          data[i],
          bestPicks[i] === data[i].home
        );
      }

      const homeOrAway = bestPicks[i] === data[i].home ? "HOME" : "AWAY";
      let altered = bestPicks.slice();
      altered[i] = bestPicks[i] === data[i].home ? data[i].away : data[i].home;

      const value = (
        allResults[bestPicks.join("-")] - allResults[altered.join("-")]
      ).toFixed(2);

      console.log(
        matchup,
        getNFLAbbreviation(bestPicks[i]) + "\t",
        homeOrAway,
        correctOdds,
        diff,
        value
      );
    }
  }
} else {
  // Worker thread code
  const {
    data,
    startPick,
    endPick,
    iterations,
    opponentCount,
    myStartingWins,
    opponentStartingWins,
    mustWinOutright,
  } = workerData;

  let bestPicks = [];
  let bestWinPercentage = 0;
  const allResults = {};

  for (let p = startPick; p < endPick; p++) {
    // For each game - set picks
    const myPicks = [];
    for (let j = 0; j < data.length; j++) {
      if (p & (1 << j)) {
        myPicks.push(data[j].home);
      } else {
        myPicks.push(data[j].away);
      }
    }

    // Run Monte Carlo simulation
    let myWins = myStartingWins;
    for (let i = 0; i < iterations; i++) {
      // Generate game results
      const winners = [];
      for (let j = 0; j < data.length; j++) {
        if (data[j].homeWinChance > Math.random()) {
          winners.push(data[j].home);
        } else {
          winners.push(data[j].away);
        }
      }

      // Generate opponent picks
      const opponentPicks = [];
      for (let o = 0; o < opponentCount; o++) {
        opponentPicks.push([]);
        for (let j = 0; j < data.length; j++) {
          if (data[j].homePickChance > Math.random()) {
            opponentPicks[o].push(data[j].home);
          } else {
            opponentPicks[o].push(data[j].away);
          }
        }
      }

      // Evaluate victory
      let myScore = myStartingWins;
      let opponentsScores =
        opponentStartingWins.slice(0) ?? new Array(opponentCount).fill(0);

      for (let j = 0; j < data.length; j++) {
        if (winners[j] === myPicks[j]) {
          myScore++;
        }
        for (let k = 0; k < opponentCount; k++) {
          if (winners[j] === opponentPicks[k][j]) {
            opponentsScores[k]++;
          }
        }
      }

      let highestOpponentScore = Math.max(...opponentsScores);

      if (myScore > highestOpponentScore) {
        myWins++;
      } else if (myScore === highestOpponentScore) {
        if (mustWinOutright) {
          myWins += 0;
        } else {
          const opponentsWithHighestScore = opponentsScores.reduce(
            (prev, cur) => {
              return cur === highestOpponentScore ? prev + 1 : prev;
            },
            0
          );
          myWins += 1 / opponentsWithHighestScore;
        }
      }
    }

    const winPercentage = myWins / iterations;
    allResults[myPicks.join("-")] = winPercentage;

    if (winPercentage > bestWinPercentage) {
      bestPicks = myPicks;
      bestWinPercentage = winPercentage;
    }

    // Progress logging (less frequent to avoid spam)
    if (p % Math.max(1, Math.floor((endPick - startPick) / 10)) === 0) {
      console.log(
        `Worker progress: ${p - startPick + 1}/${
          endPick - startPick
        } combinations processed`
      );
    }
  }

  // Send final results back to main thread
  parentPort.postMessage({
    type: "final",
    bestPicks,
    bestWinPercentage,
    allResults,
  });
}

function getNFLAbbreviation(teamName) {
  const nflTeams = {
    // AFC East
    BILLS: "BUF",
    DOLPHINS: "MIA",
    PATRIOTS: "NE ",
    JETS: "NYJ",
    // AFC North
    RAVENS: "BAL",
    BENGALS: "CIN",
    BROWNS: "CLE",
    STEELERS: "PIT",
    // AFC South
    TEXANS: "HOU",
    COLTS: "IND",
    JAGUARS: "JAX",
    TITANS: "TEN",
    // AFC West
    BRONCOS: "DEN",
    CHIEFS: "KC ",
    RAIDERS: "LV ",
    CHARGERS: "LAC",
    // NFC East
    COWBOYS: "DAL",
    GIANTS: "NYG",
    EAGLES: "PHI",
    COMMANDERS: "WAS",
    // NFC North
    BEARS: "CHI",
    LIONS: "DET",
    PACKERS: "GB ",
    VIKINGS: "MIN",
    // NFC South
    FALCONS: "ATL",
    PANTHERS: "CAR",
    SAINTS: "NO ",
    BUCCANEERS: "TB ",
    // NFC West
    CARDINALS: "ARI",
    RAMS: "LAR",
    NINERS: "SF ",
    SEAHAWKS: "SEA",
  };

  const abbr = nflTeams[teamName.toUpperCase()];
  if (abbr == null) {
    throw new Error("Unknown team name " + teamName);
  }
  return abbr;
}

function convertData(matchData) {
  return matchData.map((match) => {
    return {
      home: match.homeTeam,
      away: match.awayTeam,
      homeWinChance:
        match.homeTeam === match.favoriteTeam
          ? match.favoriteProb
          : 1 - match.favoriteProb,
      homePickChance:
        match.homeTeam === match.fanFavoriteTeam
          ? match.fanFavoritePercent
          : 1 - match.fanFavoritePercent,
    };
  });
}
