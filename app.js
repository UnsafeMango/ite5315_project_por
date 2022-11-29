const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const RestaurantDB = require("./config/database.js");
const methodOverride = require("method-override");
require("dotenv").config();
const { MONGO_CONNECT_STRING } = process.env;
const { Joi, celebrate, Segments, errors } = require("celebrate");
const db = new RestaurantDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
const exphbs = require("express-handlebars");
const { json } = require("body-parser");
const { application } = require("express");
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      PrevPage: function (perPage) {
        page = parseInt(perPage);
        var pageNo = page - 1;
        if (pageNo > 0) {
          return pageNo - 1;
        }
      },
      NextPage: function (perPage) {
        pageNo = parseInt(perPage);
        return pageNo + 1;
      },
    },
  })
);
app.set("view engine", "hbs");

const PORT = process.env.PORT || 8000;

db.initialize(MONGO_CONNECT_STRING)
  .then(() => {
    app.listen(PORT, function () {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Method override
app.use(methodOverride("_method"));

// Home route
app.get("/", (req, res) => {
  res.json({ message: "API Listening" });
});

// Getting restaurant by page, PerPage & borough query
app.get("/api/restaurants", (req, res) => {
  var page = req.query.page || 1;
  var perPage = req.query.perPage || 5;
  var borough = req.query.borough || null;
  if (!page || !perPage)
    res.status(500).json({ message: "Missing query parameters" });
  else {
    db.getAllRestaurants(page, perPage, req.query.borough)
      .then((data) => {
        if (data.length === 0)
          res.status(204).json({ message: "No data returned" });
        else {
          res.status(201);
          // console.log(data)
          res.render("index.hbs", { data: data, page: page, perPage: perPage });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
});

app.get("/api/restaurants/addNew", (req, res) => {
  res.render("AddNew.hbs");
});

app.get("/api/restaurants/filter", (req, res) => {
  res.render("Filter.hbs");
});

// Getting restaurant by ID
app.get(
  "/api/restaurants/:_id",
  // validating param with celebrate
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      _id: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/),
    }),
  }),
  (req, res) => {
    db.getRestaurantById(req.params._id)
      .then((data) => {
        res.status(201);
        res.render("edit.hbs", { data: data });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
);

// Adding a new restaurant from req.body
app.post("/api/restaurants", (req, res) => {
  if (Object.keys(req.body).length === 0)
    res.status(500).json({ error: "Invalid body" });
  else {
    db.addNewRestaurant(req.body)
      .then((data) => {
        // console.log(data)
        res.render("Message.hbs", { message: "Inserted" });
        res.status(201);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
});

// Updating restaurant with req.body and the ID
app.put(
  "/api/restaurants/:_id",
  // validating param with celebrate
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      _id: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/),
    }),
  }),
  (req, res) => {
    if (Object.keys(req.body).length === 0)
      res.status(500).json({ error: "Invalid body" });
    else {
      db.updateRestaurantById(req.body, req.params._id)
        .then(() => {
          res.render("Message.hbs", { message: "Updated" });
          res.status(201);
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    }
  }
);

// Deleting restaurant by ID
app.delete(
  "/api/restaurants/:_id",
  // validating param with celebrate
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      _id: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/),
    }),
  }),
  (req, res) => {
    db.deleteRestaurantById(req.params._id)
      .then(() => {
        res.render("Message.hbs", { message: "Deleted" });
        res.status(201);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
);

app.use(errors());
