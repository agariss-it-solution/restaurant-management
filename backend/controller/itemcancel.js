const Response = require("../helper/errHandler");
const Bill = require("../models/bill");
const Order = require("../models/order");
// const Table = require("../models/Table");


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

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.Error({
        res,
        status: 404,
        message: "Order not found",
      });
    }

    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return Response.Error({
        res,
        status: 404,
        message: "Item not found in order",
      });
    }

    const item = order.items[itemIndex];

    if (item.isCancelled) {
      return Response.Error({
        res,
        status: 400,
        message: "Item is already canceled",
      });
    }

    const itemTotal = item.Price * item.quantity;

    order.items[itemIndex].isCancelled = true;

    order.Price -= itemTotal;
    if (order.Price < 0) order.Price = 0;

    await order.save();

    const bill = await Bill.findOne({ orders: orderId, status: "Unpaid" });
    if (!bill) {
      return Response.Error({
        res,
        status: 404,
        message: "No unpaid bill found for this order",
      });
    }

    bill.totalAmount -= itemTotal;
    if (bill.totalAmount < 0) bill.totalAmount = 0;

    const allItemsCanceledInOrder = order.items.every(i => i.isCancelled);
    if (allItemsCanceledInOrder) {
      order.status = "Canceled";
      await order.save();
    }

    const allOrders = await Order.find({ _id: { $in: bill.orders } });

    let allItemsCanceledInBill = true;
    for (const ord of allOrders) {
      const hasActiveItem = ord.items.some(i => !i.isCancelled);
      if (hasActiveItem) {
        allItemsCanceledInBill = false;
        break;
      }
    }

    if (allItemsCanceledInBill) {
      bill.status = "Canceled";
    }

    await bill.save();

    return Response.Success({
      res,
      status: 200,
      message: "Order item canceled successfully",
      data: { order, bill },
    });

  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Failed to cancel order item",
      error: err.message,
    });
  }
};




module.exports = cancelOrderItem;