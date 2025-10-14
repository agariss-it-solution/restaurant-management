const Order = require("../../models/order.js");
const Bill = require("../../models/bill.js");
const Table = require("../../models/Table.js");
const Response = require("../../helper/errHandler.js");

const payBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod, paymentAmounts } = req.body;

    // Fetch bill from DB
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

    if (bill.status === "Paid") {
      return Response.Error({
        res,
        status: 400,
        message: "Bill is already marked as paid",
      });
    }

    const validMethods = ["online", "cash", "split"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return Response.Error({
        res,
        status: 400,
        message: `Invalid or missing paymentMethod. Allowed values: ${validMethods.join(", ")}`,
      });
    }

    // Validate bill total
    const totalAmount = Math.round((bill.totalAmount + Number.EPSILON) * 100) / 100;
    if (totalAmount <= 0) {
      return Response.Error({
        res,
        status: 400,
        message: "Cannot pay a bill with zero or negative total amount.",
      });
    }

    // Split Payment Handling
    if (paymentMethod === "split") {
      const cash = Number(paymentAmounts?.cash ?? 0);
      const online = Number(paymentAmounts?.online ?? 0);
      const splitTotal = Math.round((cash + online + Number.EPSILON) * 100) / 100;

      if (splitTotal !== totalAmount) {
        return Response.Error({
          res,
          status: 400,
          message: `Sum of split payments (${splitTotal}) must exactly match bill total (${totalAmount})`,
        });
      }

      bill.paymentMethod = "split";
      bill.paymentAmounts = {
        cash,
        online,
      };
    } else {
      // Single method: cash or online
      const amount = Number(paymentAmounts?.amount ?? 0);
      if (amount !== totalAmount) {
        return Response.Error({
          res,
          status: 400,
          message: `Payment amount (${amount}) must match bill total (${totalAmount})`,
        });
      }

      bill.paymentMethod = paymentMethod;
      bill.paymentAmounts = {
        [paymentMethod]: amount,
      };
    }

    // Static table number (optional but useful for history)
    if (bill.table?.number) {
      bill.tableNumber = bill.table.number;
    }

    // Update bill status
    bill.status = "Paid";
    await bill.save();

    // Set table as available (if exists)
    if (bill.table?._id) {
      await Table.findByIdAndUpdate(bill.table._id, { status: "Available" });
    }

    // Update related orders as completed
    await Order.updateMany(
      { _id: { $in: bill.orders } },
      { $set: { status: "Completed" } }
    );

    return Response.Success({
      res,
      status: 200,
      message: "Bill paid successfully. Orders marked complete, table released.",
      data: bill,
    });
  } catch (err) {
    return Response.Error({
      res,
      status: 500,
      message: "Error processing payment",
      error: err?.message || err,
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


module.exports = { payBill, getBill, getAllUnpaidBills, getAllBills ,updateBill};
