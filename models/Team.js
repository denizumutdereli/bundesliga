const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TeamSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  season_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "seasons",
  },
  name: {
    type: String,
    required: false,
    unique: false,
    max: 100,
    min: 2,
  },
  shortName: {
    type: String,
    required: false,
    unique: false,
    max: 50,
    min: 2,
  },
  tla: {
    type: String,
    required: false,
    unique: false,
    max: 10,
    min: 2,
  },
  crestUrl: {
    type: String,
    required: false,
    unique: false,
    max: 50,
    min: 2,
  },
  venue: {
    type: String,
    required: false,
    unique: false,
    max: 100,
    min: 2,
  },
  goal: {
    type: Number,
    required: false,
    default:0
  },
  conceded: {
    type: Number,
    required: false,
    default:0
  },
  played: {
    type: Number,
    required: false,
    default:0
  },
  homePlayed: {
    type: Number,
    required: false,
    default:0
  },
  awayPlayed: {
    type: Number,
    required: false,
    default:0
  },
  points: {
    type: Number,
    required: false,
    default:0
  },
  win: {
    type: Number,
    required: false,
    default:0
  },
  lost: {
    type: Number,
    required: false,
    default:0
  },
  draw: {
    type: Number,
    required: false,
    default:0
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

module.exports = mongoose.model("teams", TeamSchema);
