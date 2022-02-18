const express = require("express");
const Fixture = require("../models/Fixture");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Season = require("../models/Season");
const mongoose = require("mongoose");

const FixturesLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 1 create account requests per `window` (here, per hour)
  message: {
    status: false,
    message:
      "Too many conections by same IP, please follow-up x-limits and try again after an hour later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @api {post} /fixtures/:season_id
 * @apiName Show Fixtures 
 * @apiPermission JWT Token
 * @apiGroup User
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} season_id
 * @apiParam  {Number} page  -> Paggination: current page : Default:1
 * @apiParam  {Number} perpage -> Paggination: number of items per page
 *
 * @rateLimit 1 Hour Window (IP) / Request limit:10 / JWT 12 minutes
 *
 * @apiSuccess (200) {Object} mixed Fixtures
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/
 
router.post('/:season_id', FixturesLimiter, (req, res, next) => {
  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {
  let userid = req.decoded.username; //default parameters from JWT token. partial-stateless for demo purpose.
  let userRole = req.decoded.role;
  const completed = (!req.body.completed) ? 0 : 1;

  let param;
  param = (completed === 1)? { season_id: req.params.season_id, status: 'COMPLETED' } : { season_id: req.params.season_id, status: 'NOTSTARTED' }

  const promise = Season.findOne({_id: req.params.season_id}); // to restrict to only owners username: userid

  promise.then((season) => {
    if (!season) next({ message: 'Season Not found!', code: 0 })
    else {
 
      const currentPage = (!req.body.page) ? 1 : req.body.page;//2
      const pageSize = (!req.body.perpage) ? 34 : req.body.perpage; //34
    
      const skip = pageSize * (currentPage-1);
      const limit = pageSize;
    
      let responseObj;

      Fixture.find(param).skip(skip).limit(limit).exec((err, docs) =>{
        if(err) {
            responseObj = {
                "status": false,
                "error": "Input is missing.",
            }
            res.status(500).send(responseObj);
        }else{
            responseObj = {
                "status": true,
                "page" : currentPage,
                "total" : season.numberOfTeams*(season.numberOfTeams-1),
                "perpage": pageSize,
                "data": {
                  season: season,
                  fixtures: docs
                }
            }
            res.status(200).send(responseObj);
        }
    })
    }
  }).catch( (e)=>{res.json({status:false, error:e.message})});
  } else res.json({ status: false, message: "invalid season id or empty data" });
});


/**
 * @api {put} /fixture/play/:match_id
 * @apiName Simulate an individual match
 * @apiPermission JWT Token
 * @apiGroup User
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} match_id
 * @apiParam  {Number} home  -> goal count!
 * @apiParam  {Number} away -> goal count!
 *
 * @rateLimit 1 Hour Window (IP) / Request limit:10 / JWT 12 minutes
 *
 * @apiNote Other fixtures will be calculated but this match will be ignored as its already been computed.
 * 
 * @apiSuccess (200) {Object} mixed
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

 router.put('/play/:match_id', FixturesLimiter, (req, res, next) => {
  if (req.params.match_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {
    let userid = req.decoded.username;
    let userRole = req.decoded.role;
    let param = { _id: req.params.match_id };
 
    let { away, home } = req.body;

    const promise = new Promise((resolve, reject) => {
          if(!away || !home) {
            return res.status(401).json({status:false, error:'Home and away scores are required!'})
          }else {
            const fixture = Fixture.findOne( {_id:req.params.match_id}).select({user_id:1, _id:1, status:1}) 
            resolve(fixture)
          }
    });

    promise.then((fixture) => {
      if(!fixture) {return next({ message: 'Fixture not found!', code: 0 })}
      //else if(userid != fixture.username){ return next({status:false, error:'You can only simulate your own fixtures.'}) } Allowed!
      else {
        if(fixture.status === 'COMPLETED') return next({status:false, message: `Fixture match has already been ${fixture.status}`})
          else {
            Fixture.findOneAndUpdate(param,
              { homeScore:home, awayScore:away, status:'COMPLETED' },
              { new: true, runValidators: true }).select({ }).then((data) => {
    
                if(!data) return next({ message: "Match not found!", code: 0 })
                else{           
                //check season status
                const updateSeason = Season.findOneAndUpdate({_id:data.season_id, status: { $ne: 'COMPLETED'} }, {status:'KICKOFF'});
         
                const homeScore = home;
                const awayScore = away;
                let homePoint = 0;
                let awayPoint = 0;
                let homeWin   = 3; //caution here!
                let homeLost  = 0;
                let homeDraw  = 0;
                let awayWin   = 0;  
                let awayLost  = 0;
                let awayDraw  = 0;

                if(homeScore > awayScore)  {homePoint = 3; homeWin = 1; awayLost = 1;}
                if(awayScore > homeScore)  { awayPoint = 3;  awayWin = 1; homeLost = 1;} 
                if(awayScore === homeScore)  { awayPoint = 1; homePoint = 1;  homeDraw = 1; awayDraw = 1;} 

                try {
                const homeUpdate = {
                  updateOne: {
                      "filter": { _id: data.home_id, status: { $ne: 'COMPLETED'} }, 
                      "update": { $inc: { goal: homeScore, conceded: awayScore, played: 1, points: homePoint, win:homeWin, lost:homeLost, draw:homeDraw, homePlayed:1 } 
                    },
                  }
              };
                const awayUpdate = {
                  updateOne: {
                      "filter": { _id: data.away_id, status: { $ne: 'COMPLETED'} }, 
                      "update": { $inc: { goal: awayScore, conceded: homeScore, played: 1, points: awayPoint,  win:awayWin, lost:awayLost, draw:awayDraw, awayPlayed:1 },
                    } 
                  }
              };
                
              // @ts-ignore
              let updateHomeResult = mongoose.model('teams').bulkWrite([homeUpdate])
              // @ts-ignore
              let updateAwayResult = mongoose.model('teams').bulkWrite([awayUpdate])
   
              }catch(e){return next(e)}
                }       
                res.json({ status: true, data: data });
              })
              .catch((e) => {
                res.json({ status: false, error: e.message });
              }); //admin can update anyone
          }
      }
      
    });
  } else res.json({ status: false, message: "invalid id or empty data" });
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
