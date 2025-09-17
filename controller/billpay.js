const Order = require("../models/order.js");
const Bill = require("../models/bill.js");
const Table = require("../models/Table.js");
const Response = require("../helper/errHandler.js");

const payBill = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await Bill.findById(billId).populate("orders");
        if (!bill) {
            return Response.Error({
                res,
                status: 404,
                message: "Bill not found",
            });
        }

        if (bill.status === "Paid") {
            return Response.Error({
                res,
                status: 400,
                message: "Bill already paid",
            });
        }

        bill.status = "Paid";
        await bill.save();

        // Free table
        await Table.findByIdAndUpdate(bill.table, { status: "Available" });

        // Mark orders as completed
        await Order.updateMany(
            { _id: { $in: bill.orders } },
            { $set: { status: "Completed" } }
        );

        return Response.Success({
            res,
            status: 200,
            message: "Bill paid, orders completed & table is available",
            data: bill,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error processing payment",
            error: err.message,
        });
    }
};
module.exports = payBill;