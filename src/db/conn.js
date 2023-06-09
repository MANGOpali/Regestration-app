const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://localhost:27017/member")
  .then(() => {
    console.log("database connection successful");
  })
  .catch((err) => {
    console.log("no error");
  });
