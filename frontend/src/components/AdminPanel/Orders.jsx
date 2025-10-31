import React, { useEffect, useState } from "react";
import { fetchOrders, updateOrderItem, cancelOrderItem } from "../config/api";
import { Badge, Button, Container } from "react-bootstrap";
import { toast } from "react-toastify";

const OrderCard = () => {
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [editingOrders, setEditingOrders] = useState({});

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        const normalizedOrders = (data.data || []).map((order) => ({
          ...order,
          orderId: order.orderId || order._id,
          customerName: order.customerName,
          tableNumber: order.tableNumber || null,
          items: (order.items || []).map((item, index) => ({
            ...item,
            itemId: item.itemId || item._id || `${order.orderId}_item_${index}`,
            uniqueKey: `${order.orderId}_${item.itemId || item._id || index}`, // ✅ unique per order-item
            parentOrderId: order.orderId, // ✅ for correct backend updates
            quantity: item.quantity || 1,
            isCancelled: item.isCancelled || false,
          })),
        }));

        // ✅ Group orders by tableNumber / customerName if needed
        const groupedOrdersMap = new Map();

        normalizedOrders.forEach((order) => {
          const isTakeaway = !order.tableNumber;
          const key = isTakeaway
            ? `${order.customerName || "Takeaway"}_${order.orderId}`
            : order.tableNumber;

          if (!groupedOrdersMap.has(key)) {
            groupedOrdersMap.set(key, { ...order, items: [...order.items] });
          } else {
            const existing = groupedOrdersMap.get(key);
            existing.items = [...existing.items, ...order.items];
          }
        });

// ✅ Merge identical items (same name + price + foodType) but keep backend links
const groupedOrders = Array.from(groupedOrdersMap.values()).map((order) => {
  const mergedMap = new Map();

  order.items.forEach((item) => {
    const name = (item.name || item.menuItem || "").trim().toLowerCase();
    const price = Number(item.Price || item.price || 0);
    const type = (item.foodType || "").trim().toLowerCase();
    const key = `${name}_${price}_${type}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        ...item,
        originalItems: [item], // ✅ keep track of all originals
      });
    } else {
      const existing = mergedMap.get(key);
      existing.quantity += item.quantity || 1;
      existing.originalItems.push(item);
    }
  });

  const mergedItems = Array.from(mergedMap.values());

  // ✅ Calculate total
  const total = mergedItems
    .filter((it) => !it.isCancelled)
    .reduce(
      (sum, it) => sum + (Number(it.Price || it.price || 0) * (it.quantity || 0)),
      0
    );

  return { ...order, items: mergedItems, total };
});

setOrders(groupedOrders);
setOriginalOrders(groupedOrders.map((o) => structuredClone(o)));

      } catch (err) {
        console.error("Error loading orders:", err);
        setError("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // ✅ Handle quantity increase/decrease safely using uniqueKey
  const handleQuantityChange = (uniqueKey, delta) => {
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((item) => {
          if (item.uniqueKey !== uniqueKey) return item;
          const newQuantity = Math.max(0, (item.quantity || 0) + delta);
          return {
            ...item,
            quantity: newQuantity,
            isCancelled: newQuantity === 0,
          };
        }),
      }))
    );
  };

  // ✅ Apply updates to backend correctly
  const doneEdit = async (orderId) => {
    try {
      const order = orders.find((o) => o.orderId === orderId);
      const originalOrder = originalOrders.find((o) => o.orderId === orderId);

      if (!order || !originalOrder) return;

      for (const item of order.items) {
  // ✅ Loop through all underlying original items if merged
  const originals = item.originalItems || [item];

  for (const orig of originals) {
    const currentQty = Math.ceil(item.quantity / originals.length);
    const originalQty = parseInt(orig.quantity || 0, 10);

    if (currentQty === originalQty) continue;

    if (currentQty === 0) {
      await cancelOrderItem({
        orderId: orig.parentOrderId,
        itemId: orig.itemId,
        cancel: true,
      });
    } else {
      await updateOrderItem({
        orderId: orig.parentOrderId,
        itemId: orig.itemId,
        newQuantity: currentQty,
      });
    }
  }
}


      setOriginalOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? structuredClone(order) : o))
      );
      setEditingOrders((prev) => ({ ...prev, [orderId]: false }));
      toast.success("Items Updated ✅");
    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error(err.message || "Failed to save changes ❌");
    }
  };

  const cancelEdit = (orderId) => {
    const original = originalOrders.find((o) => o.orderId === orderId);
    if (!original) return;
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId ? structuredClone(original) : order
      )
    );
    setEditingOrders((prev) => ({ ...prev, [orderId]: false }));
  };

  const toggleEdit = (orderId) => {
    if (!editingOrders[orderId]) {
      const currentOrder = orders.find((o) => o.orderId === orderId);
      const exists = originalOrders.some((o) => o.orderId === orderId);
      if (!exists && currentOrder) {
        setOriginalOrders((prev) => [...prev, structuredClone(currentOrder)]);
      }
    }
    setEditingOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
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
    <Container fluid className="p-lg-3">
      <h4 className="my-3">Orders</h4>
      <div className="row">
        {[...orders]
          .sort((a, b) => {
            const aStatus = (a.status || "").toLowerCase();
            const bStatus = (b.status || "").toLowerCase();

            const orderPriority = (status) => {
              if (status === "ready") return 2;
              if (status === "completed") return 3;
              return 1; // pending/new/default
            };

            const statusDiff = orderPriority(aStatus) - orderPriority(bStatus);
            if (statusDiff !== 0) return statusDiff;

            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
          })
          .map((order, idx) => {
            const isExpanded = expandedOrders[order.orderId] || false;
            const isEditing = editingOrders[order.orderId] || false;
            const items = order.items || [];
            const visibleItems = isExpanded ? items : items.slice(0, 3);
            const hiddenCount = items.length - 3;

            const total = items
              .filter((it) => !it.isCancelled)
              .reduce(
                (sum, it) =>
                  sum + (it.Price || it.price || 0) * (it.quantity || 0),
                0
              );

            const isReady = order.status?.toLowerCase() === "ready";

            return (
              <div
                key={order.orderId || idx}
                className="col-12 col-sm-6 col-lg-3 mb-4"
              >
                <div
                  className={`border rounded shadow-sm p-3 h-100 d-flex flex-column justify-content-between position-relative ${
                    isReady
                      ? "bg-success bg-opacity-10"
                      : order.status?.toLowerCase() === "completed"
                      ? "bg-primary bg-opacity-10"
                      : "bg-white"
                  }`}
                  style={{ minHeight: "350px" }}
                >
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <strong className="fs-6">
                        {order.tableNumber
                          ? `Table ${order.tableNumber}`
                          : order.customerName || "Takeaway"}
                      </strong>
                      <div className="text-dark fw-medium small">
                        Order ID: #{order.orderId}
                      </div>
                    </div>

                    {!isEditing && (
                      <Badge
                        bg={isReady ? "success" : "danger"}
                        className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded-pill"
                      >
                        {order.status || "New"}
                      </Badge>
                    )}
                  </div>

                  {/* Items */}
                  <div
                    className="mb-2 flex-grow-1 overflow-auto"
                    style={{ maxHeight: "220px" }}
                  >
                    {visibleItems.map((item, i) => {
                      const isCancelled = item.isCancelled;
                      const lineStyle = isCancelled
                        ? { textDecoration: "line-through", color: "#999" }
                        : {};

                      return (
                        <div
                          key={item.uniqueKey}
                          className="d-flex justify-content-between align-items-start small mb-2"
                        >
                          <div className="w-100">
                            <div
                              className="fw-semibold d-flex justify-content-between"
                              style={lineStyle}
                            >
                              {item.quantity}x {item.name || item.menuItem}
                              <span className="text-success fw-bold pe-2">
                                ₹
                                {(
                                  (item.Price || item.price || 0) *
                                  item.quantity
                                ).toFixed(2)}
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                              <span
                                className={`badge bg-${
                                  item.foodType === "Jain"
                                    ? "success"
                                    : "primary"
                                } mt-1`}
                              >
                                {item.foodType}
                              </span>
                              {item.specialInstructions && (
                                <div className="text-dark fw-medium small fst-italic mt-1 text-break">
                                  "{item.specialInstructions}"
                                </div>
                              )}
                              {isCancelled && (
                                <span className="badge bg-warning text-dark">
                                  Cancelled
                                </span>
                              )}
                            </div>

                            {!isCancelled && isEditing && !isReady && (
                              <div className="d-flex align-items-center gap-2 mt-2">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(item.uniqueKey, -1)
                                  }
                                >
                                  −
                                </Button>
                                <span>{item.quantity}</span>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(item.uniqueKey, 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Expand / Collapse */}
                    {!isExpanded && hiddenCount > 0 && (
                      <div
                        className="text-primary small fw-semibold mt-1"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedOrders((prev) => ({
                            ...prev,
                            [order.orderId]: true,
                          }))
                        }
                      >
                        +{hiddenCount} more items
                      </div>
                    )}
                    {isExpanded && items.length > 3 && (
                      <div
                        className="text-primary small fw-semibold mt-1"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedOrders((prev) => ({
                            ...prev,
                            [order.orderId]: false,
                          }))
                        }
                      >
                        Show less
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total:</span>
                      <span className="text-success">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-dark fw-medium small mt-4">
                      Ordered:{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString()
                        : "Unknown time"}
                    </div>
                  </div>

                  {/* Edit / Done / Cancel Buttons */}
                  {!isReady && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "15px",
                        right: "15px",
                        display: "flex",
                        gap: "0.5rem",
                      }}
                    >
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => toggleEdit(order.orderId)}
                        >
                          Edit
                        </Button>
                      )}
                      {isEditing && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => doneEdit(order.orderId)}
                          >
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => cancelEdit(order.orderId)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </Container>
  );
};

export default OrderCard;
