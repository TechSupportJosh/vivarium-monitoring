const express = require("express");
const dotenv = require("dotenv");
const safeCompare = require('safe-compare');

dotenv.config();

const app = express();

app.use(express.json());

const authMiddleware = (req, res, next) => {
  const providedAuth = req.headers["X-API-KEY"] ?? "";

  if (!safeCompare(providedAuth, process.env.API_KEY)) {
    return res.sendStatus(401);
  }

  return next();
};

app.get("/data", (req, res) => {
  console.log("GET /data");
  return res.sendStatus(200);
});

app.post("/data", authMiddleware, (req, res) => {
  console.log("POST /data", req.body);
  return res.sendStatus(201);
});

app.listen(9000, () => {
  console.log("Server listening on port 9000");
});