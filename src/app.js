const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const hbs = require("hbs");

require("./db/conn");
const Member = require("../src/models/member");

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

//index file hbs
app.get("/", async (req, res) => {
  res.render("index");
});

app.get("/viewall", async (req, res) => {
  try {
    const allMembers = await Member.find().sort({ regno: -1 });
    res.render("viewall", { members: allMembers });
  } catch (err) {
    console.error("Error retrieving members:", err);
    res.send("Error retrieving members: " + err.message);
  }
});

app.get("/addmember", async (req, res) => {
  res.render("addMember");
});

app.post("/addmember", async (req, res) => {
  try {
    // Format the start and end dates for display
    // const start = new Date(req.body.startDate);
    // const end = new Date(req.body.endDate);
    // const formattedStartDate = start.toISOString().split("T")[0]; // Format start date as YYYY-MM-DD
    // const formattedEndDate = end.toISOString().split("T")[0]; // Format end date as YYYY-MM-DD

    const member = new Member({
      name: req.body.name,
      regno: req.body.regno,
      status: req.body.status,
      start: req.body.startDate,
      end: req.body.endDate,
    });

    const newMember = await member.save();
    // Fetch the member's data again
    // const savedMember = await Member.findById(newMember._id);
    res.redirect("/viewall");
  } catch (err) {
    console.error("Error adding member:", err);
    res.send("Error adding member: " + err.message);
  }
});

app.post("/delete/:id", async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.redirect("/viewall");
});

app.get("/editMember/:id", async (req, res) => {
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

    // console.log(member.start, member.end);
    // Save the updated member object to the database
    const updatedMember = await member.save();

    res.redirect("/viewall");
  } catch (err) {
    res.send("Error updating member: " + err.message);
  }
});

app.get("/viewMember/:id", async (req, res) => {
  try {
    const memberId = req.params.id;
    // Find the member by ID
    const member = await Member.findById(memberId);
    if (!member) {
      // Handle member not found error
      return res.status(404).send("Member not found");
    }

    const start = new Date(member.start);
    const end = new Date(member.end);

    const formattedStartDate = start.toISOString().split("T")[0]; // Format start date as YYYY-MM-DD
    const formattedEndDate = end.toISOString().split("T")[0]; // Format end date as YYYY-MM-DD
    // Render the view with the bcafirst object as a variable
    res.render("viewMember", { member, formattedStartDate, formattedEndDate });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//search

app.get("/searchMember", async (req, res) => {
  try {
    const searchName = req.query.name; // Get the search name from the query parameters
    const searchReg = req.query.regno;
    const member = await Member.findOne({ name: searchName, regno: searchReg });

    if (!member) {
      // Member not found
      return res.status(404).send("Member not found");
    }
    const start = new Date(member.start);
    const end = new Date(member.end);
    const formattedStartDate = start.toISOString().split("T")[0];
    const formattedEndDate = end.toISOString().split("T")[0];

    res.render("searchMember", {
      member,
      formattedStartDate,
      formattedEndDate,
    });
  } catch (err) {
    res.send("No member found");
  }
});

app.listen(port, () => {
  console.log(`connection established in port ${port}`);
});
