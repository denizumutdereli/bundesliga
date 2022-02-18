const BaseTeams = require("./base-teams");
// @ts-ignore
const {GenerateTeams}  = require("./generate-teams");
// @ts-ignore
const GenerateFixtures = require("./generate-fixtures");

const GenerateSeason = (name, yearStart = 2022, numberOfTeams) => {
      
  const teamNames = BaseTeams.flatMap((data) => data.name);
  
  /*fixes*/
  numberOfTeams = parseInt(numberOfTeams);
  // @ts-ignore
  yearStart = parseInt(yearStart);
 
  if(!numberOfTeams || numberOfTeams === '') numberOfTeams =18;

  if (numberOfTeams < 2) numberOfTeams = teamNames.length;
  if (numberOfTeams % 2 !== 0) numberOfTeams += 1;

  /*Hardfix! Permutation cause millions of rows.*/
  if (numberOfTeams > 100) numberOfTeams = 100;
   
  this.user_id = "",
  this.username = "",
  this.seasonName = !name ? "Bundesliga" : name;
  this.yearStart = !yearStart ? 2022 : yearStart;
  this.yearEnd = !yearStart ? 2023 : yearStart + 1;
  this.numberOfTeams = !numberOfTeams ? teamNames.length : numberOfTeams;
  this.totalWeeks = (numberOfTeams-1)*2

  return this;
};

module.exports = GenerateSeason;