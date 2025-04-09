const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

router.get("/home", (req, res) => {
  const query = `SELECT * FROM posts ORDER BY created_at DESC`;

  db.all(query, [], (err, posts) => {
    if (err) {
      return res.send("Error loading posts");
    }

    res.render("home", {
      posts,
      user: req.session.user,
    });
  });
});

router.post("/posts", (req, res) => {
  let { title, content } = req.body;
  const author = req.session.user ? req.session.user.username : "Anonymous";

  if (!title || !content) {
    return res.send("Title and content are required.");
  }

  const query = `INSERT INTO posts (title, content, author) VALUES ('${title}', '${content}', '${author}')`;

  db.run(query, function (err) {
    if (err) {
      console.error("Error inserting post:", err);
      return res.send("Failed to create post");
    }

    res.redirect("/home");
  });
});

module.exports = router;
