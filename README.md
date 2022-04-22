
# Demo
[Live demo on Heroku CD](https://bundesligaleague.herokuapp.com/)

# Nodejs Bundesliga Fantasy League Project

```js
const Deniz_Umut_Dereli = {
  title:
    "Senior Full Stack Developer, Software/Database Architect",
  contact: {
    linkedin: "denizumutdereli",
    email: "denizumutdereli@gmail.com",
  },
};
```
This is a demo purpose Bundesliga League project by @denizumutdereli

Nodejs Express + Mongoose (Atlas Cloud)
 
 > npm install

 > npm start
 
 > npm test

 > /api -> verifyToken middleware x-access-token in all requests

# Brief

I prepared a project about the Bundesliga league. You can create new football seasons. You can also create new teams during these seasons. The most interesting part of the project was that I messed around a bit with the Round Robin algorithm. I've searched a lot of resources but couldn't find any examples that are properly explained and that work in home and away logic. After all, I wrote it from the very beginning. Now it works very fast and perfectly.

# Serverless Deploy
> sls deploy
 
Includes warmup function to avoid cold starting and startup latency issues for the Lambda functions.


# Common Features

- Rate Limits
- JWT Auth - possible to integrate Auth0 using with AWS Authorizer
- User management (user/admin roles)
- Seasons (up to 10.000 teams)
- Custom Team Generation
- Fixtures 
  - A new approach for Round Robin algoritm including Away and Home fixtures
  - Permutation/compute time enhancements
- Simulating the fixtures
- Fixture options. (you can simulate the matches of different days separately)
- Standings
- Extendible
- Mocha & Chai Tests (12 functions)
- SLS Ready
- Postman Collection added

# Welcome

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| / | `ALL` | Empty | Api welcome response. |

# Registration & Auth (JWT)

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| /user | `POST` | { username:'James Bond', password: '007', role: 'user/admin'} | Create a new user |
| /register | `POST` | { username:'James Bond', password: '007', role: 'user/admin'} | Create a new user |
| /auth | `POST` | { username:'James Bond', password: '007'} | Getting Login and JWT Auth token |

# Users

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| /api/user | `GET` | {empty} |  List profile. (Admin role can list all users) |
| /api/user/update/:user_id | `PUT` | { username:'James Bond', password: '007', deposit:100 }| Update user info |
| /api/user/delete/:user_id | `DELETE` | Empty | Delete a user @only admins roles |

# Season

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| /api/season | `GET` | {} | List all seasons. |
| /api/season | `POST` | {seasonName:'Bundesliga', numberOfTeam:18, yearStart:2022}} | Create a new season |
| /api/season/detail/:season_id | `GET` | {} | Get details of the season |
| /api/season/delete/:season_id | `DELETE` | {} | Delete season and all related team,fixtures - owners |

# Fixtures & Teams

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| /api/fixture/:season_id | `POST` | {} | List all fixtures of the given season. |
| /api/team/:season_id | `POST` | {} | List all teams of the given season. |

# Play

| Route | HTTP Verb	 | POST body	 | Description	 |
| --- | --- | --- | --- |
| /api/season/start/:season_id | `POST` | {} | Kickoff season. |
| /api/season/fixture/play/:match_id | `PUT` | {} | Setting the score of the game manually. |
| /api/season/simulate/play/:season_id | `PUT` | {} | Setting the score of the game manually. |

[Live demo on Heroku CD](https://bundesligaleague.herokuapp.com/)

Cheers!
