const express = require('express')
const app = express()
const register = require('../../controller/register')
const login = require('../../controller/login')
const authtoken = require("../../middleware/authToken")
const tableController = require('../../controller/tableController')
const menuController = require("../../controller/menuControlls")

app.post("/register", register)
app.post("/login", login.login)
app.post("/logout", login.logout)

app.use(authtoken)
app.post("/table", tableController.createTable)
app.get("/table", tableController.getTables)
app.put("/table/:id", tableController.selectTable)
app.delete("/table/:id", tableController.deleteTable)


app.post("/menu", menuController.createCategory)
app.post("/menu/:id", menuController.addItemToCategory)
app.get("/menu", menuController.getAllCategories)
app.delete("/menu/:id", menuController.deleteCategory)
app.delete("/menuitem/:id", menuController.deleteItemFromCategory)
app.put("/menu/:id", menuController.updateItemInCategory)
module.exports = app