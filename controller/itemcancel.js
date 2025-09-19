const Response = require("../helper/errHandler");
const Bill = require("../models/bill");
const Order = require("../models/order");
const Table = require("../models/Table");

const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        if (!orderId || !itemId) {
            return Response.Error({
                res,
                status: 400,
                message: "orderId and itemId are required",
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return Response.Error({
                res,
                status: 404,
                message: "Order not found",
            });
        }

        // Find the item in order
        const itemIndex = order.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return Response.Error({
                res,
                status: 404,
                message: "Item not found in order",
            });
        }

        const item = order.items[itemIndex];
        const itemTotal = item.Price * item.quantity;

        // Remove item and update order total
        order.items.splice(itemIndex, 1);
        order.Price -= itemTotal;
        await order.save();

        // If order has no more items, consider removing the order
        if (order.items.length === 0) {
            await Order.findByIdAndDelete(order._id);
        }

        // Update the bill
        const bill = await Bill.findOne({ orders: orderId, status: "Unpaid" });
        if (bill) {
            bill.totalAmount -= itemTotal;

            // If order was deleted, remove it from the bill
            if (order.items.length === 0) {
                bill.orders = bill.orders.filter(
                    id => id.toString() !== orderId
                );
            }

            await bill.save();

            // If no orders left, maybe mark table as "Available"
            if (bill.orders.length === 0) {
                await Table.findByIdAndUpdate(bill.table, { status: "Available" });
            }
        }

        return Response.Success({
            res,
            status: 200,
            message: "Order item cancelled and bill updated",
            data: { order, bill },
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error cancelling order item",
            error: err.message,
        });
    }
};
module.exports = cancelOrderItem;