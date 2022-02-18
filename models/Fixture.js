const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FixtureSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  season_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "season",
  },
  home_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teams",
  },
  away_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teams",
  },
  homeScore: {
    type: Number,
    default:0,
    required: true,
  },
  awayScore: {
    type: Number,
    default:0,
    required: true,
  },
  mathcNo: {
    type: Number,
    required: false,
  },
  roundNo: {
    type: Number,
    required: false,
  },
  home: {
    type: String,
    required: true,
    unique: false,
  },
  away: {
    type: String,
    required: true,
    unique: false,
  },
  venue: {
    type: String,
    required: false,
    unique: false,
  },
  dayToPlay: {
    type: String,
    enum: ["FRIDAY", "SATURDAY", "SUNDAY"],
    default: "SATURDAY",
    immutable: false,
  },
  status: {
    type: String,
    enum: ["NOTSTARTED", "DELAYED", "KICKOFF", "HALFTIME", "COMPLETED"],
    default: "NOTSTARTED",
    immutable: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
 
module.exports = mongoose.model("fixtures", FixtureSchema);
