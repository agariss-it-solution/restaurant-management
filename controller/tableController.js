const Table = require('../models/Table')
const Response = require("../helper/errHandler");

// ✅ Get all tables
 const getTables = async (req, res) => {
  try {
    const tables = await Table.find();
    return Response.Success({
      res,
      status: 200,
      message: "Tables fetched successfully",
      data: tables,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error fetching tables",
      error: err.message,
    });
  }
};

// ✅ Select (occupy) a table
 const selectTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndUpdate(
      id,
      { status: "Occupied" },
      { new: true }
    );
    if (!table) {
      return Response.Error({
        res,
        status: 404,
        message: "Table not found",
      });
    }
    return Response.Success({
      res,
      status: 200,
      message: `Table ${table.number} selected successfully`,
      data: table,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error selecting table",
      error: err.message,
    });
  }
};

// ✅ Create Table
const createTable = async (req, res) => {
  try {
    const table = new Table(); // no number, no status needed
    await table.save();

    return Response.Success({
      res,
      status: 201,
      message: "Table created successfully",
      data: table,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error creating table",
      error: err.message,
    });
  }
};

// ✅ Delete Table
 const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndDelete(id);
    if (!table) {
      return Response.Error({
        res,
        status: 404,
        message: "Table not found",
      });
    }
    return Response.Success({
      res,
      status: 200,
      message: `Table ${table.number} deleted successfully`,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error deleting table",
      error: err.message,
    });
  }
};


module.exports={
    getTables,
    selectTable,
    createTable,
    deleteTable
}