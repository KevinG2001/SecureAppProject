require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/accountRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    name: "sid",
    secret: "insecure",
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", blogRoutes);
app.use("/", authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
