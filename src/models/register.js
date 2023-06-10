const mongoose = require("mongoose");
const employeeSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmpassword: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
});

//ceate a collections
const Register = new mongoose.model("Register", employeeSchema);
module.exports = Register;
