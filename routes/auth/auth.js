const express = require("express");
const app = express();

const register = require("../../controller/loginregister/register");
const login = require("../../controller/loginregister/login");
const authtoken = require("../../middleware/authToken");
const tableController = require("../../controller/tableController");
const menuController = require("../../controller/menuControlls");
const ordersendController = require("../../controller/ordersend");
const { upload, convertToWebp, } = require('../../middleware/multer');
ordercancel = require("../../controller/itemcancel");

const payBill = require("../../controller/billpay");

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
// app.post("/categories", menuController.createCategory); // create category
app.get("/categories", menuController.getAllCategories); // get all categories
app.delete("/categories/:id", menuController.deleteCategory); // delete category

app.post("/categories", upload.single('file'), convertToWebp, menuController.addItemToCategory); // add item to category
app.put("/categories/:id/items/:itemId", menuController.updateItemInCategory); // update item
app.put("/categories/:categoryId", upload.single('file'), convertToWebp, menuController.updateCategory); // update item
app.delete("/categories/:id/items/:itemId", menuController.deleteItemFromCategory); // delete item

//--------ordefrsend routes--------
app.post("/orders", ordersendController.createOrder);
app.get("/orders", ordersendController.getKitchenOrders);
app.put("/orders/:id", ordersendController.updateOrderStatus);
// app.get("/orders/:id", ordersendController.getOrderById);

//--------order cancel route------
app.post("/orders/cancel", ordercancel);
// ----- Bill Routes -----
app.post("/bills/:billId", payBill.payBill);
app.get("/bills/:billId", payBill.getBill);
module.exports = app;
