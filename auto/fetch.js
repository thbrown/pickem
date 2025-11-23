const { match } = require("assert");
const https = require("https");
const { JSDOM } = require("jsdom");
const fs = require("fs").promises;
const path = require("path");

async function fetchStatsInsiderData() {
  const url =
    "https://levy-edge.statsinsider.com.au/matches/upcoming?Sport=NFL&days=7&strip=true&best_bets=true";

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error("Failed to parse JSON: " + error.message));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function normalizeTeamName(displayName) {
  // Map team names to standardized uppercase format for wins array
  const teamMappings = {
    // Los Angeles Rams
    "LA Rams": "RAMS",
    "Los Angeles (LAR)": "RAMS",
    "Los Angeles Rams": "RAMS",
    "St. Louis": "RAMS", // Historical name mapping
    LAR: "RAMS",

    // Green Bay Packers
    "Green Bay": "PACKERS",
    "Green Bay Packers": "PACKERS",
    GB: "PACKERS",

    // New Orleans Saints
    "New Orleans": "SAINTS",
    "New Orleans Saints": "SAINTS",
    NO: "SAINTS",

    // Pittsburgh Steelers
    Pittsburgh: "STEELERS",
    "Pittsburgh Steelers": "STEELERS",
    PIT: "STEELERS",

    // Denver Broncos
    Denver: "BRONCOS",
    "Denver Broncos": "BRONCOS",
    DEN: "BRONCOS",

    // Los Angeles Chargers
    "LA Chargers": "CHARGERS",
    "Los Angeles Chargers": "CHARGERS",
    "Los Angeles (LAC)": "CHARGERS",
    "San Diego": "CHARGERS", // Historical name mapping
    "San Diego Chargers": "CHARGERS", // Historical name mapping
    LAC: "CHARGERS",
    SD: "CHARGERS", // Historical abbreviation

    // Houston Texans
    Houston: "TEXANS",
    "Houston Texans": "TEXANS",
    HOU: "TEXANS",

    // Miami Dolphins
    Miami: "DOLPHINS",
    "Miami Dolphins": "DOLPHINS",
    MIA: "DOLPHINS",

    // Detroit Lions
    Detroit: "LIONS",
    "Detroit Lions": "LIONS",
    DET: "LIONS",

    // Minnesota Vikings
    Minnesota: "VIKINGS",
    "Minnesota Vikings": "VIKINGS",
    MIN: "VIKINGS",

    // New York Jets
    "NY Jets": "JETS",
    "New York Jets": "JETS",
    "New York (NYJ)": "JETS",
    NYJ: "JETS",

    // San Francisco 49ers
    "San Francisco": "NINERS",
    "San Francisco 49ers": "NINERS",
    SF: "NINERS",
    "49ERS": "NINERS",

    // Buffalo Bills
    Buffalo: "BILLS",
    "Buffalo Bills": "BILLS",
    BUF: "BILLS",

    // Dallas Cowboys
    Dallas: "COWBOYS",
    "Dallas Cowboys": "COWBOYS",
    DAL: "COWBOYS",

    // Philadelphia Eagles
    Philadelphia: "EAGLES",
    "Philadelphia Eagles": "EAGLES",
    PHI: "EAGLES",

    // Kansas City Chiefs
    "Kansas City": "CHIEFS",
    "Kansas City Chiefs": "CHIEFS",
    KC: "CHIEFS",

    // Baltimore Ravens
    Baltimore: "RAVENS",
    "Baltimore Ravens": "RAVENS",
    BAL: "RAVENS",

    // Cincinnati Bengals
    Cincinnati: "BENGALS",
    "Cincinnati Bengals": "BENGALS",
    CIN: "BENGALS",

    // Cleveland Browns
    Cleveland: "BROWNS",
    "Cleveland Browns": "BROWNS",
    CLE: "BROWNS",

    // Indianapolis Colts
    Indianapolis: "COLTS",
    "Indianapolis Colts": "COLTS",
    IND: "COLTS",

    // Jacksonville Jaguars
    Jacksonville: "JAGUARS",
    "Jacksonville Jaguars": "JAGUARS",
    JAX: "JAGUARS",
    JAC: "JAGUARS", // Alternative abbreviation sometimes used

    // Tennessee Titans
    Tennessee: "TITANS",
    "Tennessee Titans": "TITANS",
    TEN: "TITANS",

    // Atlanta Falcons
    Atlanta: "FALCONS",
    "Atlanta Falcons": "FALCONS",
    ATL: "FALCONS",

    // Carolina Panthers
    Carolina: "PANTHERS",
    "Carolina Panthers": "PANTHERS",
    CAR: "PANTHERS",

    // Tampa Bay Buccaneers
    "Tampa Bay": "BUCCANEERS",
    "Tampa Bay Buccaneers": "BUCCANEERS",
    TB: "BUCCANEERS",
    TAM: "BUCCANEERS", // Less common abbreviation

    // Seattle Seahawks
    Seattle: "SEAHAWKS",
    "Seattle Seahawks": "SEAHAWKS",
    SEA: "SEAHAWKS",

    // Arizona Cardinals
    Arizona: "CARDINALS",
    "Arizona Cardinals": "CARDINALS",
    ARI: "CARDINALS",
    ARZ: "CARDINALS", // Alternative abbreviation

    // Las Vegas Raiders
    "Las Vegas": "RAIDERS",
    "Las Vegas Raiders": "RAIDERS",
    Oakland: "RAIDERS", // Historical name mapping
    "Oakland Raiders": "RAIDERS", // Historical name mapping
    LV: "RAIDERS",
    LVR: "RAIDERS", // Alternative abbreviation
    OAK: "RAIDERS", // Historical abbreviation

    // Chicago Bears
    Chicago: "BEARS",
    "Chicago Bears": "BEARS",
    CHI: "BEARS",

    // Washington Commanders
    Washington: "COMMANDERS",
    "Washington Commanders": "COMMANDERS",
    "Washington Football Team": "COMMANDERS", // Historical name mapping
    "Washington Redskins": "COMMANDERS", // Historical name mapping
    WAS: "COMMANDERS",
    WSH: "COMMANDERS", // Alternative abbreviation

    // New York Giants
    "NY Giants": "GIANTS",
    "New York (NYG)": "GIANTS",
    "New York Giants": "GIANTS",
    NYG: "GIANTS",

    // New England Patriots
    "New England": "PATRIOTS",
    "New England Patriots": "PATRIOTS",
    NE: "PATRIOTS",
  };

  return teamMappings[displayName] || displayName?.toUpperCase();
}

async function scrapePickemData() {
  const url =
    "https://football.fantasysports.yahoo.com/pickem/pickdistribution";

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let html = "";

        response.on("data", (chunk) => {
          html += chunk;
        });

        response.on("end", () => {
          try {
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Get the pick distribution elements
            const pickElements = document.getElementsByClassName(
              "ysf-pickdistribution-picks"
            )[0];

            if (!pickElements) {
              throw new Error("Could not find pick distribution elements");
            }

            const games = pickElements.children;
            const inputPicks = [];

            for (let i = 0; i < games.length; i++) {
              const game = games[i];

              // Skip if not a matchup div
              if (!game.classList.contains("ysf-matchup-dist")) {
                continue;
              }

              try {
                // Get favorite team info
                const favoriteSection = game.querySelector("dl.favorite");
                const underdogSection = game.querySelector("dl.underdog");
                const date = new Date(
                  game.querySelector("h4 span").innerHTML + " 2025"
                );
                //console.log(`Game date: ${date}`);

                if (!favoriteSection || !underdogSection) {
                  console.warn(
                    `Skipping game ${i}: Missing favorite or underdog section`
                  );
                  continue;
                }

                // Extract favorite team name and percentage
                const favoriteTeamElement =
                  favoriteSection.querySelector("dd.team a");
                const favoritePercentElement =
                  favoriteSection.querySelector("dd.percent");

                // Extract underdog team name and percentage
                const underdogTeamElement =
                  underdogSection.querySelector("dd.team a");
                const underdogPercentElement =
                  underdogSection.querySelector("dd.percent");

                if (
                  !favoriteTeamElement ||
                  !favoritePercentElement ||
                  !underdogTeamElement ||
                  !underdogPercentElement
                ) {
                  console.warn(`Skipping game ${i}: Missing required elements`);
                  continue;
                }

                // Get team names (clean up text)
                let favoriteTeam = favoriteTeamElement.textContent.trim();
                let underdogTeam = underdogTeamElement.textContent.trim();

                // Get percentages
                const favoritePercent =
                  favoritePercentElement.textContent.trim();
                const underdogPercent =
                  underdogPercentElement.textContent.trim();

                // Clean up team names (remove common abbreviations inconsistencies)
                favoriteTeam = normalizeTeamName(favoriteTeam);
                underdogTeam = normalizeTeamName(underdogTeam);

                // Format the output string
                const gameString = {
                  fanUnderdogTeam: underdogTeam,
                  fanUnderdogPercent: parseFloat(underdogPercent) / 100,
                  fanFavoriteTeam: favoriteTeam,
                  fanFavoritePercent: parseFloat(favoritePercent) / 100,
                  date,
                };
                inputPicks.push(gameString);
              } catch (error) {
                console.warn(`Error processing game ${i}:`, error.message);
              }
            }

            resolve(inputPicks);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function extractTeamsFromPicks(picks) {
  return picks
    .map((pick) => {
      // Parse "Team1 X% Team2 Y%" format
      const parts = pick.match(/^(.+?)\s+\d+%\s+(.+?)\s+\d+%$/);
      if (parts) {
        return {
          team1: parts[1].trim(),
          team2: parts[2].trim(),
        };
      }
      return null;
    })
    .filter(Boolean);
}

function matchStatsToPickGames(statsData, picks) {
  const matchedGames = [];
  const matchedProjections = [];

  picks.forEach((pickGame, pickIndex) => {
    let matchFound = false;

    statsData.forEach((statsGame) => {
      if (matchFound) return;

      const { MatchData, PreData } = statsGame;
      if (!MatchData || !PreData) return;

      const awayTeam = MatchData.AwayTeam;
      const homeTeam = MatchData.HomeTeam;
      const date = new Date(MatchData.Date);
      //console.log(`Stats game date: ${date}`);

      // Normalize team names for comparison
      const awayNormalized = normalizeTeamName(awayTeam.DisplayName);
      const homeNormalized = normalizeTeamName(homeTeam.DisplayName);

      /*
      console.log(
        JSON.stringify(awayTeam, null, 2),
        awayTeam["DisplayName"],
        awayTeam.DisplayName,
        awayNormalized
      );*/

      // Check if this stats game matches the pick game
      //console.log(
      //  `Comparing pick ${pickIndex}: ${pickGame.team1} vs ${pickGame.team2} on ${pickGame.date} with stats game: ${awayNormalized} vs ${homeNormalized} on ${date}`
      //);
      const pickTeam1Normalized = normalizeTeamName(pickGame.fanFavoriteTeam);
      const pickTeam2Normalized = normalizeTeamName(pickGame.fanUnderdogTeam);

      if (
        (awayNormalized === pickTeam1Normalized &&
          homeNormalized === pickTeam2Normalized) ||
        (awayNormalized === pickTeam2Normalized &&
          homeNormalized === pickTeam1Normalized &&
          date.getTime() === pickGame.date.getTime())
      ) {
        // Found a match!
        const awayWinProb = PreData.PythagAway;
        const homeWinProb = PreData.PythagHome;
        const awayScore = PreData.PredAwayScore;
        const homeScore = PreData.PredHomeScore;

        // Determine favorite and format win probability
        let favoriteTeam, favoriteProb;
        if (awayWinProb > homeWinProb) {
          favoriteTeam = normalizeTeamName(awayTeam.DisplayName);
          favoriteProb = Math.round(awayWinProb * 100) / 100;
        } else {
          favoriteTeam = normalizeTeamName(homeTeam.DisplayName);
          favoriteProb = Math.round(homeWinProb * 100) / 100;
        }

        // Store projection info
        matchedProjections.push({
          awayTeam: normalizeTeamName(awayTeam.DisplayName),
          homeTeam: normalizeTeamName(homeTeam.DisplayName),
          awayScore: awayScore.toFixed(1),
          homeScore: homeScore.toFixed(1),
          favoriteTeam: favoriteTeam,
          favoriteProb,
          fanFavoriteTeam: pickGame.fanFavoriteTeam,
          fanFavoritePercent: pickGame.fanFavoritePercent,
          margin: Math.abs(PreData.PredMargin).toFixed(1),
          date: new Date(date).toLocaleString(),
        });

        matchFound = true;
      }
    });

    if (!matchFound) {
      console.warn(
        `No stats data found for pick game: ${pickGame.team1} vs ${pickGame.team2}`
      );
      //throw new Error(
      //  "Unmatched pick game" + JSON.stringify(pickGame, null, 2)
      //);
    }
  });

  return matchedProjections;
}

// Main execution
async function main() {
  try {
    console.log("Fetching data from multiple sources...\n");

    // Fetch Yahoo Sports pick distribution
    console.log("1. Scraping Yahoo Sports pick distribution...");
    const picks = await scrapePickemData();

    // Extract team pairs from picks
    console.log(`Found ${picks.length} games in pick distribution`);
    console.log(
      picks.map((p) => `${p.fanFavoriteTeam} vs ${p.fanUnderdogTeam}`)
    );

    // Fetch Stats Insider win probabilities
    console.log("2. Fetching Stats Insider win probabilities...");
    const statsData = await fetchStatsInsiderData();
    console.log(`Found ${statsData.length} games in stats data`);

    // Match stats data to pick games only
    const matchedProjections = matchStatsToPickGames(statsData, picks);
    console.log(`Matched ${matchedProjections.length} games between sources\n`);

    // Output picks array
    console.log("=== PICK DISTRIBUTION ===");
    console.log(
      picks
        .map(
          (p) =>
            `${p.fanFavoriteTeam} ${p.fanFavoritePercent}% ${
              p.fanUnderdogTeam
            } ${p.fanUnderdogPercent}% @ ${p.date.toLocaleString()}`
        )
        .join("\n")
    );

    // Output projected scores (only for matched games)
    console.log("\n=== PROJECTED SCORES (matched games only) ===");
    let max = Number.MIN_SAFE_INTEGER;
    let maxTeam = undefined;
    let min = Number.MAX_SAFE_INTEGER;
    let minTeam = undefined;
    matchedProjections.forEach((game, index) => {
      console.log(
        `Game ${index + 1}: ${game.awayTeam} ${game.awayScore} @ ${
          game.homeTeam
        } ${game.homeScore}`
      );
      console.log(`  Favorite: ${game.favoriteTeam} by ${game.margin} points`);
      if (game.awayScore > max) {
        max = game.awayScore;
        maxTeam = game.awayTeam;
      }
      if (game.homeScore > max) {
        max = game.homeScore;
        maxTeam = game.homeTeam;
      }
      if (game.awayScore < min) {
        min = game.awayScore;
        minTeam = game.awayTeam;
      }
      if (game.homeScore < min) {
        min = game.homeScore;
        minTeam = game.homeTeam;
      }
    });
    console.log(`Max score: ${maxTeam} at ${max}`);
    console.log(`Min score: ${minTeam} at ${min}`);

    // Write to file
    const fileName = `./match-projections.json`;
    const filePath = path.join(process.cwd(), fileName);

    await fs.writeFile(
      filePath,
      JSON.stringify(matchedProjections, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error fetching data:", error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  scrapePickemData,
  fetchStatsInsiderData,
  extractTeamsFromPicks,
  matchStatsToPickGames,
  normalizeTeamName,
};
