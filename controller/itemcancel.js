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

    // 1. Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return Response.Error({
        res,
        status: 404,
        message: "Order not found",
      });
    }

    // 2. Find the item to cancel
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return Response.Error({
        res,
        status: 404,
        message: "Item not found in order",
      });
    }

    const item = order.items[itemIndex];

    // 3. Already canceled?
    if (item.isCancelled) {
      return Response.Error({
        res,
        status: 400,
        message: "Item is already canceled",
      });
    }

    // 4. Calculate item total
    const itemTotal = item.Price * item.quantity;

    // 5. Mark item as canceled
    order.items[itemIndex].isCancelled = true;

    // 6. Reduce order total
    order.Price -= itemTotal;
    if (order.Price < 0) order.Price = 0;

    await order.save();

    // 7. Fetch the associated unpaid bill
    const bill = await Bill.findOne({ orders: orderId, status: "Unpaid" });
    if (!bill) {
      return Response.Error({
        res,
        status: 404,
        message: "No unpaid bill found for this order",
      });
    }

    // 8. Reduce bill total
    bill.totalAmount -= itemTotal;
    if (bill.totalAmount < 0) bill.totalAmount = 0;

    // 9. If all items in this order are canceled, mark order as Canceled
    const allItemsCanceledInOrder = order.items.every(i => i.isCancelled);
    if (allItemsCanceledInOrder) {
      order.status = "Canceled";
      await order.save();
    }

    // 10. Check all orders in the bill to see if all items are canceled
    const allOrders = await Order.find({ _id: { $in: bill.orders } });

    let allItemsCanceledInBill = true;
    for (const ord of allOrders) {
      const hasActiveItem = ord.items.some(i => !i.isCancelled);
      if (hasActiveItem) {
        allItemsCanceledInBill = false;
        break;
      }
    }

    // 11. Mark bill as Canceled if all items are canceled
    if (allItemsCanceledInBill) {
      bill.status = "Canceled";
    }

    await bill.save();

    // ✅ Success
    return Response.Success({
      res,
      status: 200,
      message: "Order item canceled successfully",
      data: { order, bill },
    });

  } catch (err) {
    // ❌ Error handler
    return Response.Error({
      res,
      status: 500,
      message: "Failed to cancel order item",
      error: err.message,
    });
  }
};




module.exports = cancelOrderItem;