const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const server = require("../app");

chai.use(chaiHttp);

const season_id = "620f1d156e002cf33a4e143c"; 
let token;

describe("/POST /api/season SIMULATION TEST", () => {
  before("LOGIN & ACCESSTOKEN", (done) => {
    chai
      .request(server)
      .post("/auth")
      .send({username: 'testuser', password: 'test'})
      .end((err, res) => {
        if (err)  throw err;

        token = res.body.access_token;
        done();
      });
  });

  describe("/POST /api/fixture/:season_id", () => {
    it("SEASON FICTURES", (done) => {
      chai
        .request(server)
        .post("/api/fixture/" + season_id)
        .set("x-access-token", token)
        .end((err, res) => {
          if (err) throw err;

          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status").eql(true);
          done();
        });
    });
  });

  describe("/POST api/team/:season_id", () => {
    it("SEASON TEAMS", (done) => {
      chai
        .request(server)
        .post("/api/fixture/" + season_id)
        .set("x-access-token", token)
        .end((err, res) => {
          if (err) throw err;

          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status").eql(true);
          done();
        });
    });
  });

  describe("/PUT api/season/simulate/:season_id", () => {
    it("LEAGUE SIMULATION", (done) => {
      const options = {
        weeks: 1, //1 week simulation
      };

      chai
        .request(server)
        .put("/api/season/simulate/" + season_id)
        .set("x-access-token", token)
        .send(options)
        .end((err, res) => {
          if (err) throw err;

          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status").eql(true);
          done();
        });
    });
  });

  describe("/GET api/standings/:season_id", () => {
    it("SEASON STANDINGS", (done) => {
      chai
        .request(server)
        .get("/api/standings/" + season_id)
        .set("x-access-token", token)
        .end((err, res) => {
          if (err) throw err;

          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status").eql(true);
          res.body.should.have.property("data");
          done();
        });
    });
  });
});
