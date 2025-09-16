const express = require("express");
const app = express();

const register = require("../../controller/loginregister/register");
const login = require("../../controller/loginregister/login");
const authtoken = require("../../middleware/authToken");
const tableController = require("../../controller/tableController");
const menuController = require("../../controller/menuControlls");

// ✅ Public routes
app.post("/register", register);
app.post("/login", login.login);
app.post("/logout", login.logout);

// ✅ Protected routes (everything below requires token)
app.use(authtoken);

// ----- Table Routes -----
app.post("/table", tableController.createTable);
app.get("/table", tableController.getTables);
app.put("/table/:id", tableController.selectTable);
app.delete("/table/:id", tableController.deleteTable);

// ----- Menu Routes -----
app.post("/categories", menuController.createCategory); // create category
app.get("/categories", menuController.getAllCategories); // get all categories
app.delete("/categories/:id", menuController.deleteCategory); // delete category

app.post("/categories/:id/items", menuController.addItemToCategory); // add item to category
app.put("/categories/:id/items/:itemId", menuController.updateItemInCategory); // update item
app.delete("/categories/:id/items/:itemId", menuController.deleteItemFromCategory); // delete item

module.exports = app;
