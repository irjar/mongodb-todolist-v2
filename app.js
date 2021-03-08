//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-irmina:Test123@cluster0.cwrb2.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = ({
  name: String
});

const Item = mongoose.model(
  "Item", itemsSchema
);

// default items in the database - item1, item2 and item3
const item1 = new Item({
  name: "Welcome to your To Do List"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

// an array with default items in the database
const defaultItems = [item1, item2, item3];

// new list with a name and an array with a list of list items
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// model for the custom list
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, listedItems) {
    // if the todolistDB database is empty then insert the items in the defaultItems array
    if (listedItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items to the database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: listedItems
      });
    }

  });
});

app.post("/", function(req, res) {
  // save the name of the task in the database and display on the home page
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });
  // check if the title of the page is 'today'
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        // add a new item into the list of items in the custom list
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    })
  }
});

// remove the item from the list
app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the item from the database");
        res.redirect("/" + listName);
      }
    })
    // remove the item from the list on the custom page
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemID
        }
      }
    }, function(err, results) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName)
      }

    })
  }
});

// dynamic route
app.get("/:customListName", function(req, res) {
  // capitalise the user inout wiht lodash
  const customList = _.capitalize(req.params.customListName);
  // check if the custom list exists
  List.findOne({
    name: customList
  }, function(err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        // create a new list if the list does not exist yet
        const list = new List({
          name: customList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customList);
      } else {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }

  });
});


app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
