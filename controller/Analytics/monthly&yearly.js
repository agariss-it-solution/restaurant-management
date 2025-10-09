const Order = require('../../models/order');
const Bill = require('../../models/bill');
const { getMonthNumber } = require('../utils/dateConverter'); 

const getDashboardSummary = async (req, res) => {
    try {
        let { month, year } = req.query;
        const now = new Date();
        
        const currentYear = now.getFullYear();
        const currentMonthNumber = now.getMonth() + 1; // 1-indexed

        let targetYear, targetMonthNumber;

        // --- 2. Determine Target Month and Year ---
        if (month && year) {
            targetMonthNumber = getMonthNumber(month);
            targetYear = parseInt(year);

            if (targetMonthNumber === null || isNaN(targetYear)) {
                return res.status(400).json({
                    message: `Invalid month name (${month}) or year (${year}) provided.`
                });
            }

        } else if (year) {
            targetMonthNumber = 1; // Start from January
            targetYear = parseInt(year);

            if (isNaN(targetYear)) {
                 return res.status(400).json({ message: `Invalid year (${year}) provided.` });
            }

        } else if (month) {
            targetMonthNumber = getMonthNumber(month);
            targetYear = currentYear;

            if (targetMonthNumber === null) {
                 return res.status(400).json({ message: `Invalid month name (${month}) provided.` });
            }

        } else {
            targetMonthNumber = currentMonthNumber;
            targetYear = currentYear;
        }


        let startFilterDate, endFilterDateExclusive;

        if (year && !month) {
            startFilterDate = new Date(targetYear, 0, 1);       // Jan 1st of target year
            endFilterDateExclusive = new Date(targetYear + 1, 0, 1); // Jan 1st of next year
            
        } else {
            startFilterDate = new Date(targetYear, targetMonthNumber - 1, 1);
            endFilterDateExclusive = new Date(targetYear, targetMonthNumber, 1);
        }
        
        const filterLabel = (year && !month) 
            ? `Year ${targetYear}` 
            : `${month || currentMonthNumber} ${targetYear}`;


       
        // This is separate and always uses the current date
        const todayNoon = new Date();
        todayNoon.setHours(12, 0, 0, 0);

        let startTime, endTime;
        if (now >= todayNoon) {
            startTime = todayNoon;
            endTime = new Date(todayNoon.getTime() + 24 * 60 * 60 * 1000);
        } else {
            startTime = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000);
            endTime = todayNoon;
        }


        // --- Daily Revenue (UNCHANGED) ---
        const totalRevenueAgg = await Bill.aggregate([
            { $match: { createdAt: { $gte: startTime, $lt: endTime }, status: "Paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;


        // ------------------------------------------------------------------
        // --- 4. Dynamic Revenue (Using the Calculated Filter Range) ---
        const monthlyRevenueAgg = await Bill.aggregate([
            {
                $match: {
                    createdAt: { $gte: startFilterDate, $lt: endFilterDateExclusive },
                    status: "Paid"
                }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;
        // ------------------------------------------------------------------


        // --- Orders & Stats Today (UNCHANGED) ---
        const ordersToday = await Order.countDocuments({ createdAt: { $gte: startTime, $lt: endTime } });
        const completedOrders = await Order.countDocuments({ createdAt: { $gte: startTime, $lt: endTime }, status: "Completed" });
        
        const unpaidBills = await Bill.aggregate([
             { $match: { createdAt: { $gte: startTime, $lt: endTime }, status: "Unpaid" } },
             { $unwind: "$orders" },
             { $group: { _id: null, countOrders: { $sum: 1 } } }
        ]);
        const activeOrders = unpaidBills[0]?.countOrders || 0;

        // --- Payment Method Breakdown (UNCHANGED, uses Daily Range) ---
        const paymentBreakdown = await Bill.aggregate([
            { $match: { createdAt: { $gte: startTime, $lt: endTime }, status: "Paid" } },
            { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" } } }
        ]);
        const paymentTotals = { cash: 0, online: 0, total: 0 };
        for (const p of paymentBreakdown) {
            const method = (p._id || "").toLowerCase();
            if (method === "cash") { paymentTotals.cash = p.total; } 
            else if (method === "online") { paymentTotals.online = p.total; } 
            paymentTotals.total += p.total;
        }
        
        // --- Daily Metrics (UNCHANGED) ---
        const avgOrderValue = ordersToday > 0 ? totalRevenue / ordersToday : 0;
        const completionRate = ordersToday > 0 ? (completedOrders / ordersToday) * 100 : 0;

        // ------------------------------------------------------------------
        // --- 5. Dynamic Orders & Stats (Using the Calculated Filter Range) ---
        const monthlyOrders = await Order.countDocuments({
            createdAt: { $gte: startFilterDate, $lt: endFilterDateExclusive }
        });

        const monthlyCompletedOrders = await Order.countDocuments({
            createdAt: { $gte: startFilterDate, $lt: endFilterDateExclusive },
            status: "Completed"
        });

        const monthlyAvgOrderValue = monthlyOrders > 0 ? monthlyRevenue / monthlyOrders : 0;
        const monthlyCompletionRate = monthlyOrders > 0 ? (monthlyCompletedOrders / monthlyOrders) * 100 : 0;

        // --- 6. Dynamic Top 5 Most Ordered Items (Using the Calculated Filter Range) ---
        const topItemsAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startFilterDate, $lt: endFilterDateExclusive } } },
            { $unwind: "$items" },
            { $match: { "items.isCancelled": false } },
            { $group: { _id: "$items.menuItem", name: { $first: "$items.name" }, totalQuantity: { $sum: "$items.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);
        // ------------------------------------------------------------------

        // --- Final Response ---
        return res.status(200).json({
            success: true,
            message: `Analytics fetched for ${filterLabel}. Daily stats for ${startTime.toLocaleDateString()} 12 PM to ${endTime.toLocaleDateString()} 12 PM.`,
            data: {
                // Monthly/Yearly Filtered Stats
                totalRevenue: monthlyRevenue.toFixed(2),
                monthlyOrders,
                monthlyCompletedOrders,
                monthlyAvgOrderValue: monthlyAvgOrderValue.toFixed(2),
                monthlyCompletionRate: monthlyCompletionRate.toFixed(2) + "%",
                topItems: topItemsAgg,

                // Daily Stats (Current Time)
                todayRevenue: totalRevenue.toFixed(2),
                ordersToday,
                completedOrders,
                activeOrders,
                avgOrderValue: avgOrderValue.toFixed(2),
                completionRate: completionRate.toFixed(2) + "%",
                paymentTotals, 
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

module.exports = getDashboardSummary;