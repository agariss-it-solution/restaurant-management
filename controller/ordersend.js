const Order = require("../models/order.js");
const Bill = require("../models/bill.js");
const Table = require("../models/Table.js");
const Response = require("../helper/errHandler.js");
const MenuItem = require('../models/MenuCategory.js')
const mongoose = require("mongoose");
// Pass socket.io instance to this file during initialization
let ioInstance;
module.exports.setIO = (io) => {
    ioInstance = io;
};
const createOrder = async (req, res) => {
    try {
        const { table, itemId, quantity, specialInstructions } = req.body;

        if (!table || !itemId || !quantity) {
            return Response.Error({
                res,
                status: 400,
                message: "table, itemId, and quantity are required",
            });
        }

        // Find the menu item
        const menuItem = (
            await MenuItem.aggregate([
                { $unwind: "$items" },
                { $match: { "items._id": new mongoose.Types.ObjectId(itemId) } },
                { $replaceRoot: { newRoot: "$items" } }
            ])
        )[0];

        if (!menuItem) {
            return Response.Error({
                res,
                status: 404,
                message: "Item not found",
            });
        }

        const itemTotal = menuItem.Price * quantity;

        const newOrderItem = {
            menuItem: menuItem._id,
            name: menuItem.name,
            Price: menuItem.Price,
            quantity,
            specialInstructions,
        };

        // ✅ Ensure table exists and set to Occupied
        const tableDoc = await Table.findById(table);
        if (!tableDoc) {
            return Response.Error({ res, status: 404, message: "Table not found" });
        }

        // Set table status to Occupied if not already
        if (tableDoc.status !== "Occupied") {
            tableDoc.status = "Occupied";
            await tableDoc.save();
        }

        // ✅ Find or create a Pending order
        let order = await Order.findOne({ table, status: "Pending" });
        if (!order) {
            order = new Order({
                table,
                status: "Pending",
                items: [],
                Price: 0,
            });
        }

        order.items.push(newOrderItem);
        order.Price += itemTotal;
        await order.save();

        // ✅ Find or create unpaid bill
        let bill = await Bill.findOne({ table, status: "Unpaid" });
        if (!bill) {
            bill = new Bill({
                table,
                orders: [],
                totalAmount: 0,
                status: "Unpaid",
            });
        }

        if (!bill.orders.includes(order._id)) {
            bill.orders.push(order._id);
        }

        bill.totalAmount += itemTotal;
        await bill.save();
        const populatedBill = await Bill.findById(bill._id).populate({
            path: 'table',
            select: 'number' // or 'tableNumber' depending on your schema
        });
        return Response.Success({
            res,
            status: 201,
            message: "Item added to order and bill updated",
            data: { order, bill: populatedBill },
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error adding item to order",
            error: err.message,
        });
    }
};

/**
 * Get all unpaid orders for kitchen
 */
const getKitchenOrders = async (req, res) => {
    try {
        // ✅ Fetch unpaid bills with nested orders and related data
        const unpaidBills = await Bill.find({ status: "Unpaid" })
            .populate({
                path: "orders",
                populate: [
                    {
                        path: "items.menuItem",
                        select: "name Price foodType"
                    },
                    {
                        path: "table",
                        select: "number"
                    }
                ]
            })
            .populate("table", "number");
        // ✅ Extract and flatten all orders from the bills
        const allOrders = unpaidBills.flatMap(bill => bill.orders.map(order => ({
            billId: bill.number,
            tableNumber: bill.table?.number,
            orderId: order._id,
            status: order.status,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                Price: item.Price,
                foodType: item.foodType,
                specialInstructions: item.specialInstructions
            }))
        })));

        // ✅ Sort orders by oldest first
        const sortedOrders = allOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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

module.exports = { createOrder, getKitchenOrders, updateOrderStatus, setIO: module.exports.setIO };
