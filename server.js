require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/accountRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 15,
    },
  })
);

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", blogRoutes);
app.use("/", authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
