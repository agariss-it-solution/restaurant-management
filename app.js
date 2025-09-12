require("dotenv").config()
const express = require('express')
const app = express()
app.use(express.json())
const mongodb = require('./database/db')
mongodb()
const v1 = require('./routes/v1')
app.use("/v1", v1)



PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`server start  PORT ${PORT}`);
})