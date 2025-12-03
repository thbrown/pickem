// Okay here is some code for football pickem stuff
const opponentCount = 18;
const iterations = 10000;

const myStartingWins = 0;
const opponentStartingWins = new Array(opponentCount).fill(0);
//const opponentStartingWins = [
//  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
//];

const mustWinOutright = false;

const inputPicks = [
  "Washington 25% Philadelphia 75%",
  "Green Bay 92% Chicago 8%",
  "Jacksonville 1% Detroit 99%",
  "Las Vegas 7% Miami 93%",
  "LAR 84% New England 16%",
  "Cleveland 21% New Orleans 79%",
  "Baltimore 62% Pittsburgh 38%",
  "Minnesota 97% Tennessee 3%",
  "Atlanta 33% Denver 67%",
  "Seattle 6% San Francisco 94%",
  "Kansas City 34% Buffalo 66%",
  "Cincinnati 35% LAC 65%",
  "Indianapolis 44% NYJ 56%",
  "Houston 94% Dallas 6%",
];

const inputWins = [
  "RAMS 64%",
  "PACKERS 63%",
  "SAINTS 59%",
  "STEELERS 52%",
  "BRONCOS 53%",
  "CHARGERS 61%",
  "TEXANS 70%",
  "DOLPHINS 73%",
  "LIONS 81%",
  "VIKINGS 70%",
  "JETS 55%",
  "49ERS 80%",
  "BILLS 64%",
];

const teamMapping = {
  Arizona: { abbreviation: "ARI", name: "Cardinals" },
  Atlanta: { abbreviation: "ATL", name: "Falcons" },
  Baltimore: { abbreviation: "BAL", name: "Ravens" },
  Buffalo: { abbreviation: "BUF", name: "Bills" },
  Carolina: { abbreviation: "CAR", name: "Panthers" },
  Chicago: { abbreviation: "CHI", name: "Bears" },
  Cincinnati: { abbreviation: "CIN", name: "Bengals" },
  Cleveland: { abbreviation: "CLE", name: "Browns" },
  Dallas: { abbreviation: "DAL", name: "Cowboys" },
  Denver: { abbreviation: "DEN", name: "Broncos" },
  Detroit: { abbreviation: "DET", name: "Lions" },
  "Green Bay": { abbreviation: "GB", name: "Packers" },
  Houston: { abbreviation: "HOU", name: "Texans" },
  Indianapolis: { abbreviation: "IND", name: "Colts" },
  Jacksonville: { abbreviation: "JAX", name: "Jaguars" },
  "Kansas City": { abbreviation: "KC", name: "Chiefs" },
  "Las Vegas": { abbreviation: "LV", name: "Raiders" },
  LAC: { abbreviation: "LAC", name: "Chargers" },
  LAR: { abbreviation: "LAR", name: "Rams" },
  Miami: { abbreviation: "MIA", name: "Dolphins" },
  Minnesota: { abbreviation: "MIN", name: "Vikings" },
  "New England": { abbreviation: "NE", name: "Patriots" },
  "New Orleans": { abbreviation: "NO", name: "Saints" },
  NYG: { abbreviation: "NYG", name: "Giants" },
  NYJ: { abbreviation: "NYJ", name: "Jets" },
  Philadelphia: { abbreviation: "PHI", name: "Eagles" },
  Pittsburgh: { abbreviation: "PIT", name: "Steelers" },
  "San Francisco": { abbreviation: "SF", name: "49ers" },
  Seattle: { abbreviation: "SEA", name: "Seahawks" },
  "Tampa Bay": { abbreviation: "TB", name: "Buccaneers" },
  Tennessee: { abbreviation: "TEN", name: "Titans" },
  Washington: { abbreviation: "WAS", name: "Commanders" },
};

const data = convertData(inputPicks, inputWins);
console.log(data);

// For each combo
let bestPicks = [];
let bestWinPercentage = 0;
const allResults = {};
const possiblePicks = Math.pow(2, data.length);
for (let p = 0; p < possiblePicks; p++) {
  // For each game - set picks
  const myPicks = [];
  for (let j = 0; j < data.length; j++) {
    // If the bit is set
    if (p & (1 << j)) {
      // Pick the home team
      myPicks.push(data[j].home);
    } else {
      // Pick the away team
      myPicks.push(data[j].away);
    }
  }

  // For each iteration
  let myWins = myStartingWins;
  for (let i = 0; i < iterations; i++) {
    // For each game - set wins
    const winners = [];
    for (let j = 0; j < data.length; j++) {
      // If the home team won
      if (data[j].homeWinChance > Math.random()) {
        // Set home win
        winners.push(data[j].home);
      } else {
        // Set home loss
        winners.push(data[j].away);
      }
    }

    // For each opponent - set picks
    const opponentPicks = [];
    for (let o = 0; o < opponentCount; o++) {
      opponentPicks.push([]);
      // For each game - set wins
      for (let j = 0; j < data.length; j++) {
        // If the home team won
        if (data[j].homePickChance > Math.random()) {
          // Set the win
          opponentPicks[o].push(data[j].home);
        } else {
          // Set the loss
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
    //console.log("My score", myScore, "Highest opponent score", highestOpponentScore);
    if (myScore > highestOpponentScore) {
      // Won outright!
      myWins++;
    } else if (myScore === highestOpponentScore) {
      // Tied with some number of opponents, assume we each have equal chance of winning based off score (this probably isn't true?)
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
    //console.log("Winners ", winners);
    //console.log("My Picks", myPicks, myScore, highestOpponentScore);
    //console.log("Opponent Picks", opponentPicks);
  }

  const winPercentage = myWins / iterations;
  console.log(
    "Pick set",
    myPicks.map((v) => v.padStart(3, "_")).join("-"),
    "-",
    p,
    "of",
    possiblePicks,
    "win%",
    winPercentage
  );

  allResults[myPicks.join("-")] = winPercentage;
  if (winPercentage > bestWinPercentage) {
    bestPicks = myPicks;
    bestWinPercentage = winPercentage;
  }
}

console.log("Self wins", myStartingWins, "Opponent Wins", opponentStartingWins);
console.log("Best picks", bestPicks, "win%", bestWinPercentage);
console.log(["Matchup", "Winner", "H/A", "Win%", "Diff", "Value"].join("\t"));
for (let i = 0; i < data.length; i++) {
  const matchup = data[i].away + "@" + data[i].home + "\t";
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
  //console.log(bestPicks.join("-"), altered.join("-"));
  console.log(
    matchup,
    bestPicks[i] + "\t",
    homeOrAway,
    correctOdds,
    diff,
    value
  );
}

function convertData(picks, wins) {
  const teamWinChances = {};
  wins.forEach((win) => {
    const [team, percentage] = win.match(/([\w\s]+)\s(\d+)/).slice(1);
    console.log(team, percentage);
    const teamInfo = Object.values(teamMapping).find(
      (info) => info.name.toUpperCase() === team.toUpperCase()
    );
    if (teamInfo) {
      teamWinChances[teamInfo.abbreviation] = parseInt(percentage, 10) / 100;
    }
  });
  console.log(teamWinChances);

  return picks.map((pick) => {
    console.log("PICK", picks, pick);
    const [, awayCity, awayPick, homeCity, homePick] = pick.match(
      /([a-zA-Z\s]+)\s(\d+)%\s([a-zA-Z\s]+)\s(\d+)%/
    );
    const homeInfo = Object.entries(teamMapping).find(
      ([city, info]) => city.toUpperCase() === homeCity.toUpperCase()
    )[1];
    const awayInfo = Object.entries(teamMapping).find(
      ([city, info]) => city.toUpperCase() === awayCity.toUpperCase()
    )[1];

    const homeWinChance =
      teamWinChances[homeInfo.abbreviation] ||
      1 - teamWinChances[awayInfo.abbreviation];
    const homePickChance = parseInt(homePick, 10) / 100;

    return {
      home: homeInfo.abbreviation,
      away: awayInfo.abbreviation,
      homeWinChance,
      homePickChance,
    };
  });
}
