const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const bcrypt = require("bcryptjs");
const logger = require("../util/logger");

router.get("/login", (req, res) => {
  res.render("login", { error: null, csrfToken: req.csrfToken() });
});

router.get("/register", (req, res) => {
  res.render("register", { error: null, csrfToken: req.csrfToken() });
});

router.get("/resetPassword", (req, res) => {
  res.render("resetPassword", { error: null, csrfToken: req.csrfToken() });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    logger.warn("Registration failed: Missing username or password");
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
        logger.warn(
          `Registration failed: Username "${username}" already exists`
        );
        return res.render("register", {
          error: "Username already exists.",
          csrfToken: req.csrfToken(),
        });
      }
      logger.error(`Registration error: ${err.message}`);
      return res.render("register", {
        error: "An error occurred.",
        csrfToken: req.csrfToken(),
      });
    }

    logger.info(`User registered: ${username}`);
    res.redirect("/login");
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err || !user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.render("login", {
        error: "Invalid username or password.",
        csrfToken: req.csrfToken(),
      });
    }

    if (user.login_Attempts >= 3) {
      logger.warn(`User locked out: ${username}`);
      return res.render("login", {
        error: "Account locked due to too many failed attempts.",
        csrfToken: req.csrfToken(),
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const updateQuery = `
        UPDATE users
        SET login_Attempts = login_Attempts + 1,
            last_attempt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(updateQuery, [user.id], (updateErr) => {
        if (updateErr) {
          logger.error(
            `Failed to update login attempts for ${username}: ${updateErr.message}`
          );
        }
      });

      logger.warn(`Login failed: Incorrect password for ${username}`);
      return res.render("login", {
        error: "Invalid username or password.",
        csrfToken: req.csrfToken(),
      });
    }

    db.run(
      `UPDATE users SET login_Attempts = 0, last_attempt = NULL WHERE id = ?`,
      [user.id]
    );

    req.session.user = {
      id: user.id,
      username: user.username,
    };

    logger.info(`User logged in: ${username}`);
    res.redirect("/home");
  });
});

router.post("/logout", (req, res) => {
  const username = req.session?.user?.username || "unknown";
  req.session.destroy((err) => {
    if (err) {
      logger.error("Logout error");
      return res.send("Error logging out.");
    }
    res.clearCookie("sid");
    logger.info(`User logged out: ${username}`);
    res.redirect("/login");
  });
});

router.post("/resetPassword", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.render("resetPassword", {
      error: "All fields are required.",
      csrfToken: req.csrfToken(),
    });
  }

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err || !user) {
      logger.warn(`Password reset failed: User not found - ${username}`);
      return res.render("resetPassword", {
        error: "Invalid username or password.",
        csrfToken: req.csrfToken(),
      });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      logger.warn(
        `Password reset failed: Incorrect old password for ${username}`
      );
      return res.render("resetPassword", {
        error: "Old password is incorrect.",
        csrfToken: req.csrfToken(),
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `
      UPDATE users
      SET password = ?, login_Attempts = 0, last_attempt = NULL
      WHERE username = ?
    `;

    db.run(updateQuery, [hashedNewPassword, username], function (updateErr) {
      if (updateErr) {
        logger.error(
          `Failed to reset password for ${username}: ${updateErr.message}`
        );
        return res.render("resetPassword", {
          error: "An error occurred.",
          csrfToken: req.csrfToken(),
        });
      }

      logger.info(`Password reset successful for ${username}`);
      res.redirect("/login");
    });
  });
});

module.exports = router;
