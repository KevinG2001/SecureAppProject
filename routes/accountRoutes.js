const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = password;

  const query = `INSERT INTO users (username, password) VALUES ('${username}', '${hashedPassword}')`;
  db.run(query, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.render("register", { error: "Username already exists." });
      }
      return res.render("register", { error: "An error occurred." });
    }
    res.redirect("/login");
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log("Running query: ", query);

  db.get(query, (err, user) => {
    if (err || !user) {
      console.log("User not found or error: ", err);
      return res.render("login", {
        error: "Invalid username or password.",
      });
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/home");
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error logging out.");
    }
    res.clearCookie("sid");
    res.redirect("/login");
  });
});

module.exports = router;
