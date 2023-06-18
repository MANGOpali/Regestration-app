const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  regno: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/, // Regular expression to validate the format (e.g., 10-digit phone number)
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
});

const Member = new mongoose.model("Members", memberSchema);

module.exports = Member;
