import React, { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../config/api";
import { Badge, Button, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

const OrderCard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        if (isMounted) {
          setOrders(
            (data.data || []).map((order) => ({
              ...order,
              orderId: order.orderId || order._id,
            }))
          );
          setError(null);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
        if (isMounted) setError("Failed to fetch orders.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };


    loadOrders();


    const interval = setInterval(loadOrders, 3000);


    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkCompleted = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "Ready");
      toast.success("Order items Ready");
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status: "Ready" } : order
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update order ❌");
    }
  };



  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (orders.length === 0)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="text-dark fw-medium">No orders found.</div>
      </div>
    );

  return (
    <div className="container mt-4 p-lg-4  ">
      <h4 className="mb-3 text-capitalize">Orders</h4>
      <Row className="g-3 pb-4">
        {[...orders]
          .sort((a, b) => {
            const aStatus = (a.status || "").toLowerCase();
            const bStatus = (b.status || "").toLowerCase();

            // Define sorting order: Pending/New → Ready → Completed
            const orderPriority = (status) => {
              if (status === "ready") return 2;
              if (status === "completed") return 3;
              return 1; // Default = Pending/New
            };

            // First, sort by status (Pending first, then Ready, then Completed)
            const priorityDiff = orderPriority(aStatus) - orderPriority(bStatus);
            if (priorityDiff !== 0) return priorityDiff;

            // Then sort by creation time (latest FIRST)
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();

            // 🔥 Reverse order so NEWEST orders appear first
            return bTime - aTime;
          })
          .map((order, idx) => {
    
  const items = (order.items || []).filter(item => {
  const category = (item.category || "").trim().toLowerCase();
  const name = (item.name || "").trim().toLowerCase();

  const hiddenTerms = [
    "cold drink",
    "cold drinks",
    "drinks",
    "beverage",
    "beverages",
    "bon",
    "sprite",
    "water bottle"
  ];

  return !hiddenTerms.some(term => category === term || name === term);
});



            return (
              <Col key={order.orderId || idx} xs={12} sm={6} lg={3}>
                <div
                  className={`border rounded shadow-sm p-3 d-flex flex-column h-100 position-relative ${order.status?.toLowerCase() === "ready"
                    ? "bg-success bg-opacity-10"
                    : order.status?.toLowerCase() === "completed"
                      ? "bg-primary bg-opacity-10"
                      : "bg-white"
                    }`}
                >
                  <Badge
                    bg={
                      order.status?.toLowerCase() === "ready"
                        ? "success"
                        : order.status?.toLowerCase() === "completed"
                          ? "primary"
                          : "danger"
                    }
                    className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded-pill text-capitalize"
                    style={{ fontSize: "0.75rem", zIndex: 10 }}
                  >
                    {order.status || "New"}
                  </Badge>

                  {/* Header */}
                  {/* Header */}
                  <div className="mb-2">
                    <strong className="fs-6">
                      {/* Show customerName if exists, else tableNumber */}
                      {order.customerName ? order.customerName : `Table ${order.tableNumber || order.table}`}
                    </strong>
                    <div className="text-dark fw-medium small">
                      Order ID: #{order.orderId}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex-grow-1 mb-2">
                    {items.map((item, i) => {
                      const lineStyle = item.isCancelled
                        ? { textDecoration: "line-through", color: "#999" }
                        : {};

                      return (
                        <div
                          key={i}
                          className="d-flex justify-content-between align-items-start small mb-2"
                        >
                          <div>
                            <div className="fw-semibold" style={lineStyle}>
                              {item.quantity}x {item.name || item.menuItem}
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                              <span
                                className={`badge bg-${item.foodType === "Jain" ? "success" : "primary"
                                  } mt-1`}
                              >
                                {item.foodType}
                              </span>
                              {item.specialInstructions && (
                                <span className="text-dark fw-medium small fst-italic text-break">
                                  {item.specialInstructions}
                                </span>
                              )}
                              {item.isCancelled && (
                                <span className="badge bg-warning text-dark">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                      <div className="text-dark fw-medium small">
                        Ordered:{" "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString()
                          : "Unknown time"}
                      </div>
                    </div>

                    {!["ready", "canceled"].includes(
                      order.status?.toLowerCase()
                    ) && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleMarkCompleted(order.orderId)}
                        >
                          Mark Ready
                        </Button>
                      )}
                  </div>
                </div>
              </Col>
            );
          })}
      </Row>

    </div>
  );
};

export default OrderCard;
