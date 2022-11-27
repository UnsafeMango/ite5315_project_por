var express = require("express");
var mongoose = require("mongoose");
var app = express();
var path = require("path");
var db = require("./config/database");

var bodyParser = require("body-parser"); // pull information from HTML POST (express4)

var port = process.env.PORT || 8000;

const url = "mongodb://localhost:27017/sample_restaurants";

if (db.initialize(url)) {
  app.listen(port);
  console.log(`App is listening on port ${port}`);
} else {
  console.log("Could not connect to MongoDB...");
}
