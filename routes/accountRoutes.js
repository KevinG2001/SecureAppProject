const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const bcrypt = require("bcryptjs");

router.get("/login", (req, res) => {
  res.render("login", { error: null, csrfToken: req.csrfToken() });
});

router.get("/register", (req, res) => {
  res.render("register", { error: null, csrfToken: req.csrfToken() });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("register", {
      error: "All fields are required.",
      csrfToken: req.csrfToken(),
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
  db.run(query, [username, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.render("register", {
          error: "Username already exists.",
          csrfToken: req.csrfToken(),
        });
      }
      return res.render("register", {
        error: "An error occurred.",
        csrfToken: req.csrfToken(),
      });
    }
    res.redirect("/login");
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err || !user) {
      return res.render("login", {
        error: "Invalid username or password.",
        csrfToken: req.csrfToken(),
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("login", {
        error: "Invalid username or password.",
        csrfToken: req.csrfToken(),
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
