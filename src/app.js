const express = require("express");

const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const hbs = require("hbs");
//for handeling login session
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const bcrypt = require("bcrypt");
const saltRounds = 10;

require("./db/conn");
const Member = require("../src/models/member");
const Register = require("../src/models/register");
const Payment = require("../src/models/payment");

//view engiene
const partials_path = path.join(__dirname, "../templates/partials");
const template_path = path.join(path.join(__dirname, "../templates/views"));
const static_path = path.join(__dirname, "../public/style");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

hbs.registerPartials(partials_path);
app.set("view engine", "hbs");
app.set("views", template_path);
app.use(express.static(static_path));

// Register the helper function
hbs.registerHelper("convertDateFormat", function (date) {
  if (date instanceof Date) {
    // Format the date as YYYY-MM-DD
    const formattedDate = date.toISOString().split("T")[0];
    return formattedDate;
  } else if (typeof date === "string") {
    // Assuming the input date is in "MM/DD/YYYY" format
    const parts = date.split("/");
    const formattedDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    return formattedDate;
  }
});
/// Register the 'eq' helper
hbs.registerHelper("eq", function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn : options.inverse;
});

// Create a MongoDB session store
const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/member", // Replace with your MongoDB connection URI
  collection: "sessions",
});
// Catch session store errors
store.on("error", (error) => {
  console.error("Session store error:", error);
});
// Configure the session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    store: store, // Use the MongoDB session store
  })
);
// Middleware to check if the user is authenticated
const checkAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    res.redirect("/login");
  }
};
// index
app.get("/", async (req, res) => {
  res.render("index");
});
//login route
app.get("/login", async (req, res) => {
  res.render("login");
});
//regestration section
app.get("/register", async (req, res) => {
  res.render("register");
});
app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    if (password === confirmpassword) {
      //Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const registerMember = new Register({
        fname: req.body.firstname,
        lname: req.body.lastname,
        email: req.body.email,
        password: hashedPassword,
        confirmpassword: hashedPassword,
        phone: req.body.phone,
      });

      await registerMember.save();
      res.status(201).render("login");
    }
  } catch (err) {
    res.send("password are not matching");
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await Register.findOne({ email: email });

    if (user) {
      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Set the userId in the session
        req.session.userId = user._id;
        res.redirect("/viewall");
      } else {
        res.send("invalid login Details");
      }
    } else {
      res.send("Invalid login details");
    }
  } catch (err) {
    console.error(err);
    res.status(400).send("invalid Details ");
  }
});

app.get("/viewall", checkAuth, async (req, res) => {
  try {
    const allMembers = await Member.find().sort({ regno: -1 });
    //counts total members listed in the database
    const totalMembers = await Member.countDocuments({});

    res.render("viewall", {
      members: allMembers,
      totalMembers: totalMembers,
    });
  } catch (err) {
    console.error("Error retrieving members:", err);
    res.send("Error retrieving members: " + err.message);
  }
});

app.get("/addmember", checkAuth, async (req, res) => {
  res.render("addMember");
});

app.post("/addmember", async (req, res) => {
  try {
    const member = new Member({
      name: req.body.name,
      regno: req.body.regno,
      status: req.body.status,
      start: req.body.startDate,
      end: req.body.endDate,
    });

    const newMember = await member.save();

    res.redirect("/viewall");
  } catch (err) {
    console.error("Error adding member:", err);
    res.send("Error adding member: " + err.message);
  }
});

app.post("/delete/:id", async (req, res) => {
  try {
    const memberId = req.params.id;

    // Delete the member
    await Member.findByIdAndDelete(memberId);

    // Delete the payments associated with the member
    await Payment.deleteMany({ member: memberId });

    res.redirect("/viewall");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/editMember/:id", checkAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await Member.findById(memberId);
    res.render("editMember", { member });
  } catch (err) {
    console.error("Error retrieving member:", err);
    res.send("Error retrieving member: " + err.message);
  }
});

app.post("/editMember/:id", async (req, res) => {
  try {
    const memberId = req.params.id;
    const { name, regno, status, startDate, endDate } = req.body;

    // Find the member by ID
    const member = await Member.findById(memberId);

    // Update specific fields
    member.name = name;
    member.regno = regno;
    member.status = status;
    member.end = new Date(endDate); // Parse endDate into a Date object
    member.start = new Date(startDate); // Parse startDate into a Date object

    // Save the updated member object to the database
    const updatedMember = await member.save();

    res.redirect("/viewall");
  } catch (err) {
    res.send("Error updating member: " + err.message);
  }
});

app.get("/viewMember/:id", checkAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    // Find the member by ID
    const member = await Member.findById(memberId);
    if (!member) {
      // Handle member not found error
      return res.status(404).send("Member not found");
    }
    const payments = await Payment.find({ member: memberId }).sort({
      endDate: -1,
    });

    const formattedPayments = payments.map((payment) => {
      const start = new Date(payment.startDate);
      const end = new Date(payment.endDate);

      const formattedStartDate = isValidDate(start)
        ? start.toISOString().split("T")[0]
        : "Invalid Date";
      const formattedEndDate = isValidDate(end)
        ? end.toISOString().split("T")[0]
        : "Invalid Date";

      const currentDate = new Date();
      const isExpired = end <= currentDate;
      const color = isExpired ? "red" : "green";
      return {
        amount: payment.amount,
        formattedStartDate,
        formattedEndDate,
        color,
      };
    });

    res.render("viewMember", {
      member,
      payments: formattedPayments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Function to check if a date is valid
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

//search

app.get("/searchMember", checkAuth, async (req, res) => {
  try {
    const searchName = req.query.name; // Get the search name from the query parameters
    const searchReg = req.query.regno;
    let query = {};

    // Build the query object based on the provided search parameters
    if (searchName && searchReg) {
      query = { name: searchName, regno: searchReg };
    } else if (searchName) {
      query = { name: searchName };
    } else if (searchReg) {
      query = { regno: searchReg };
    } else {
      // No search parameters provided
      return res
        .status(400)
        .send("Please provide a name or regno for the search");
    }

    const member = await Member.findOne(query);

    const payments = await Payment.find({ member }).sort({
      endDate: -1,
    });
    const formattedPayments = payments.map((payment) => {
      const start = new Date(payment.startDate);
      const end = new Date(payment.endDate);

      const formattedStartDate = isValidDate(start)
        ? start.toISOString().split("T")[0]
        : "Invalid Date";
      const formattedEndDate = isValidDate(end)
        ? end.toISOString().split("T")[0]
        : "Invalid Date";

      return {
        amount: payment.amount,
        formattedStartDate,
        formattedEndDate,
      };
    });

    res.render("searchMember", {
      member,
      payments: formattedPayments,
    });
  } catch (err) {
    res.send("No member found");
  }
});

//payment
app.get("/processPayment/:id", checkAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    // Find the member by ID
    const member = await Member.findById(memberId);
    if (!member) {
      // Handle member not found error
      return res.status(404).send("Member not found");
    }
    res.render("payment", { regno: member.regno });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
app.post("/processPayment", (req, res) => {
  const regno = req.body.regno; // Assuming the member identifier is the registration number
  const amount = req.body.amount;
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  // Find the member based on the provided registration number
  Member.findOne({ regno: regno })
    .then((foundMember) => {
      if (!foundMember) {
        // console.log("Member not found");
        return res.send("Member not found");
      }

      const memberId = foundMember._id;

      // Create a new payment document and assign the member ID
      const payment = new Payment({
        member: memberId,
        amount: amount,
        startDate: startDate, // Use startDate instead of start
        endDate: endDate, // Use endDate instead of end
      });

      // Validate the payment document
      const validationError = payment.validateSync();
      if (validationError) {
        console.error("Payment validation error:", validationError);
        return res.send("error");
      }
      // Save the payment document to the database
      return payment.save();
    })
    .then((savedPayment) => {
      // console.log("Payment saved:", savedPayment);
      res.redirect("/viewall");
    })
    .catch((error) => {
      // console.error("Error saving payment:", error);
      res.send("error");
    });
});

app.listen(port, () => {
  console.log(`connection established in port ${port}`);
});
