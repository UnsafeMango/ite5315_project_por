var mongoose = require("mongoose");

var restaurant = require("../models/restaurant");

module.exports = {
  // establish connection to database
  initialize(url) {
    if (mongoose.connect(url)) {
      console.log("====================================");
      console.log("Connected to the database...");
      console.log("====================================");
      return true;
    } else {
      console.log("Error! Could not connect to the database...");
      return false;
    }
  },

  // add new restaurant to database using the data object
  addNewRestaurant(data) {
    restaurant.create(data, (err, data) => {
      if (err) throw err;
      console.log("====================================");
      console.log("Successful! Document inserted...");
      console.log("====================================");
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

  // get all restaurants from database
  getAllRestaurants(page, perPage, borough) {},

  // get a restaurant from database
  getRestaurantById(id) {
    let document = "";
    restaurant.findById(id, (err, data) => {
      if (err) throw err;
      document = data;
    });

    return document;
  },

  // update a restaurant in the database
  updateRestaurantById(data, id) {
    // save the restaurant to the database...
    restaurant.findByIdAndUpdate(id, data, (err, data) => {
      if (err) throw err;
      console.log("====================================");
      console.log(`Successful! Restaurant updated - ${data.name}`);
      console.log("====================================");
    });
  },

  // delete a restaurant from database
  deleteRestaurant(id) {
    restaurant.remove({ _id: id }, (err) => {
      if (err) throw err;
      else {
        console.log("====================================");
        console.log("Successful! Restaurant has been deleted...");
        console.log("====================================");
      }
    });
  },
};
