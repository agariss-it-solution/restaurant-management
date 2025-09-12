const express = require('express')
const register = require('../../controller/register')
const login = require('../../controller/login')
const app = express()
app.post("/register",register)
app.post("/login",login)


module.exports = app