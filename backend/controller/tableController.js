const Table = require('../models/Table')
const Response = require("../helper/errHandler");
const Order  = require('../models/order');
const Bill  = require('../models/bill');

// Get all tables

const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 }); // ascending order by number
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

const getAvailableTables = async (req, res) => {
  try {
    const { status } = req.query; // get status filter from query param

    const filter = {};
    if (status) filter.status = status; // filter by status if provided

    const tables = await Table.find(filter).sort({ number: 1 });

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


// Select (occupy) a table
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

//  Create Table
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

//  Delete Table
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

const moveTable = async (req, res) => {
  try {
    const { fromTableId, toTableId } = req.body;

    if (!fromTableId || !toTableId) {
      return Response.Error({
        res,
        status: 400,
        message: "Both fromTableId and toTableId are required",
      });
    }

    const fromTable = await Table.findById(fromTableId);
    const toTable = await Table.findById(toTableId);

    if (!fromTable || !toTable) {
      return Response.Error({
        res,
        status: 404,
        message: "One or both tables not found",
      });
    }

    if (fromTable.status !== "Occupied") {
      return Response.Error({
        res,
        status: 400,
        message: `Source table (Table ${fromTable.number}) is not Occupied.`,
      });
    }

    if (toTable.status !== "Available") {
      return Response.Error({
        res,
        status: 400,
        message: `Target table (Table ${toTable.number}) is not Available.`,
      });
    }

    // --- Migrate orders ---
    const orders = await Order.find({ table: fromTableId, status: { $in: ["Pending", "InProgress", "WhateverYourStatuses"] } });
    for (const ord of orders) {
      ord.table = toTableId;
      await ord.save();
    }

    // --- Migrate bill(s) ---
    const bills = await Bill.find({ table: fromTableId, status: { $in: ["Unpaid", "Pending"] } });
    for (const bill of bills) {
      bill.table = toTableId;
      // Optionally also update tableNumber or other denormalized field
      bill.tableNumber = toTable.number;
      await bill.save();
    }

    // Finally update statuses of tables
    fromTable.status = "Available";
    toTable.status = "Occupied";
    await fromTable.save();
    await toTable.save();

    return Response.Success({
      res,
      status: 200,
      message: `Moved table data (orders & bills) from Table ${fromTable.number} to Table ${toTable.number}.`,
      data: {
        from: fromTable,
        to: toTable,
        movedOrdersCount: orders.length,
        movedBillsCount: bills.length,
      }
    });
  } catch (err) {
    console.error("Error in moveTable:", err);
    return Response.Error({
      res,
      status: 500,
      message: "Error moving table data along with orders & bills",
      error: err.message,
    });
  }
};

module.exports = {
  getTables,
  getAvailableTables,
  selectTable,
  createTable,
  deleteTable,
  moveTable 
}