const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validateTeamNumbers = (e) => {
  if (e === 0 || e % 2 !== 0) return false;
  else if (e > 100) return false;
  else return true;
};

const SeasonSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  seasonName: {
    type: String,
    required: [true, " {PATH} is required."],
    //unique: true,
    max: [50, "max length for {PATH} is ({MAXLENGTH})"], 
    min: 2,
  },
  username: {
    type: String,
    required: true,
    max: 4,
    min: 2,
    immutable: true,
  },
  numberOfTeams: {
    type: Number,
    default: 18,
    validate: [
      validateTeamNumbers,
      "Number of teams should above zero and multiples of 2 and max 50 teams allowed",
    ],
    max: [100, "max length for {PATH} is ({MAXLENGTH})"],
    min: 2,
    required: true,
  },
  yearStart: {
    type: Number,
    default: 2022,
    min: 1800,
  },
  yearEnd: {
    type: Number,
    default: 2022,
    min: 1800,
  },
  totalWeeks: {
    type: Number,
    default: 0,
  },
  currentWeek: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["NOTSTARTED", "KICKOFF", "HALFTIME", "COMPLETED"],
    default: "NOTSTARTED",
    immutable: false,
  },
  teams: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teams",
  },
  fixtures: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "fixtures",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

SeasonSchema.pre('remove', function(callback) { //carefull with mongoose version! min 4.13
  this.model('teams').remove({ season_id: this._id }, callback);
  this.model('fixtures').remove({ season_id: this._id }, callback);
});

module.exports = mongoose.model("seasons", SeasonSchema);
