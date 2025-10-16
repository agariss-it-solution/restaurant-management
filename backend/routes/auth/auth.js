const express = require("express");
const app = express();

const register = require("../../controller/loginregister/register");
const login = require("../../controller/loginregister/login");
const authtoken = require("../../middleware/authToken");
const tableController = require("../../controller/tableController");
const menuController = require("../../controller/menuControlls");
const getAnalytics = require("../../controller/Analytics/Analytics");
const getAnalyticsfilter = require("../../controller/Analytics/monthly&yearly");
const ordersendController = require("../../controller/ordersend");
const updateOrderStatus = require('../../controller/kitcheprocess/updateOrderStatus')
const { upload, convertToWebp, } = require('../../middleware/multer');
const settingController = require("../../controller/settings/setting");

const ordercancel = require("../../controller/itemcancel");
const payBill = require("../../controller/billpay/billpay");

// ✅ Public routes
app.post("/register", register);
app.post("/login", login.login);
app.post("/logout", login.logout);

// ✅ Protected routes (everything below requires token)

app.post("/resetrequst", login.sendResetPasswordEmail);
app.post("/reset", login.resetPassword);
app.use(authtoken);

// ----- Table Routes -----
app.post("/table", tableController.createTable);
app.post("/tablemove", tableController.moveTable);
app.get("/table", tableController.getTables);
app.get("/table/available", tableController.getAvailableTables);
app.put("/table/:id", tableController.selectTable);
app.delete("/table/:id", tableController.deleteTable);

// ----- Menu Routes -----
// app.post("/categories", menuController.createCategory); // create category
app.get("/categories", menuController.getAllCategories); // get all categories
app.get("/search", menuController.searchMenuitems); // get all categories
app.delete("/categories/:id", menuController.deleteCategory); // delete category

app.post("/categories", upload.single('image'), convertToWebp, menuController.addItemToCategory); // add item to category
app.put("/categories/:id/items/:itemId", upload.single('image'), menuController.updateItemInCategory); // update item
app.put("/categories/:categoryId", upload.single('image'), convertToWebp, menuController.updateCategory); // update item
app.delete("/categories/:id/items/:itemId", menuController.deleteItemFromCategory); // delete item

//--------ordefrsend routes--------
app.post("/orders", ordersendController.createOrder);

app.get("/orders", ordersendController.getKitchenOrders);
app.get("/orders/history", ordersendController.getOrderHistory);
app.delete("/orders/history", ordersendController.deleteOrderHistory);
app.put("/orders/:id", ordersendController.updateOrderStatus);
app.post("/ordersupdate", ordersendController.updateOrderItemQuantity);
    
// app.get("/orders/:id", ordersendController.getOrderById);

//--------order cancel route------
app.post("/orders/cancel", ordercancel);

//------ kitchen progress routes-------
app.post("/kitchen/orders/:id", updateOrderStatus);


// ----- Bill Routes -----
app.post("/bills/:billId", payBill.payBill);
app.get("/bills/unpaid", payBill.getAllUnpaidBills);
app.put("/bills/update/:billId", payBill.updateBill);

app.get("/bills", payBill.getAllBills);
app.get("/bills/:billId", payBill.getBill);

//----- Analytics -----
app.get("/analytics", getAnalytics);
app.get("/analyticsfilter", getAnalyticsfilter);


//----- Settings Routes -----
app.post("/settings", upload.fields([
    { name: 'qr', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), convertToWebp, settingController.createSetting);
app.get("/settings", settingController.getAllSettings);
// app.get("/settings/:id", settingController.getSettingById);
// app.put("/settings/:id", upload.single('file'), convertToWebp, settingController.updateSetting);
// app.delete("/settings/:id", settingController.deleteSetting);    
module.exports = app;
