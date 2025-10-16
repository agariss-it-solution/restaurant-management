const Order = require("../../models/order.js");
const Bill = require("../../models/bill.js");
const Table = require("../../models/Table.js");
const Response = require("../../helper/errHandler.js");

const payBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod, paymentAmounts } = req.body;

    // Fetch the bill with table info
    const bill = await Bill.findById(billId).populate({
      path: "table",
      select: "number",
    });

    if (!bill) {
      return Response.Error({ res, status: 404, message: "Bill not found" });
    }

    // Validate payment method
    const validMethods = ["online", "cash", "split"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return Response.Error({
        res,
        status: 400,
        message: `Invalid or missing paymentMethod. Allowed values: ${validMethods.join(", ")}`,
      });
    }

    if (bill.status === "Paid") {
      return Response.Error({ res, status: 400, message: "Bill already paid" });
    }

    if (!bill.totalAmount || bill.totalAmount <= 0) {
      return Response.Error({ res, status: 400, message: "Cannot pay a bill with total amount 0" });
    }

    // Handle split payments
    if (paymentMethod === "split") {
      const cashAmount = Number(paymentAmounts?.cash || 0);
      const onlineAmount = Number(paymentAmounts?.online || 0);
      const sum = cashAmount + onlineAmount;

      if (sum !== bill.totalAmount) {
        return Response.Error({
          res,
          status: 400,
          message: `Sum of split payments (${sum}) must equal bill total amount (${bill.totalAmount})`,
        });
      }

      bill.paymentAmounts = { cash: cashAmount, online: onlineAmount };
    } else {
      // Single payment (cash or online)
      const amount = Number(paymentAmounts?.amount ?? bill.totalAmount);

      if (amount !== bill.totalAmount) {
        return Response.Error({
          res,
          status: 400,
          message: `Payment amount (${amount}) must equal bill total (${bill.totalAmount})`,
        });
      }

      bill.paymentAmounts = { cash: 0, online: 0, [paymentMethod]: amount };
    }

    // Update table number if exists
    if (bill.table && bill.table.number) bill.tableNumber = bill.table.number;

    // Mark bill as paid
    bill.status = "Paid";
    bill.paymentMethod = paymentMethod;
    await bill.save();

    // Update table status to Available
    if (bill.table && bill.table._id) {
      await Table.findByIdAndUpdate(bill.table._id, { status: "Available" });
    }

    // Mark all orders in this bill as Completed
    if (bill.orders && bill.orders.length > 0) {
      await Order.updateMany(
        { _id: { $in: bill.orders } },
        { $set: { status: "Completed" } }
      );
    }

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

    // console.log('bills', bills)
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

const updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { discountValue } = req.body; // Flat discount only

    // Find bill
    const bill = await Bill.findById(billId).populate({
      path: "table",
      select: "number",
    });

    if (!bill) {
      return Response.Error({
        res,
        status: 404,
        message: "Bill not found",
      });
    }

    // Validate discount
    const discount = Number(discountValue) || 0;
    if (discount < 0) {
      return Response.Error({
        res,
        status: 400,
        message: "Discount value cannot be negative",
      });
    }

    if (discount > bill.totalAmount) {
      return Response.Error({
        res,
        status: 400,
        message: "Discount cannot exceed total amount",
      });
    }

    // Apply discount
    const newTotal = bill.totalAmount - discount;

    // Save updated values
    bill.discountValue = discount;
    bill.finalAmount = newTotal;

    await bill.save();

    return Response.Success({
      res,
      status: 200,
      message: "Bill updated successfully with discount",
      data: bill,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error updating bill",
      error: err.message,
    });
  }
};


module.exports = { payBill, getBill, getAllUnpaidBills, getAllBills, updateBill };
