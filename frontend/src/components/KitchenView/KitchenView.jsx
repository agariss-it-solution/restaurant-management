import React, { useState, useEffect, useRef } from "react";
import { Button, Badge, Container, Row, Col } from "react-bootstrap";
import { fetchOrders, logout, updateOrderStatus } from "../config/api";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import sounds from "./sounds/new-notification-022-370046.mp3";
import logo from "../Images/Untitled design.png";

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const audioRef = useRef(null); // Sound notification reference
  const previousOrderIdsRef = useRef([]); // Track previous order IDs

  // Terms/categories to hide orders containing only these items
  const hiddenTerms = [
    "cold drink",
    "cold drinks",
    "drinks",
    "beverage",
    "beverages",
    "bon",
    "sprite",
    "water bottle",
    "mango",
    "maaza",
    "pepsi",
    "coca cola",
    "limca",
    "lemon"
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    navigate("/");
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        if (!isMounted) return;

        const newOrders = (data.data || []).map((order) => ({
          ...order,
          orderId: order.orderId || order._id,
        }));

        // Compare order IDs
        const newOrderIds = newOrders.map((o) => o.orderId);
        const prevOrderIds = previousOrderIdsRef.current;

        const hasNewOrders = newOrderIds.some((id) => !prevOrderIds.includes(id));

        if (hasNewOrders && audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.warn("Audio play failed:", err);
          });
        }

        // Save new list
        previousOrderIdsRef.current = newOrderIds;
        setOrders(newOrders);
        setError(null);
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
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) {
      toast.error("Order not found.");
      return;
    }

    // Filter visible items
    const visibleItems = (order.items || []).filter((item) => {
      const category = (item.category || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      return !hiddenTerms.some(
        (term) => category.includes(term) || name.includes(term)
      );
    });

    if (visibleItems.length === 0) {
      toast.info("No visible items to mark as Ready.");
      return; // Do not proceed if no visible items
    }

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

  return (
    <div className="p-lg-3">
      {/* Header */}
      <div className="mb-4 mt-4 border-bottom pb-3 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        {/* Left Side: Title */}
        <div className="d-flex align-items-center gap-2">
          <img
            src={logo}
            alt="MK'S Food Logo"
            style={{ width: "50px", height: "50px", objectFit: "contain" }}
          />
          <div>
            <h4 className="mb-0 fw-bold">Kitchen Display</h4>
            <small className="text-dark fw-medium">Welcome, Chef</small>
          </div>
        </div>

        {/* Right Side: Translate + Logout */}
        <div className="d-flex align-items-center gap-3">
          <div id="google_translate_element" style={{ minWidth: 120 }}></div>

          <Button
            variant="outline-dark"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={handleLogout}
          >
            <FiLogOut /> Logout
          </Button>
        </div>
      </div>

      {/* Orders Grid or Empty State */}
      <div className="container mt-4">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-danger text-center">{error}</div>
        ) : orders.length === 0 ? (
          <div
            className="d-flex justify-content-center align-items-center text-dark fw-medium"
            style={{ height: "50vh" }}
          >
            No orders found.
          </div>
        ) : (
          <Row className="g-3 pb-4">
            {[...orders]
              .sort((a, b) => {
                const aStatus = (a.status || "").toLowerCase();
                const bStatus = (b.status || "").toLowerCase();

                const orderPriority = (status) => {
                  if (status === "ready") return 2;
                  if (status === "completed") return 3;
                  return 1;
                };

                const priorityDiff = orderPriority(aStatus) - orderPriority(bStatus);
                if (priorityDiff !== 0) return priorityDiff;

                const aTime = new Date(a.createdAt || 0).getTime();
                const bTime = new Date(b.createdAt || 0).getTime();
                return bTime - aTime;
              })
              .map((order, idx) => {
                // Filter visible items per order
                const visibleItems = (order.items || []).filter((item) => {
                  const category = (item.category || "").toLowerCase();
                  const name = (item.name || "").toLowerCase();
                  return !hiddenTerms.some(
                    (term) => category.includes(term) || name.includes(term)
                  );
                });

                // If no visible items, skip rendering this order card
                if (visibleItems.length === 0) return null;

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
                      <div className="mb-2">
                        <strong className="fs-6">
                          {order.customerName
                            ? order.customerName // Show customer name for Takeaway
                            : `Table ${order.tableNumber || order.table}`}
                        </strong>
                      </div>

                      {/* Visible Items */}
                      <div className="flex-grow-1 mb-2">
                        {visibleItems.map((item, i) => {
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

                        {!["ready", "canceled"].includes(order.status?.toLowerCase()) && (
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
        )}
      </div>

      {/* 🔊 Sound Notification */}
      <audio ref={audioRef} src={sounds} preload="auto" />
    </div>
  );
};

export default KitchenDisplay;
