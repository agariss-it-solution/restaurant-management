const express = require('express')
const app = express()
const auth = require('./auth/auth')
app.use("/auth", auth)

module.exports = app