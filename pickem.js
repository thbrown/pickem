// Okay here is some code for football pickem stuff


const opponentCount = 21;
const iterations = 100000;


const myStartingWins = 0;
//const opponentStartingWins = new Array(opponentCount).fill(0); // [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
const opponentStartingWins = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];


const inputPicks = ['Indianapolis 4% Baltimore 96%', 'Tennessee 44% Cleveland 56%', 'Atlanta 22% Detroit 78%', 'New Orleans 49% Green Bay 51%', 'Houston 3% Jacksonville 97%', 'Denver 7% Miami 93%', 'LAC 37% Minnesota 63%', 'New England 57% NYJ 43%', 'Buffalo 84% Washington 16%', 'Carolina 5% Seattle 95%', 'Dallas 97% Arizona 3%', 'Chicago 2% Kansas City 98%', 'Pittsburgh 50% Las Vegas 50%', 'Philadelphia 86% Tampa Bay 14%', 'LAR 40% Cincinnati 60%'];


const inputWins = ['RAVENS 79%', 'DOLPHINS 76%', 'PATRIOTS 53%', 'JAGUARS 84%', 'TITANS 51%', 'LIONS 69%', 'PACKERS 62%', 'BILLS 67%', 'VIKINGS 52%', 'SEAHAWKS 65%', 'CHIEFS 82%', 'COWBOYS 78%', 'RAIDERS 53%', 'EAGLES 67%', 'BENGALS 57%'];


const teamMapping = {
"Arizona": { abbreviation: "ARI", name: "Cardinals" },
"Atlanta": { abbreviation: "ATL", name: "Falcons" },
"Baltimore": { abbreviation: "BAL", name: "Ravens" },
"Buffalo": { abbreviation: "BUF", name: "Bills" },
"Carolina": { abbreviation: "CAR", name: "Panthers" },
"Chicago": { abbreviation: "CHI", name: "Bears" },
"Cincinnati": { abbreviation: "CIN", name: "Bengals" },
"Cleveland": { abbreviation: "CLE", name: "Browns" },
"Dallas": { abbreviation: "DAL", name: "Cowboys" },
"Denver": { abbreviation: "DEN", name: "Broncos" },
"Detroit": { abbreviation: "DET", name: "Lions" },
"Green Bay": { abbreviation: "GB", name: "Packers" },
"Houston": { abbreviation: "HOU", name: "Texans" },
"Indianapolis": { abbreviation: "IND", name: "Colts" },
"Jacksonville": { abbreviation: "JAX", name: "Jaguars" },
"Kansas City": { abbreviation: "KC", name: "Chiefs" },
"Las Vegas": { abbreviation: "LV", name: "Raiders" },
"LAC": { abbreviation: "LAC", name: "Chargers" },
"LAR": { abbreviation: "LAR", name: "Rams" },
"Miami": { abbreviation: "MIA", name: "Dolphins" },
"Minnesota": { abbreviation: "MIN", name: "Vikings" },
"New England": { abbreviation: "NE", name: "Patriots" },
"New Orleans": { abbreviation: "NO", name: "Saints" },
"NYG": { abbreviation: "NYG", name: "Giants" },
"NYJ": { abbreviation: "NYJ", name: "Jets" },
"Philadelphia": { abbreviation: "PHI", name: "Eagles" },
"Pittsburgh": { abbreviation: "PIT", name: "Steelers" },
"San Francisco": { abbreviation: "SF", name: "49ers" },
"Seattle": { abbreviation: "SEA", name: "Seahawks" },
"Tampa Bay": { abbreviation: "TB", name: "Buccaneers" },
"Tennessee": { abbreviation: "TEN", name: "Titans" },
"Washington": { abbreviation: "WAS", name: "Commanders" }
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
let opponentsScores = opponentStartingWins.slice(0) ?? new Array(opponentCount).fill(0);
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
// Tied with some number of opponents, assume we each have equal chance of winning based off score (this probaby isn't true?)
const opponentsWithHighestScore = opponentsScores.reduce((prev, cur) => { return cur === highestOpponentScore ? prev + 1 : prev }, 0);//???
myWins += (1 / opponentsWithHighestScore);
}
//console.log("Winners ", winners);
//console.log("My Picks", myPicks, myScore, highestOpponentScore);
//console.log("Opponent Picks", opponentPicks);
}




const winPercentage = myWins / iterations;
console.log("Pick set", myPicks.map(v => v.padStart(3, '_')).join("-"), "-", p, "of", possiblePicks, "win%", winPercentage);


allResults[myPicks.join("-")] = winPercentage;
if (winPercentage > bestWinPercentage) {
bestPicks = myPicks;
bestWinPercentage = winPercentage;
}


}




console.log("Best picks", bestPicks, "win%", bestWinPercentage);
console.log(["Matchup", "Winner", "H/A", "Win%", "Diff", "Value"].join('\t'));
for (let i = 0; i < data.length; i++) {
const matchup = data[i].away + "@" + data[i].home + "\t";
const pickedOdds = (bestPicks[i] === data[i].home ? data[i].homePickChance : 1 - data[i].homePickChance).toFixed(2);
const correctOdds = (bestPicks[i] === data[i].home ? data[i].homeWinChance : 1 - data[i].homeWinChance).toFixed(2);
const diff = Math.abs((correctOdds - pickedOdds)).toFixed(2);
if (correctOdds == "NaN") {
console.log("ERROR", bestPicks[i], correctOdds, data[i].homeWinChance, data[i].home, data[i], bestPicks[i] === data[i].home);
}


const homeOrAway = bestPicks[i] === data[i].home ? "HOME" : "AWAY";
let altered = bestPicks.slice();
altered[i] = bestPicks[i] === data[i].home ? data[i].away : data[i].home;
const value = (allResults[bestPicks.join("-")] - allResults[altered.join("-")]).toFixed(2);
//console.log(bestPicks.join("-"), altered.join("-"));
console.log(matchup, bestPicks[i] + "\t", homeOrAway, correctOdds, diff, value);
}


function convertData(picks, wins) {
const teamWinChances = {};
wins.forEach(win => {
const [team, percentage] = win.match(/([\w\s]+)\s(\d+)/).slice(1);
console.log(team, percentage);
const teamInfo = Object.values(teamMapping).find(
info => info.name.toUpperCase() === team.toUpperCase()
);
if (teamInfo) {
teamWinChances[teamInfo.abbreviation] = parseInt(percentage, 10) / 100;
}
});
console.log(teamWinChances);


return picks.map(pick => {
const [, awayCity, awayPick, homeCity, homePick] = pick.match(
/([a-zA-Z\s]+)\s(\d+)%\s([a-zA-Z\s]+)\s(\d+)%/
);
const homeInfo = Object.entries(teamMapping).find(
([city, info]) => city.toUpperCase() === homeCity.toUpperCase()
)[1];
const awayInfo = Object.entries(teamMapping).find(
([city, info]) => city.toUpperCase() === awayCity.toUpperCase()
)[1];


const homeWinChance = teamWinChances[homeInfo.abbreviation] || (1 - teamWinChances[awayInfo.abbreviation]);
const homePickChance = parseInt(homePick, 10) / 100;


return {
home: homeInfo.abbreviation,
away: awayInfo.abbreviation,
homeWinChance,
homePickChance
};
});
}






/*
const data = [
{home: "KC", away: "DET", homeWinChance: 0.662, homePickChance: 0.90},
{home: "ATL", away: "CAR", homeWinChance: 0.66, homePickChance: 0.74},
{home: "CLE", away: "CIN", homeWinChance: 0.36, homePickChance: 0.20},
{home: "IND", away: "JAX", homeWinChance: 0.35, homePickChance: 0.13},
{home: "MIN", away: "TB", homeWinChance: 0.60, homePickChance: 0.93},
{home: "NO", away: "TEN", homeWinChance: 0.59, homePickChance: 0.61},
{home: "PIT", away: "SF", homeWinChance: 0.45, homePickChance: 0.32},
{home: "WAS", away: "ARI", homeWinChance: 0.76, homePickChance: 0.87},
{home: "BAL", away: "HOU", homeWinChance: 0.84, homePickChance: 0.95},
{home: "CHI", away: "GB", homeWinChance: 0.53, homePickChance: 0.67},
{home: "DEN", away: "LV", homeWinChance: 0.591, homePickChance: 0.73},
{home: "NE", away: "PHI", homeWinChance: 0.44, homePickChance: 0.08},
{home: "LAC", away: "MIA", homeWinChance: 0.54, homePickChance: 0.65},
{home: "SEA", away: "LAR", homeWinChance: 0.68, homePickChance: 0.84},
{home: "NYG", away: "DAL", homeWinChance: 0.46, homePickChance: 0.33},
{home: "NYJ", away: "BUF", homeWinChance: 0.40, homePickChance: 0.27}
];*/

