var mongoose = require("mongoose");
var Schema = mongoose.Schema;

RestaurantSchema = new Schema({
  _id: Schema.ObjectId,
  address: {
    building: { type: String, default: "" },
    coord: { type: Array, default: [] },
    street: { type: String, default: "" },
    zipcode: { type: String, default: "" },
  },
  borough: { type: String, default: "" },
  cuisine: { type: String, default: "" },
  grades: { type: Array, default: [] },
  name: { type: String, default: "" },
  restaurant_id: { type: String, default: "" },
});

module.exports = mongoose.model("restaurants", RestaurantSchema);
