const Order = require("../models/order.js");
const Bill = require("../models/bill.js");
const Table = require("../models/Table.js");
const Response = require("../helper/errHandler.js");
const MenuItem = require('../models/MenuCategory.js')
const mongoose = require("mongoose");

// const createOrder = async (req, res) => {
//     try {
//         const { table, itemId, quantity, specialInstructions } = req.body;

//         if (!table || !itemId || !quantity) {
//             return Response.Error({
//                 res,
//                 status: 400,
//                 message: "table, itemId, and quantity are required",
//             });
//         }

//         // Find the menu item
//         const menuItem = (
//             await MenuItem.aggregate([
//                 { $unwind: "$items" },
//                 { $match: { "items._id": new mongoose.Types.ObjectId(itemId) } },
//                 { $replaceRoot: { newRoot: "$items" } }
//             ])
//         )[0];

//         if (!menuItem) {
//             return Response.Error({
//                 res,
//                 status: 404,
//                 message: "Item not found",
//             });
//         }

//         const itemTotal = menuItem.Price * quantity;

//         const newOrderItem = {
//             menuItem: menuItem._id,
//             name: menuItem.name,
//             Price: menuItem.Price,
//             quantity,
//             specialInstructions,
//         };

//         // ✅ Ensure table exists and set to Occupied
//         const tableDoc = await Table.findById(table);
//         if (!tableDoc) {
//             return Response.Error({ res, status: 404, message: "Table not found" });
//         }

//         // Set table status to Occupied if not already
//         if (tableDoc.status !== "Occupied") {
//             tableDoc.status = "Occupied";
//             await tableDoc.save();
//         }

//         // ✅ Find or create a Pending order
//         let order = await Order.findOne({ table, status: "Pending" });
//         if (!order) {
//             order = new Order({
//                 table,
//                 status: "Pending",
//                 items: [],
//                 Price: 0,
//             });
//         }

//         order.items.push(newOrderItem);
//         order.Price += itemTotal;
//         await order.save();

//         // ✅ Find or create unpaid bill
//         let bill = await Bill.findOne({ table, status: "Unpaid" });
//         if (!bill) {
//             bill = new Bill({
//                 table,
//                 orders: [],
//                 totalAmount: 0,
//                 status: "Unpaid",
//             });
//         }

//         if (!bill.orders.includes(order._id)) {
//             bill.orders.push(order._id);
//         }

//         bill.totalAmount += itemTotal;
//         await bill.save();
//         const populatedBill = await Bill.findById(bill._id).populate({
//             path: 'table',
//             select: 'number' // or 'tableNumber' depending on your schema
//         });
//         return Response.Success({
//             res,
//             status: 201,
//             message: "Item added to order and bill updated",
//             data: { order, bill: populatedBill },
//         });

//     } catch (err) {
//         return Response.Error({
//             res,
//             status: 500,
//             message: "Error adding item to order",
//             error: err.message,
//         });
//     }
// };
const createOrder = async (req, res) => {
    function capitalizeFirstLetter(string) {
        if (!string) return "Regular"; // default to "Regular"
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    try {
        const { table, items } = req.body;
        if (!table || !Array.isArray(items) || items.length === 0) {
            return Response.Error({
                res,
                status: 400,
                message: "Table and at least one item are required.",
            });
        }

        // Check if table exists
        const tableDoc = await Table.findById(table);
        if (!tableDoc) {
            return Response.Error({ res, status: 404, message: "Table not found" });
        }

        // Set table status to Occupied if not already
        if (tableDoc.status !== "Occupied") {
            tableDoc.status = "Occupied";
            await tableDoc.save();
        }

        const orderItems = [];
        let totalPrice = 0;

        // Loop through each item to fetch menu details and build order items
        for (const item of items) {
            const { itemId, quantity, specialInstructions, foodType } = item;

            if (!itemId || !quantity) continue;

            const menuItem = (
                await MenuItem.aggregate([
                    { $unwind: "$items" },
                    { $match: { "items._id": new mongoose.Types.ObjectId(itemId) } },
                    { $replaceRoot: { newRoot: "$items" } },
                ])
            )[0];

            if (menuItem) {
                const itemTotal = menuItem.Price * quantity;

                orderItems.push({
                    menuItem: menuItem._id,
                    name: menuItem.name,
                    Price: menuItem.Price,
                    quantity,
                    specialInstructions: specialInstructions || "",
                    foodType: capitalizeFirstLetter(foodType), // Ensure enum case
                });

                totalPrice += itemTotal;
            }
        }

        if (orderItems.length === 0) {
            return Response.Error({
                res,
                status: 400,
                message: "No valid items found to create order",
            });
        }

        // Create new Order document
        const newOrder = new Order({
            table,
            status: "Pending",
            items: orderItems,
            Price: totalPrice,
        });

        await newOrder.save();

        // Find or create unpaid bill for this table
        let bill = await Bill.findOne({ table, status: "Unpaid" });
        if (!bill) {
            bill = new Bill({
                table,
                orders: [],
                totalAmount: 0,
                status: "Unpaid",
            });
        }

        // Add new order to bill if not already added
        if (!bill.orders.includes(newOrder._id)) {
            bill.orders.push(newOrder._id);
        }

        bill.totalAmount += totalPrice;
        await bill.save();

        // Populate bill with table info
        const populatedBill = await Bill.findById(bill._id).populate({
            path: "table",
            select: "number", // or your table number field
        });

        return Response.Success({
            res,
            status: 201,
            message: "New order created and added to bill",
            data: { order: newOrder, bill: populatedBill },
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
        const allOrders = unpaidBills.flatMap(bill =>
            bill.orders.map(order => ({
                billId: bill.number,
                tableNumber: bill.table?.number,
                orderId: order._id,
                status: order.status,
                createdAt: order.createdAt,
                items: order.items.map(item => ({
                    itemId: item._id,                   // ✅ Item's unique ID
                    name: item.name,                    // ⛔️ May be undefined if name comes from menuItem
                    quantity: item.quantity,
                    Price: item.Price,
                    foodType: item.foodType,
                    specialInstructions: item.specialInstructions,
                    isCancelled: item.isCancelled       // ✅ Add this field
                }))
            }))
        );

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
const getOrderHistory = async (req, res) => {
    try {
        // Step 1: Get all Paid bills
        const paidBills = await Bill.find({ status: "Paid" })
            .select("orders")
            .lean();

        const orderIds = paidBills.flatMap(bill => bill.orders);

        if (orderIds.length === 0) {
            return Response.Success({
                res,
                status: 200,
                message: "No paid orders found",
                data: [],
            });
        }

        // Step 2: Fetch orders linked to those bills
        const orders = await Order.find({ _id: { $in: orderIds } })
            .sort({ createdAt: -1 })
            .lean();

        return Response.Success({
            res,
            status: 200,
            message: "All paid orders retrieved successfully",
            data: orders,
        });

    } catch (err) {
        return Response.Error({
            res,
            status: 500,
            message: "Error fetching paid orders",
            error: err.message,
        });
    }
};

const deleteOrderHistory = async (req, res) => {
    try {
        const { range } = req.query;

        if (!["weekly", "monthly", "yearly"].includes(range)) {
            return res.status(400).json({
                success: false,
                message: "Invalid range. Must be 'weekly', 'monthly', or 'yearly'."
            });
        }

        // --- Step 1: Calculate cutoff date ---
        const now = new Date();
        let cutoffDate;

        switch (range) {
            case "weekly":
                cutoffDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case "monthly":
                cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case "yearly":
                cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }

        // --- Step 2: Get Paid bills before cutoff date ---
        const billsToDelete = await Bill.find({
            status: "Paid",
            createdAt: { $lt: cutoffDate }
        }).select("_id orders").lean();

        if (!billsToDelete.length) {
            return res.status(200).json({
                success: true,
                message: `No ${range} bills/orders found to delete.`,
                deletedBills: [],
                deletedOrders: []
            });
        }

        // --- Step 3: Extract all order IDs from bills ---
        const orderIdsToDelete = billsToDelete.flatMap(b => b.orders);
        const billIdsToDelete = billsToDelete.map(b => b._id);

        // --- Step 4: Delete orders ---
        await Order.deleteMany({ _id: { $in: orderIdsToDelete } });

        // --- Step 5: Delete bills ---
        await Bill.deleteMany({ _id: { $in: billIdsToDelete } });

        return res.status(200).json({
            success: true,
            message: `${billIdsToDelete.length} bills and ${orderIdsToDelete.length} orders deleted successfully.`,
            deletedBills: billIdsToDelete,
            deletedOrders: orderIdsToDelete
        });

    } catch (err) {
        console.error("deleteOrderHistory error:", err);
        return res.status(500).json({
            success: false,
            message: "Error deleting order and bill history",
            error: err.message
        });
    }
};

// exportOrdersToPDF



const updateOrderItemQuantity = async (req, res) => {
  try {
    const { orderId, itemId, newQuantity } = req.body;

    if (!orderId || !itemId || typeof newQuantity !== "number") {
      return Response.Error({
        res,
        status: 400,
        message: "orderId, itemId, and newQuantity are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.Error({ res, status: 404, message: "Order not found" });
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

    const oldQuantity = item.quantity;
    const pricePerUnit = item.Price;
    const quantityDiff = newQuantity - oldQuantity;
    const amountDiff = pricePerUnit * quantityDiff;

    // Update item quantity
    item.quantity = newQuantity;
    if (newQuantity === 0) {
      item.isCancelled = true;
    } else {
      item.isCancelled = false;
    }

    // Update order total
    order.Price += amountDiff;
    if (order.Price < 0) order.Price = 0;

    // Update bill
    const bill = await Bill.findOne({ orders: orderId, status: "Unpaid" });
    if (!bill) {
      return Response.Error({ res, status: 404, message: "Related bill not found" });
    }

    bill.totalAmount += amountDiff;
    if (bill.totalAmount < 0) bill.totalAmount = 0;

    // Auto-cancel order if all items cancelled/zero
    const allCancelled = order.items.every(i => i.quantity === 0 || i.isCancelled);
    if (allCancelled) {
      order.status = "Canceled";
    } else if (order.status === "Canceled") {
      order.status = "Pending";
    }

    await order.save();
    await bill.save();

    return Response.Success({
      res,
      status: 200,
      message: "Item quantity updated successfully",
      data: { order, bill },
    });

  } catch (err) {
    console.error("Update Order Item Quantity Error:", err);
    return Response.Error({
      res,
      status: 500,
      message: "Failed to update order item quantity",
      error: err.message,
    });
  }
};


module.exports = { createOrder, getKitchenOrders, updateOrderStatus, getOrderHistory, deleteOrderHistory ,updateOrderItemQuantity};
