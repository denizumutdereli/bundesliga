// @ts-ignore
const _ = require('lodash');

/*eslint-disable*/
// @ts-ignore

const GenerateFixtures = (opponents, teamsInserted) => {
    opponents = shuffle(opponents);

    // generate the rounds of matches
    const firstHalfSeasonFixtures = generateFixtures(opponents, 0, true,teamsInserted);
    const secondHalfSeasonFixtures = generateFixtures(opponents, opponents.length - 1, false, teamsInserted);
    const allFixtures = firstHalfSeasonFixtures.concat(secondHalfSeasonFixtures);
    return allFixtures;
};

function generateFixtures(opponents, roundNoOffset, alternate,teamsInserted) {
    const fixtures = [];
    const days = ['FRIDAY', 'SATURDAY', 'SUNDAY'];
    const random = Math.floor(Math.random() * 3);
    const offsetArray = generateOffsetArray(opponents);
    // @ts-ignore
    let rounds = [];
    for (let roundNo = 1; roundNo <= opponents.length - 1; roundNo++) {
        alternate = !alternate;
        const homes = getHomes(opponents, roundNo, offsetArray);
        const aways = getAways(opponents, roundNo, offsetArray);

        for (let matchIndex = 0; matchIndex < opponents.length / 2; matchIndex++) {

            if (alternate === true) {
                fixtures.push({
                    user_id: opponents[homes[matchIndex]].user_id,
                    season_id: opponents[homes[matchIndex]].season_id,
                    home_id: (_.invert(teamsInserted))[opponents[homes[matchIndex]].name],
                    away_id: (_.invert(teamsInserted))[opponents[aways[matchIndex]].name],
                    homeScore: 0,
                    awayScore: 0,
                    roundNo: roundNo + roundNoOffset,
                    matchNo: matchIndex,
                    status: 'NOTSTARTED',
                    home: opponents[homes[matchIndex]].name,
                    away: opponents[aways[matchIndex]].name,
                    venue: opponents[homes[matchIndex]].venue,
                    dayToPlay: days[random]

                });
            } else {
                fixtures.push({
                    user_id: opponents[homes[matchIndex]].user_id,
                    season_id: opponents[homes[matchIndex]].season_id,
                    home_id: (_.invert(teamsInserted))[opponents[aways[matchIndex]].name],
                    away_id: (_.invert(teamsInserted))[opponents[homes[matchIndex]].name],
                    homeScore: 0,
                    awayScore: 0,
                    status: 'NOTSTARTED',
                    matchNo: matchIndex,
                    roundNo: roundNo + roundNoOffset,
                    home: opponents[aways[matchIndex]].name,
                    away: opponents[homes[matchIndex]].name,
                    venue: opponents[aways[matchIndex]].venue,
                    dayToPlay: days[(random === 2) ? 1: 2]
                });
            }
        }
    }

    return fixtures;
}

function generateOffsetArray(opponents) {
    let offsetArray = [];
    for (let i = 1; i < opponents.length; i++) {
        offsetArray.push(i);
    }
    offsetArray = offsetArray.concat(offsetArray);
    return offsetArray;
}

function getHomes(opponents, roundNo, offsetArray) {
    const offset = opponents.length - roundNo;
    const homes = offsetArray.slice(offset, offset + opponents.length / 2 - 1);
    return [0, ...homes];
}

function getAways(opponents, roundNo, offsetArray) {
    const offset = opponents.length - roundNo + (opponents.length / 2 - 1);
    const aways = offsetArray.slice(offset, offset + opponents.length / 2);
    return aways.reverse();
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

module.exports = GenerateFixtures;