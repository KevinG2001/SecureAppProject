const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const sanitizeHtml = require("sanitize-html");
const { isAuthenticated } = require("../middleware/auth.js");

router.get("/home", isAuthenticated, (req, res) => {
  const query = `SELECT * FROM posts ORDER BY created_at DESC`;

  db.all(query, [], (err, posts) => {
    if (err) {
      return res.send("Error loading posts");
    }

    res.render("home", {
      posts,
      user: req.session.user,
      csrfToken: req.csrfToken(),
    });
  });
});

router.post("/posts", isAuthenticated, (req, res) => {
  let { title, content } = req.body;
  const author = req.session.user.username;

  if (!title || !content) {
    return res.send("Title and content are required.");
  }

  title = sanitizeHtml(title, {
    allowedTags: [],
    allowedAttributes: {},
  });

  content = sanitizeHtml(content, {
    allowedTags: ["b", "i", "em", "strong", "p", "ul", "li", "br"],
    allowedAttributes: {},
  });

  const query = `INSERT INTO posts (title, content, author) VALUES (?, ?, ?)`;
  db.run(query, [title, content, author], function (err) {
    if (err) {
      console.error("Error inserting post:", err);
      return res.send("Failed to create post");
    }

    res.redirect("/home");
  });
});

module.exports = router;
