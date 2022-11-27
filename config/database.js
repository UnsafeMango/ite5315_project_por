var mongoose = require("mongoose");

var restaurants = require("../models/restaurant");

module.exports = {
  // establish connection to database
  initialize: function (url) {
    if (mongoose.connect(url)) {
      return true;
    } else {
      console.log("not connected...");
      return false;
    }
  },
  // add new restaurant to database
  addNewRestaurant: function (data) {
    restaurant.create({}, function (err, data) {
      if (err) throw err;

      let id = data._id;
      // get the newly created restaurant from database
      restaurant.findById(id, (err, data) => {
        if (err) throw err;
        console.log("====================================");
        console.log(data);
        console.log("====================================");
      });
    });
  },
};
