const express = require("express");
const morgan = require("morgan");
// const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");

const app = express();

//GLOBAL  MIDDLEWARES
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // or whatever your frontend is
    credentials: true, // <--- MUST BE TRUE to allow cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Set Security HTTP Headers
app.use(helmet());

// DEVELOPMENT LOGIN
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// LIMIT REQUEST FROM API
// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100, // limit each IP to 100 requests per hour
//   message: "Too many requests from this IP, please try again in an hour",
//   standardHeaders: true, // helpful for rate limit headers
//   legacyHeaders: false,
// });
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data Sanitization against NoSQL query Injection
app.use(mongoSanitize());
app.use(cookieParser());

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: ["duration", "ratingsQuantity", "ratingsAverage"],
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to InkWell Backend API!");
});

// Using Express router
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/posts/:postId/comments", commentRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
