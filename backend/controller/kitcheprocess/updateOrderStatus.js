const Order = require("../../models/order");
const Response = require("../../helper/errHandler");

// Update order status (for kitchen/progress)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Pending", "Ready"];

        if (!status || !validStatuses.includes(status)) {
            return Response.Error({
                res,
                status: 400,
                message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return Response.Error({
                res,
                status: 404,
                message: "Order not found"
            });
        }

        return Response.Success({
            res,
            status: 200,
            message: `Order status updated to ${status} successfully`,
            data: order
        });

    } catch (err) {
        console.error("Update Order Status Error:", err);
        return Response.Error({
            res,
            status: 500,
            message: "Server Error",
            error: err.message
        });
    }
};
module.exports = updateOrderStatus;