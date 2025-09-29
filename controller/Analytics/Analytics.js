const Order = require("../../models/order");
const Bill = require("../../models/bill");

// const getAnalytics = async (req, res) => {
//     try {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         // 1. Total Revenue from Paid Bills
//         const totalRevenueAgg = await Bill.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: today },
//                     status: "Paid"
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$totalAmount" }
//                 }
//             }
//         ]);
//         const totalRevenue = totalRevenueAgg[0]?.total || 0;

//         // 2. Orders Today
//         const ordersToday = await Order.countDocuments({
//             createdAt: { $gte: today }
//         });

//         // 3. Completed Orders (for Completion Rate)
//         const completedOrders = await Order.countDocuments({
//             createdAt: { $gte: today },
//             status: "Completed"
//         });

//         // 4. Average Order Value
//         const avgOrderValue = ordersToday > 0 ? totalRevenue / ordersToday : 0;

//         // 5. Completion Rate
//         const completionRate = ordersToday > 0 ? (completedOrders / ordersToday) * 100 : 0;

//         // ✅ Formatted Response
//         return res.status(200).json({
//             success: true,
//             message: "Dashboard data fetched successfully",
//             data: {
//                 totalRevenue: totalRevenue.toFixed(2),
//                 ordersToday,
//                 avgOrderValue: avgOrderValue.toFixed(2),
//                 completionRate: completionRate.toFixed(2) + "%"
//             }
//         });

//     } catch (error) {
//         console.error("Dashboard error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };


const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // --- Daily Time Range (12 PM to 12 PM logic) ---
    const todayNoon = new Date();
    todayNoon.setHours(12, 0, 0, 0); // today 12:00 PM

    let startTime, endTime;
    if (now >= todayNoon) {
      startTime = todayNoon;
      endTime = new Date(todayNoon.getTime() + 24 * 60 * 60 * 1000); // tomorrow 12 PM
    } else {
      startTime = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000); // yesterday 12 PM
      endTime = todayNoon;
    }

    // --- Monthly Time Range ---
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // --- Daily Revenue (Paid bills) ---
    const totalRevenueAgg = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime, $lt: endTime },
          status: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // --- Monthly Revenue ---
    const monthlyRevenueAgg = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
          status: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // --- Orders & Stats Today ---
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startTime, $lt: endTime }
    });

    const completedOrders = await Order.countDocuments({
      createdAt: { $gte: startTime, $lt: endTime },
      status: "Completed"
    });

    // --- Active (Unpaid) Orders ---
    const unpaidBills = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime, $lt: endTime },
          status: "Unpaid"
        }
      },
      { $unwind: "$orders" },
      {
        $group: {
          _id: null,
          countOrders: { $sum: 1 }
        }
      }
    ]);
    const activeOrders = unpaidBills[0]?.countOrders || 0;

    // --- Payment Method Breakdown ---
    const paymentBreakdown = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime, $lt: endTime },
          status: "Paid"
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const paymentTotals = {
      cash: 0,
      online: 0,
      total: 0
    };

    for (const p of paymentBreakdown) {
      const method = (p._id || "").toLowerCase();
      if (method === "cash") {
        paymentTotals.cash = p.total;
      } else if (method === "online") {
        paymentTotals.online = p.total;
      } else {
        paymentTotals.total += p.total;
      }
    }

    paymentTotals.total = paymentTotals.cash + paymentTotals.online;

    // --- Daily Metrics ---
    const avgOrderValue = ordersToday > 0 ? totalRevenue / ordersToday : 0;
    const completionRate = ordersToday > 0 ? (completedOrders / ordersToday) * 100 : 0;

    // --- Monthly Orders & Stats ---
    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    const monthlyCompletedOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      status: "Completed"
    });

    const monthlyAvgOrderValue = monthlyOrders > 0 ? monthlyRevenue / monthlyOrders : 0;
    const monthlyCompletionRate = monthlyOrders > 0 ? (monthlyCompletedOrders / monthlyOrders) * 100 : 0;

    // --- Monthly Top 5 Most Ordered Items ---
 // --- Monthly Top 5 Most Bought Items ---
const topItemsAgg = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    }
  },
  { $unwind: "$items" },
  {
    $match: {
      "items.isCancelled": false // Only count non-cancelled items
    }
  },
  {
    $group: {
      _id: "$items.menuItem", // Group by menuItem (ObjectId)
      name: { $first: "$items.name" },
      totalQuantity: { $sum: "$items.quantity" }
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 5 }
]);


    // --- Final Response ---
    return res.status(200).json({
      success: true,
      message: `Analytics fetched for ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
      data: {
        // Time range
        from: startTime.toISOString(),
        to: endTime.toISOString(),

        // Daily Stats
        todayRevenue: totalRevenue.toFixed(2),
        ordersToday,
        completedOrders,
        activeOrders,
        avgOrderValue: avgOrderValue.toFixed(2),
        completionRate: completionRate.toFixed(2) + "%",

        // Monthly Stats
        totalRevenue: monthlyRevenue.toFixed(2),
        monthlyOrders,
        monthlyCompletedOrders,
        monthlyAvgOrderValue: monthlyAvgOrderValue.toFixed(2),
        monthlyCompletionRate: monthlyCompletionRate.toFixed(2) + "%",

        // Payments
        paymentTotals,

        // Monthly Top 5 Items
        topItems: topItemsAgg
      }
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};





module.exports = getAnalytics;