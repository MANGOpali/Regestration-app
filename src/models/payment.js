const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "member",
  },
  amount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});
// Define a virtual getter for the computedStatus field
// paymentSchema.virtual("computedStat").get(function () {
//   const currentDate = new Date();

//   if (this.endDate <= currentDate) {
//     return "expired";
//   } else {
//     return "active";
//   }
// });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
