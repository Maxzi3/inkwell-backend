const mongoose = require("mongoose");
// const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// Handle uncaught exceptions (e.g., syntax errors)
process.on("uncaughtException", (error) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(error.name, error.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

// Connect to MongoDB
// mongoose
//   .connect(process.env.DATABASE_LOCAL)
//   .then(() => console.log("Connected to MongoDB"));

const mongoURI = process.env.DATABASE_URI;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const port = process.env.PORT || 3000;

// Save the server instance here
const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}...`)
);

// Handle unhandled promise rejections (e.g., DB errors)
process.on("unhandledRejection", (error) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.error(error.name, error.message);

  //  Now this works because server is defined
  server.close(() => {
    process.exit(1);
  });
});
