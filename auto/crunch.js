const fs = require("fs");
const matchData = JSON.parse(fs.readFileSync("match-projections.json", "utf8"));

// Okay here is some code for football pickem stuff
const opponentCount = 18;
const iterations = 1000;

const myStartingWins = 0;
const opponentStartingWins = new Array(opponentCount).fill(0);

//const opponentStartingWins = [
//  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
//];

const mustWinOutright = false;

const data = convertData(matchData);
console.log(data);

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
    myPicks.map((v) => getNFLAbbreviation(v)).join("-"),
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
console.log(["Matchup ", "Pick   ", "H/A ", "Win%", "Diff", "Value"].join(" "));
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
