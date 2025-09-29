const Order = require("../../models/order.js");
const Bill = require("../../models/bill.js");
const Table = require("../../models/Table.js");
const Response = require("../../helper/errHandler.js");

const payBill = async (req, res) => {
    try {
        const { billId } = req.params;
        const { paymentMethod } = req.body;

        // Validate payment method
        const validMethods = ["online", "cash"];
        if (!paymentMethod || !validMethods.includes(paymentMethod)) {
            return Response.Error({
                res,
                status: 400,
                message: `Invalid or missing paymentMethod. Allowed values: ${validMethods.join(", ")}`,
            });
        }

        const bill = await Bill.findById(billId).populate({
            path: "table",
            select: "number"
        });

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

        // ⛔ Prevent paying if total is 0
        if (bill.totalAmount <= 0) {
            return Response.Error({
                res,
                status: 400,
                message: "Cannot pay a bill with total amount 0. All items might be canceled.",
            });
        }

        // Update bill payment status and method
        bill.status = "Paid";
        bill.paymentMethod = paymentMethod;
        await bill.save();

        // Free the table
        await Table.findByIdAndUpdate(bill.table._id, { status: "Available" });

        // Mark all orders in this bill as Completed
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

const getBill = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await Bill.findById(billId)
            .populate({
                path: "table",
                select: "number status"
            })
            .populate({
                path: "orders",
                select: "items status totalPrice"
            });

        if (!bill) {
            return Response.Error({
                res,
                status: 404,
                message: "Bill not found",
            });
        }

        return Response.Success({
            res,
            status: 200,
            message: "Bill retrieved successfully",
            data: bill,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error retrieving bill",
            error: err.message,
        });
    }
};
const getAllUnpaidBills = async (req, res) => {
    try {
        // Find all bills where status is "Unpaid"
        const unpaidBills = await Bill.find({ status: "Unpaid" })
            .populate({
                path: "table",
                select: "number status"
            })
            .populate({
                path: "orders",
                select: "items status totalPrice"
            });

        if (!unpaidBills.length) {
            return Response.Success({
                res,
                status: 200,
                message: "No unpaid bills found",
                data: [],
            });
        }

        return Response.Success({
            res,
            status: 200,
            message: "Unpaid bills retrieved successfully",
            data: unpaidBills,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error retrieving unpaid bills",
            error: err.message,
        });
    }
};

const getAllBills = async (req, res) => {
    try {
        const bills = await Bill.find()
            .populate({
                path: "table",
                select: "number status"
            })
            .populate({
                path: "orders",
                select: "items status totalPrice"
            });

        return Response.Success({
            res,
            status: 200,
            message: "All bills retrieved successfully",
            data: bills,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error retrieving bills",
            error: err.message,
        });
    }
};



module.exports = { payBill, getBill ,getAllUnpaidBills,getAllBills};
