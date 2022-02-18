// @ts-nocheck
/*Local Performance -no chunks required
Teams Render
20  35ms
50  70ms
100 150ms
1000 200s
2500 600ms 1Mb
10.000 700ms 1.8mb
*/
const _ = require('lodash');
const { uniqueNamesGenerator, animals, adjectives, starWars } = require('unique-names-generator');
const BaseTeams = require('./base-teams');
//import { v4 as uuidv4 } from 'uuid';

const teamPool = BaseTeams.flatMap(data => data.name.split(' '));

const ClubAdjuctions = [
    'Football Club',
    'FS',
    '1960',
    '1903',
    'Tigers',
    'Gücü',
    'Fenerbahce',
    'East',
    'Sportik',
    'The Avengers',
    'MVPs',
    'The Kings',
    'Hustlers',
    'Iconic',
    'Bulletproof',
    'Lightning Legends',
    'Mister Maniacs',
    'Born to Win',
    'Ninja Bros',
    'The Elite Team',
    'Dominatrix',
    'Big Shots',
    'Unstoppable Force',
    'Crew X',
    'Rule Breakers',
    'The Squad',
    'United Army',
    'Pixie Normous',
    'GodsFavouriteTeam',
    'Master Spinners',
    'Basic Boys',
    ' Nans Lads',
    'Debuggers',
    'Outliers',
    'Un-De-Feet-able',
    'Gone with the Win',
    'Charging Hulks',
    'Eagle Eyed',
    'Rey-eye Beast',
    'Jets of Giants',
    'Crispy Fried Chickens',
    'Pro Performers',
    'Raven Raiders',
    'Hawkeye Hornets',
    ' Beast Bulls',
    'Red Bull Wings',
    'No Caveat Cavaliers',
    //_.range(1800, 1960, Math.floor(Math.random() * 7) + 1) !performance
];

const Stadiums = [
    'Olimpia',
    'Stadium',
    'Arena',
    'Park'
]

const Colors = ['Blue', 'Yelow', 'Red', 'Orange', 'Black', 'White', 'Gray', 'Green'];

const GenerateTeams = async (numberOfTeams, user_id, season_id) => {
    let teams = [];
    try{
        if (numberOfTeams <= BaseTeams.length) {
            teams = _.sampleSize(BaseTeams, numberOfTeams);
            teams.map((x) => {x.user_id = user_id, x.season_id = season_id} );
        } else {
            teams = BaseTeams;
             //generateNewTeams
             for (let i = 0; i < (numberOfTeams - teams.length); i++) {  
             const promise = new Promise(function(resolve) {
                const bufName = generateNames();
                resolve(bufName)
            });
              
              promise.then(function(bufName) {
                const random = Math.floor(Math.random() * 3) + 1;
                const team = {
                    // @ts-ignore
                    user_id: user_id,
                    season_id:season_id,
                    name: bufName.trim(),
                    shortName: bufName.trim(), //will correct here!
                    clubColors: _.sampleSize(Colors, random).join(' '),
                    crestUrl: '',
                    tla: bufName.replace(/^[\s\d]+/, '').substring(0, 3).toUpperCase(),
                    venue: (bufName + ' ' + Stadiums[random]).trim()
                }
                return team;
              }).then(function(team) {
                return teams.push(team);
              });
            }
        }
    } catch(e) { //console.log(e)
        } 
    finally {return teams;}
}

function awaitAll(count, asyncFn) {
    const promises = [];
  
    for (i = 0; i < count; ++i) {
      promises.push(asyncFn());
    }
  
    return Promise.all(promises);
  }
 
function generateNames() {
    const teamName = uniqueNamesGenerator({
        dictionaries: [ClubAdjuctions, animals, adjectives, teamPool, starWars],
        length: (Math.floor(Math.random() * 3) + 1),
        separator: ' '
    });
    return teamName.replace(/(^\w{1})|(\s+\w{1})/g, word => word.toUpperCase());
}

module.exports = GenerateTeams;