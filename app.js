const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const RestaurantDB = require("./config/database.js");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const methodOverride = require("method-override");
require("dotenv").config();
const { MONGO_CONNECT_STRING } = process.env;

const db = new RestaurantDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
const exphbs = require("express-handlebars");
const { json } = require("body-parser");
const { url } = require("inspector");
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      PrevPage: function (page) {
        var pageNo = parseInt(page);
        if (pageNo > 1) {
          return pageNo - 1;
        } else return 1;
      },
      NextPage: function (page) {
        pageNo = parseInt(page);
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

// Authnetication And JWT response
app.post("/Login", (req, res) => {
  if (
    req.body.username == process.env.USER &&
    req.body.password == process.env.PASSWORD
  ) {
    jwt.sign(req.body.username, process.env.ACCESS_TOKEN, (err, token) => {
      // res.json(token)
      res.render("Auth.hbs", { token: token });
    });
  } else {
    res.send("Invalid Credentials");
  }
});
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
}

// *********Regular methods using thunderclient with Authentication******
// Getting restaurant by page, PerPage & borough query
app.get(
  "/api/restaurant",
  verifyToken,
  [check("page").isNumeric(), check("perPage").isNumeric()],
  (req, res) => {
    if (!req.query.page || !req.query.perPage)
      res.status(500).json({ message: "Missing query parameters" });
    else {
      db.getAllRestaurants(req.query.page, req.query.perPage, req.query.borough)
        .then((data) => {
          if (data.length === 0)
            res.status(204).json({ message: "No data returned" });
          else res.status(201).json(data);
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    }
  }
);

// Getting restaurant by ID
app.get("/api/restaurant/:_id", verifyToken, (req, res) => {
  db.getRestaurantById(req.params._id)
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// Adding a new restaurant from req.body
app.post("/api/restaurant", verifyToken, (req, res) => {
  if (Object.keys(req.body).length === 0)
    res.status(500).json({ error: "Invalid body" });
  else {
    var name = req.body.name;
    var building = req.body.building;
    var street = req.body.street;
    var zipcode = req.body.zipcode;
    var borough = req.body.borough;
    var data = {
      name: name,
      address: { building: building, street: street, zipcode: zipcode },
      borough: borough,
    };
    db.addNewRestaurant(data)
      .then((data) => {
        res.status(201).json(data);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
});

// Updating restaurant with req.body and the ID
app.put("/api/restaurant/:_id", verifyToken, (req, res) => {
  if (Object.keys(req.body).length === 0)
    res.status(500).json({ error: "Invalid body" });
  else {
    var name = req.body.name;
    var building = req.body.building;
    var street = req.body.street;
    var zipcode = req.body.zipcode;
    var borough = req.body.borough;
    var data = {
      name: name,
      address: { building: building, street: street, zipcode: zipcode },
      borough: borough,
    };
    db.updateRestaurantById(data, req.params._id)
      .then(() => {
        res.status(201).json({
          message: `Successfuly updated restaurant ${req.params._id}`,
        });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
});

// Deleting restaurant by ID
app.delete("/api/restaurant/:_id", verifyToken, (req, res) => {
  db.deleteRestaurantById(req.params._id)
    .then(() => {
      res
        .status(201)
        .json({ message: `Successfuly deleted restaurant ${req.params._id}` });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// **************Using Handlebars Below Wihtout Authentication******************

// Home route
app.get("/", (req, res) => {
  res.render("LandingPage.hbs", { message: "API Listening at Port 8000" });
});

// Getting restaurant by page, PerPage & borough query and validation on params
app.get(
  "/api/restaurants",
  [check("page").isNumeric(), check("perPage").isNumeric()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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
            res.render("index.hbs", {
              data: data,
              page: page,
              perPage: perPage,
              borough: borough,
            });
          }
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    }
  }
);

app.get("/api/restaurants/addNew", (req, res) => {
  res.render("AddNew.hbs");
});

app.get("/api/restaurants/filter", (req, res) => {
  res.render("Filter.hbs");
});
// Getting restaurant by ID
app.get("/api/restaurants/:_id", (req, res) => {
  db.getRestaurantById(req.params._id)
    .then((data) => {
      res.status(201);
      res.render("edit.hbs", { data: data });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// Adding a new restaurant from req.body
app.post("/api/restaurants", (req, res) => {
  if (Object.keys(req.body.name).length === 0) {
    res.status(500).json({ error: "Invalid body" });
  } else {
    var name = req.body.name;
    var building = req.body.building;
    var street = req.body.street;
    var zipcode = req.body.zipcode;
    var borough = req.body.borough;
    var data = {
      name: name,
      address: { building: building, street: street, zipcode: zipcode },
      borough: borough,
    };
    console.log("app.js ", data);
    db.addNewRestaurant(data)
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
app.put("/api/restaurants/:_id", (req, res) => {
  if (Object.keys(req.body).length === 0)
    res.status(500).json({ error: "Invalid body" });
  else {
    var name = req.body.name;
    var building = req.body.building;
    var street = req.body.street;
    var zipcode = req.body.zipcode;
    var borough = req.body.borough;
    var data = {
      name: name,
      address: { building: building, street: street, zipcode: zipcode },
      borough: borough,
    };
    db.updateRestaurantById(data, req.params._id)
      .then(() => {
        res.render("Message.hbs", { message: "Updated" });
        res.status(201);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
});

// Deleting restaurant by ID
app.delete("/api/restaurants/:_id", (req, res) => {
  db.deleteRestaurantById(req.params._id)
    .then(() => {
      res.render("Message.hbs", { message: "Deleted" });
      res.status(201);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});
