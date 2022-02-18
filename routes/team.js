const express = require("express");
const Team = require("../models/Team");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Season = require("../models/Season");

const TeamsLimiter = rateLimit({
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
 * @api {post} /api/team/:season_id
 * @apiName Season Teams;
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
 * @apiNote POST Benchmark is much better right now. 
 * @apiSuccess (200) {Object} mixed Teams
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/
 
router.post('/:season_id', TeamsLimiter, (req, res, next) => {
  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {
  let userid = req.decoded.username; //default parameters from JWT token. partial-stateless for demo purpose.
  let userRole = req.decoded.role;
  const param = { season_id: req.params.season_id }
   
  const promise = Season.findOne({_id: req.params.season_id}); // to restrict to only owners username: userid

  promise.then((season) => {
    if (!season) next({ message: 'Season Not found!', code: 0 })
    else {
 
      const currentPage = (!req.body.page) ? 1 : req.body.page;//2
      const pageSize = (!req.body.perpage) ? 34 : req.body.perpage; //34
    
      const skip = pageSize * (currentPage-1);
      const limit = pageSize;
    
      let responseObj;
    
      Team.find(param).skip(skip).limit(limit).exec((err, docs) =>{
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
                "total" : season.numberOfTeams,
                "perpage": pageSize,
                "data": {
                  season: season,
                  teams: docs
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
