const createError = require("http-errors");
const express = require("express");
const app = express();
const path = require("path");
const connectDB = require('./models/connectAtlas')
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
require('dotenv').config()


//sweet alert

// DB connection

// const db = require("./models/connection");

const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/admin-assets")));
app.use(
  session({
    secret: "key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 600000 },
  })
);

app.use("/", userRouter);
app.use("/admin", adminRouter);

const start = function () {
  try {
    connectDB(process.env.MONGO_URI)
  }
  catch (err) {
    console.log(err);
  }
}
start()
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(err)
  res.locals.message = "something went wrong"
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


module.exports = app;
