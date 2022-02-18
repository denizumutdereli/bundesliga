const express = require('express');
const User = require('../models/User');
const rateLimit = require("express-rate-limit");
const Season = require('../models/Season');
const router = express.Router();
const GenerateSeason = require('../factory/generate-season');
const GenerateTeams = require('../factory/generate-teams');
const GenerateFixtures = require('../factory/generate-fixtures');
const mongoose = require("mongoose");


const SeasonLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 1 create account requests per `window` (here, per hour)
  message: {
    status: false,
    message:"Too many conections by same IP, please follow-up x-limits and try again after an hour later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @api {get} /api/season
 * @apiName Show All Season List
 * @apiPermission JWT Token
 * @apiGroup User (all users)
 *
 * @apiParam  {String} [token] token
 * @apiParam  {Number} page  -> Paggination: current page : Default:1
 * @apiParam  {Number} perpage -> Paggination: number of items per page
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes
 * 
 * @apiSuccess (200) {Object} mixed `Season` object(s)
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

router.get(['/', '/all', '/full'], SeasonLimiter, (req, res) => {
	const promise = Season.aggregate([ //Mongodb
		{
			$lookup: {
				from: 'users',
				localField: 'user_id',
				foreignField: '_id',
				as: 'user'
			}
		},
		{
			$unwind: {
				path: '$user',
			}
		},
		  {
			$project: {
				_id: '$_id',
				seasonName: '$seasonName',
				numberOfTeams: '$numberOfTeams',
        totalWeeks: '$totalWeeks',
        currentWeek: '$currentWeek',
        status: '$status' 
			}
		}
	]);

	promise.then((data) => {res.json({status:true, data:data});	}).catch((err) => {res.json(err);})});

/**
 * @api {post} /api/season
 * @apiName Create New Season, teams and fixtures
 * @apiPermission JWT Token
 * @apiGroup User (all users)
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} seasonName
 * @apiParam  {Number} numberOfTeams -> Schema fixed to 100. I tested with 10K with no problem.
 * @apiParam  {Number} page  -> Paggination: current page : Default:1
 * @apiParam  {Number} perpage -> Paggination: number of items per page
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes
 * 
 * @apiNote Permutation: fixture formula is: n*n-1 + team rows + computing time
 * @apiNote Workchain: GenerateSeason, GenerateTeams, GenerateFixtures
 * @apiNote Please check "factory" directory. Round algortihm works for the permutation.
 * 
 * @apiSuccess (200) {Object} mixed
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

router.post('/', SeasonLimiter, function (req, res, next) {

    let userid = req.decoded.username;
    let userRole = req.decoded.role;
    let param = { username: userid };

    if (userRole !== 'user')
      res.status(400).json({ status: false, message: 'Only users can create seasons' });
    else { 

      const _promise = User.find(param).select({ _id: 1 });

      _promise.then(data => {
          return !data ? next({ message: 'Not added!', code: 0 }) : data;
      }).then((data) => {

        const { seasonName, numberOfTeams, yearStart } = req.body;

        if(!numberOfTeams || !seasonName) return res.status(400).json({ status: false, error: "seasonName and numberOfTeams are required!"});

        const seasonEntity = GenerateSeason(seasonName, yearStart, numberOfTeams);
     
        seasonEntity.user_id =  data[0].id;
        seasonEntity.username = userid;
 
        const seasonSave = new Season(seasonEntity);

        if(seasonSave.save()) return seasonSave;
        else next({status:false, error: 'Not added!', code: 0});
        
      }).then( (data => {
        const season_id = data.id;         
        //const teamNames = BaseTeams.flatMap((data) => data.name);
        const teamsEntity = GenerateTeams(data.numberOfTeams, data.user_id, season_id);
        if(teamsEntity) return teamsEntity;
        else next({status:false, error: 'Not added!', code: 0});
      })).then( data => {
        // @ts-ignore
        const teamCollection = mongoose.model('teams').insertMany(data,forceServerObjectId=true,function (err,saveData){
          if(err) next({status:false, error:err});
          const fixturePromise = new Promise(function (resolve, reject) {
           resolve(saveData);
          }).then( data => {
            let teamsInserted = [];
            // @ts-ignore
              data.forEach(team => { teamsInserted[team.id] = team.name; } );
              return teamsInserted;
             }).then( data => {
              const fixturesEntity = GenerateFixtures(saveData,data);
              return fixturesEntity;
              
             }).then( data => {
              const fixturesCollection = mongoose.model('fixtures').insertMany(data);
              return res.json({status:true, message:'Season added successfully'}); //avoid multiple rings
             }).catch((error) => {
             next({ status:false, error:error });
            });  
        });
      });

    }
  });

/**
 * @api {get} /season/detail/:season_id
 * @apiName Show Season Detail - No action
 * @apiPermission JWT Token
 * @apiGroup User (all users)
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} [season_id] season_id
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes
 * 
 * @apiNote Season and Fixture statuses are Enum types. For future upgrade.
 * 
 * @apiSuccess (200) {Object} mixed `Season` object
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

router.get('/detail/:season_id', SeasonLimiter, (req, res, next) => {
  let userid = req.decoded.username;
  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/)) {

    const promise = Season.findOne({_id: req.params.season_id}); // to restrict to only owners username: userid

    promise.then((data) => {
      !data ? next({ message: 'Season Not found!', code: 0 }) : res.json({status:true, data:data});
    }).catch( (e)=>{res.json({status:false, error:e.message})} );;

  } else res.json({status: false, message: 'invalid season id'});

});

/**
 * @api {delete} /season/delete:season_id
 * @apiName Delete Season - mongoose Schema.pre.remove.relation functions, 
 * @apiPermission JWT Token and only user.role == admin
 * @apiGroup User (season owners) - Admins are not permited 
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} season_id
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes  (UserLimiter not in charge)
 * 
 * @apiFixing if user_id is different then the authenticated user's id, 
 * return {status:false, message:'You can only delete your own seasons.'}
 * 
 * @apiSuccess (200) {Object} mixed `Result` object
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

router.delete('/delete/:season_id', SeasonLimiter, (req, res, next) => {

  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {

    let userid = req.decoded.username;

    const update = Season.findById(req.params.season_id).select({user_id:1, username:1, _id:1}) 

    update.then( (data)=> {
      if(!data) {next({ message: 'Season not found!', code: 0 })}
      else if(userid != data.username){ next({status:false, message:'You can only delete your own seasons.'}) } //to permit admin: (userid != data.username && userrole!='admin')
      else { 

        const promise  = mongoose.model('seasons').findOneAndDelete({id:req.params.season_id});

        promise.then((data) => {
          !data ? next({ message: 'Season can not be deleted', code: 0 }) : res.json({status:true, message:'Season deleted!'});
        }).catch( (e)=>{res.json({status:false, error:e.message})} );

      }}).catch( (e)=>{res.json({status:false, error:e.message})} );

    }
      else res.json({status:false, message: 'invalid id or empty data'});

});


/**
 * @api {post} /season/start/:season_id No action
 * @apiName Starting the Season : for future ie. an another cron to simulate fixtures etc.
 * @apiPermission JWT Token and only user.role == admin
 * @apiGroup User (season owners) - Admins are not permited
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} season_id
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes  (UserLimiter not in charge)
 * 
 * @apiFixing if user_id is different then the authenticated user's id, 
 * return {status:false, message:'You can only simulate your own seasons.'}
 * 
 * @apiSuccess (200) {Object} mixed `Result` object
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

 router.post('/start/:season_id', SeasonLimiter, (req, res, next) => {

  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {

    let userid = req.decoded.username;

    const update = Season.findById(req.params.season_id).select({user_id:1, username:1, _id:1, status:1}) 

    update.then( (data)=> {
      if(!data) {next({ message: 'Season not found!', code: 0 })}
      else if(userid != data.username){ next({status:false, error:'You can only start your own seasons.'}) } //to permit admin: (userid != data.username && userrole!='admin')
      else { 

        if(data.status !== 'NOTSTARTED') next({status:false, message: `League has status ${data.status}`}) //I am passing sentimental messaging as this is for demo purpose

        const promise  = mongoose.model('seasons').updateOne({id:req.params.season_id}, {status:'KICKOFF'});

        promise.then((data) => {
          !data ? next({ message: 'Season can not be started', code: 0 }) : res.json({status:true, message:'Season started! Now you can post matchs or simulate the league.'});
        }).catch( (e)=>{res.json({status:false, error:e.message})} );//admin can update anyone

      }}).catch( (e)=>{res.json({status:false, error:e.message})} );//admin can update anyone

    }
      else res.json({status:false, message: 'invalid id or empty data'});

});

/**
 * @api {put} /season/simulate/:season_id 
 * @apiName Simulating the Season 
 * @apiPermission JWT Token and only user.role == admin
 * @apiGroup User (season owners) - Admins are not permited
 *
 * @apiParam  {String} [token] token
 * @apiParam  {String} season_id
 * @apiParam  {String} weeks : default 1, how many weeks do you want to simulate. max is length of the league
 * @apiParam  {String} days : enum [FRIDAY,SATURDAY,SUNDAY] //uncomment for to simulate given day mathcs
 * 
 * @rateLimit 1 Hour Window (IP) / Request limit:50 / JWT 12 minutes  (UserLimiter not in charge)
 * 
 * @apiFixing if user_id is different then the authenticated user's id, 
 * return {status:false, message:'You can only simulate your own fixtures.'}
 * 
 * @apiNote Individual match updates will be ignored and season fixtures will be continue as expected.
 * 
 * @apiSuccess (200) {Object} mixed `Result` object
 * @apiError (400) {Object} {status: false, message: message} //code:0 for I/O signals for demo purpose
 **/

 router.put('/simulate/:season_id', SeasonLimiter, (req, res, next) => {

  if (req.params.season_id.match(/^[0-9a-fA-F]{24}$/) || !req.body) {

    let userid = req.decoded.username;

    const update = Season.findById(req.params.season_id).select({user_id:1, username:1, _id:1, seasonName:1, status:1, currentWeek:1, numberOfTeams : 1,totalWeeks:1}) 

    update.then( (data)=> {
      if(!data) {next({ message: 'Season not found!', code: 0 })}
      else if(userid != data.username){ next({status:false, error:'You can only simulate your own seasons.'}) } //to permit admin: (userid != data.username && userrole!='admin')
      else { 

        const seasonName = data.seasonName;
        const numberOfTeams = data.numberOfTeams;

        if(data.status === 'COMPLETED' || data.totalWeeks <= data.currentWeek) return next({status:false, message: `League has already been ${data.status}`})

        //if(data.status !== 'NOTSTARTED') next({status:false, message: `League has status ${data.status}`}) in case if we want restrict of usage previously set the status update!
  
        //construction
        let { weeks, days } = req.body;

        let currentWeek = parseInt(data.currentWeek);
        const totalWeeks = parseInt(data.totalWeeks);
        weeks  = !weeks ? 1 : parseInt(weeks); //default 1 week simulation
        
        // let dayquery = {};
        // if(days) { //future update. for now, quick session
        //   let daysparam = ['FRIDAY', 'SATURDAY', 'SUNDAY'];
        //   console.log(daysparam.indexOf(days.toUpperCase()))
        //   if(daysparam.indexOf(days.toUpperCase()) === -1) return next({status:false, message: `Please set the day FRIDAY, SATURDAY OR SUNDAY`})
        //   else {
        //     dayquery = {dayToPlay :days.toUpperCase()};
        // }
         
        const standings = false;
       
        const search = {season_id:req.params.season_id, roundNo: { $gte:currentWeek+1, $lte: currentWeek+weeks}, status: { $ne: 'COMPLETED'} };
 
        const promise  = mongoose.model('fixtures').find(search);

 
        promise.then((data) => {
          if(!data) next({ message: 'Season can not be simulated', code: 0 });
         
          let bulkArr = [];
          let homeArr = [];
          let awayArr = [];

          data.forEach(element => { 

          let goalHomeIndex;
          let goalAwayIndex;

          //:)
          goalHomeIndex = element.home.trim() === 'FC Bayern München' ? 8 : 5;
          goalAwayIndex = element.away.trim() === 'FC Bayern München' ? 6 : 4;

          const homeScore = (Math.floor(Math.random() * goalHomeIndex));
          const awayScore = (Math.floor(Math.random() * goalAwayIndex));
          let homePoint = 0;
          let awayPoint = 0;
          let homeWin   = 0; 
          let homeLost  = 0;
          let homeDraw  = 0;
          let awayWin   = 0;  
          let awayLost  = 0;
          let awayDraw  = 0;

          if(homeScore > awayScore)  {homePoint = 3; homeWin = 1; awayLost = 1;}
          if(awayScore > homeScore)  { awayPoint = 3;  awayWin = 1; homeLost = 1;} 
          if(awayScore === homeScore)  { awayPoint = 1; homePoint = 1;  homeDraw = 1; awayDraw = 1;} 
    
          bulkArr.push({
                updateOne: {
                    "filter": { _id: element._id }, 
                    "update": { '$set': { 
                    'homeScore': homeScore, 
                    'awayScore': awayScore,
                    'status': 'COMPLETED',
                  } }
                }
            });
            
            homeArr.push({
                updateOne: {
                    "filter": { _id: element.home_id, status: { $ne: 'COMPLETED'} }, 
                    "update": { $inc: { goal: homeScore, conceded: awayScore, played: 1, points: homePoint, win:homeWin, lost:homeLost, draw:homeDraw, homePlayed:1 } 
                  },
                }
            });
            
            awayArr.push({
                updateOne: {
                    "filter": { _id: element.away_id, status: { $ne: 'COMPLETED'} }, 
                    "update": { $inc: { goal: awayScore, conceded: homeScore, played: 1, points: awayPoint,  win:awayWin, lost:awayLost, draw:awayDraw, awayPlayed:1 },
                  } 
                }
            });

        });
   
          let updateResult = mongoose.model('fixtures').bulkWrite(bulkArr)
          let updateHomeResult = mongoose.model('teams').bulkWrite(homeArr)
          let updateAwayResult = mongoose.model('teams').bulkWrite(awayArr)
          
          let statusUpdate = 'KICKOFF';
          if( (currentWeek + weeks) >= totalWeeks ) {statusUpdate = 'COMPLETED'; currentWeek = totalWeeks }
          else currentWeek = currentWeek + weeks;

          const updateSeason = Season.findByIdAndUpdate(req.params.season_id,
            {status: statusUpdate, currentWeek: currentWeek},
            { new: true, runValidators: true }
          );

          updateSeason.then( (err, season)  => { 
              
          return  res.json({status:true, message: `Season ${seasonName} simulated for ${weeks} week(s)`, data:season }); }); //min. response data to avoid lambda buffer

        }).catch( (e)=>{res.json({status:false, error:e.message})} );

      }}).catch( (e)=>{res.json({status:false, error:e.message})} );

    }
      else res.json({status:false, message: 'invalid id or empty data'});

});

module.exports = router;