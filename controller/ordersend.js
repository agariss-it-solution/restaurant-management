const Order = require("../models/order.js");
const Bill = require("../models/bill.js");
const Table = require("../models/Table.js");
const Response = require("../helper/errHandler.js");

/**
 * Create a new order & add to bill
 */
const createOrder = async (req, res) => {
    try {
        const { table, items, Price } = req.body;

        if (!table || !items?.length || !Price) {
            return Response.Error({
                res,
                status: 400,
                message: "table, items, and Price are required",
            });
        }

        // 1️⃣ Create a new order document
        const newOrder = new Order({
            table,
            items,
            Price,
        });
        await newOrder.save();

        // 2️⃣ Find an open bill or create a new one
        let bill = await Bill.findOne({ table, status: "Unpaid" });

        if (bill) {
            bill.orders.push(newOrder._id);
            bill.amount += Price;
            await bill.save();
        } else {
            bill = new Bill({
                table,
                orders: [newOrder._id],
                amount: Price,
                status: "Unpaid",
            });
            await bill.save();

            // Mark table as occupied if this is the first order
            await Table.findByIdAndUpdate(table, { status: "Occupied" });
        }

        // 3️⃣ Attach bill reference to the order
        newOrder.bill = bill._id;
        await newOrder.save();

        return Response.Success({
            res,
            status: 201,
            message: "Order created & added to bill",
            data: { order: newOrder, bill },
        });

    } catch (err) {

        return Response.Error({
            res,
            status: 500,
            message: "Error creating order",
            error: err.message,
        });
    }
};

/**
 * Get all unpaid orders for kitchen
 */
const getKitchenOrders = async (req, res) => {
    try {
        const unpaidBills = await Bill.find({ status: "Unpaid" })
            .populate({
                path: "orders",
                populate: { path: "items.menuItem table" }
            });

        const allOrders = unpaidBills.flatMap(bill => bill.orders);
        const sortedOrders = allOrders.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        return Response.Success({
            res,
            status: 200,
            message: "Kitchen orders fetched successfully",
            data: sortedOrders,
        });

    } catch (err) {
        console.error("Error fetching kitchen orders:", err);
        return Response.Error({
            res,
            status: 500,
            message: "Error fetching kitchen orders",
            error: err.message,
        });
    }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Pending", "Preparing", "Ready", "Completed"].includes(status)) {
            return Response.Error({
                res,
                status: 400,
                message: "Invalid status",
            });
        }

        // 1️⃣ Update order status
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).populate("bill");
        if (!order) {
            return Response.Error({
                res,
                status: 404,
                message: "Order not found",
            });
        }

        // 2️⃣ If order completed, make sure bill is updated
        if (status === "Completed" && order.bill) {
            const bill = await Bill.findById(order.bill._id);

            if (bill) {
                const alreadyAdded = bill.orders.some(oId => oId.toString() === order._id.toString());
                if (!alreadyAdded) {
                    bill.orders.push(order._id);
                    bill.amount += order.Price;
                    await bill.save();
                }
            }
        }

        return Response.Success({
            res,
            status: 200,
            message: "Order status updated",
            data: order,
        });

    } catch (err) {
        console.error("Error updating order status:", err);
        return Response.Error({
            res,
            status: 500,
            message: "Error updating order status",
            error: err.message,
        });
    }
};

/**
 * Mark bill as paid & free the table
 */
// const closeBill = async (req, res) => {
//     try {
//         const { billId } = req.params;

//         const bill = await Bill.findById(billId).populate("table");
//         if (!bill) {
//             return Response.Error({
//                 res,
//                 status: 404,
//                 message: "Bill not found",
//             });
//         }

//         bill.status = "Paid";
//         await bill.save();

//         // Free the table
//         if (bill.table) {
//             await Table.findByIdAndUpdate(bill.table._id, { status: "Available" });
//         }

//         return Response.Success({
//             res,
//             status: 200,
//             message: "Bill closed & table freed",
//             data: bill,
//         });

//     } catch (err) {
//         console.error("Error closing bill:", err);
//         return Response.Error({
//             res,
//             status: 500,
//             message: "Error closing bill",
//             error: err.message,
//         });
//     }
// };

module.exports = { createOrder, getKitchenOrders, updateOrderStatus };
