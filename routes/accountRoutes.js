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

  if (!username || !password) {
    return res.render("register", {
      error: "All fields are required.",
    });
  }

  const hashedPassword = password;

  const query = `INSERT INTO users (username, password) VALUES ('${username}', '${hashedPassword}')`;
  db.run(query, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.render("register", {
          error: "Username already exists.",
        });
      }
      return res.render("register", {
        error: "An error occurred.",
      });
    }
    res.redirect("/login");
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("Login endpoint");

  const query = `SELECT * FROM users WHERE username = '${username}'`;

  db.get(query, (err, user) => {
    console.log("Comparing user");
    if (err || !user) {
      return res.render("login", {
        error: "Invalid username or password.",
      });
    }

    console.log("Comparing password");
    if (password !== user.password) {
      return res.render("login", {
        error: "Invalid username or password.",
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
    };

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
