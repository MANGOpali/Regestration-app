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

// Define a virtual getter for the computedStatus field
memberSchema.virtual("computedStatus").get(function () {
  const currentDate = new Date();

  if (this.end <= currentDate) {
    return "expired";
  } else {
    return "active";
  }
});

const Member = new mongoose.model("Members", memberSchema);

module.exports = Member;
