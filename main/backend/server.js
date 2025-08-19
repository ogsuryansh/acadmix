const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/ping", (req, res) => {
  res.json({ pong: true });
});

module.exports = app;
