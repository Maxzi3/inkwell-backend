const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
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
const notificationRouter = require("./routes/notificationRoutes");

const app = express();

// 1. GLOBAL MIDDLEWARES
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // frontend URL from .env
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// 2. Security HTTP headers + CSP (Cloudinary, Google Fonts, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "https:",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https:",
          process.env.FRONTEND_URL,
          process.env.BACKEND_URL,
        ],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));

// 3. Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// LIMIT REQUEST FROM API
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per hour
  message: "Too many requests from this IP, please try again in an hour",
  standardHeaders: true, // helpful for rate limit headers
  legacyHeaders: false,
});
app.use("/api", limiter);

// 5. Body parser and sanitizers
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp()
);

// 6. Routers
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/posts/:postId/comments", commentRouter);
app.use("/api/notifications", notificationRouter);

// 🔽 Serve static files from React
const frontendPath = path.join(__dirname, "dist"); 
app.use(express.static(frontendPath));

// ⚠️ Handle all other routes (React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
