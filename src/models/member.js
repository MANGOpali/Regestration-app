const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  regno: {
    type: Number,
    require: true,
  },

  status: {
    type: String,
  },
  start: {
    type: Date,
    require: true,
  },
  end: {
    type: Date,
    require: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
});

const Member = new mongoose.model("Members", memberSchema);

module.exports = Member;
