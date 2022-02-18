const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app");
const genUsername = require("unique-username-generator");

const seasonNameGenerated = genUsername.generateUsername("", 3);

chai.use(chaiHttp);

let token;

describe("/POST /api/season SEASON TESTS", () => {
  before("LOGIN & ACCESSTOKEN", (done) => {
    chai
      .request(server)
      .post("/auth")
      .send({username: 'testuser', password: 'test'})
      .end((err, res) => {
        if (err) throw err;

        token = res.body.access_token;
        done();
      });
  });

  describe("/GET /api/user", () => {
    it("USER PROFILE", (done) => {
      chai
        .request(server)
        .get("/api/user/")
        .set("x-access-token", token)
        .end((err, res) => {
          if (err) throw err;

          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });
  });

  describe("/GET api/season", () => {
    it("GET SEASONS", (done) => {
      chai
        .request(server)
        .get("/api/season/")
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

  /* This will confirm the record */
  describe("/POST api/season", () => {
    it("THIS SHOULD CREATE SEASON, TEAMS AND THE FIXTURE", (done) => {
      const dto = {
        seasonName: seasonNameGenerated,
        numberOfTeams: 2,
      };

      chai
        .request(server)
        .post("/api/season/")
        .send(dto)
        .set("x-access-token", token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status").eql(true);
          done();
        });
    });
  });
});
