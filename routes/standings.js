const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Season = require("../models/Season");
const Team = require("../models/Team");
const _ = require('lodash');

const StandingDelimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 1 create account requests per `window` (here, per hour)
  message: {
    status: false,
    message:"Too many conections by same IP, please follow-up x-limits and try again after an hour later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
  
/**
 * @api {get} /api/standings/:season_id
 * @apiName Show Season Standings
 * @apiPermission JWT Token
 * @apiGroup User
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} season_id
 * @apiParam  {Number} page  -> Paggination: current page : Default:1  || currently disabled. 
 * @apiParam  {Number} perpage -> Paggination: number of items per page || currently disabled
 *
 * @rateLimit 1 Hour Window (IP) / Request limit:100 / JWT 12 minutes
 *
 * @apiNote Bundesliga football league rules | use uncomment for If their matches with each other are also effective...
 * @apiSuccess (200) {Object} mixed computed: Teams 
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

 router.get('/:season_id', StandingDelimiter, (req, res, next) => {

  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {
    let userid = req.decoded.username; //default parameters from JWT token. partial-stateless for demo purpose.
    let userRole = req.decoded.role;
    const param = { season_id: req.params.season_id }
     
    const promise = Season.findOne({_id: req.params.season_id}); // to restrict to only owners username: userid
  
    promise.then((season) => {
      if (!season) next({ message: 'Season Not found!', code: 0 })
      else {
   
        /*Pagination: Will do later. */
        //construction
        let { week } = req.body;

        let currentWeek = parseInt(season.currentWeek);
        const totalWeeks = parseInt(season.totalWeeks);

        //week  = !week ? currentWeek : parseInt(week);  future upgrade!
        
        // const currentPage = (!req.body.page) ? 1 : req.body.page;//2
        // const pageSize = (!req.body.perpage) ? season.numberOfTeams : req.body.perpage; //34
      
        // currentPage === 0 ? 1 : currentPage;

        // const skip = pageSize * (currentPage-1);
        // const limit = pageSize;
      
        let responseObj;
      
        //const search = {season_id:req.params.season_id,  roundNo: { $gte:currentWeek+1, $lte: currentWeek+week}, status: 'COMPLETED' }; If their matches with each other are also effective...
       
        const search = {season_id:req.params.season_id,  status: 'COMPLETED' }; 
          
        //Team.find(search).skip(skip).limit(limit).exec((err, docs) =>{
          Team.find(search).exec((err, docs) =>{
          if(err) {
              responseObj = {
                  "status": false,
                  "error": "Input is missing.",
              }
              res.status(500).send(responseObj);
          }else{
            let standings = [];
            docs.forEach( team => { 
                const obj = {
                  team_id: team.id,
                  name: team.name,
                  PL: team.played,
                  W: team.win,
                  D: team.draw,
                  L: team.lost,
                  A: team.conceded,
                  GD: team.goal,
                  Av: team.goal-team.conceded,
                  Pts: team.points
                };
                standings.push(obj);
            });

            standings = _.orderBy(standings, ['Pts', 'Av'], ['desc', 'desc']);
 
            standings.map( (x,i) => x.ranking = i+1 ); //future update - pagination

            return res.json({status:true, data: standings});
          }
      })
      }
    }).catch( (e)=>{res.json({status:false, error:e.message})});
    } else res.json({ status: false, message: "invalid season id or empty data" });

});

/**
 * @api {all} / Default Welcome
 * @apiName Welcome
 * @apiPermission Guests
 * @apiGroup User
 * 
 * @rateLimit 1 Windwos (IP) / Request limit:100 - Default Limit app.js
 * 
 * @apiSuccess (200) {Object} mixed object
 * @apiError (404) {Object} {status: true, message: message}
 **/

router.all("/", (req, res, next) => {
  res.json({ status: true, server: "Up", data: "welcome to the test api" });
});

module.exports = router;
