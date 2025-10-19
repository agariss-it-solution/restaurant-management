// KOT model code

import React, { useState, useEffect } from "react";
import { Badge, Button } from "react-bootstrap";
import { updateOrderItem, cancelOrderItem } from "../config/api";
import { toast } from "react-toastify";

// Utility to group items by name and sum quantities
const groupItems = (orders) => {
  const grouped = {};

  // Handle both direct items and nested order.items structure
  orders.forEach((order) => {
    const itemsToProcess = order.items || [];
    
    itemsToProcess.forEach((item) => {
      const key = item.itemId || item._id || item.name;
      if (!grouped[key]) {
        grouped[key] = {
          itemId: item.itemId || item._id || item.name,
          orderId: order.orderId || order._id, // Store orderId for later updates
          name: item.name || item.menuItem,
          quantity: item.quantity,
          Price: item.Price || item.price,
          foodType: item.foodType,
          specialInstructions: item.specialInstructions || "",
          isCancelled: item.isCancelled || false,
        };
      } else {
        grouped[key].quantity += item.quantity;
        if (item.specialInstructions && !grouped[key].specialInstructions.includes(item.specialInstructions)) {
          grouped[key].specialInstructions += ` | ${item.specialInstructions}`;
        }
      }
    });
  });

  return Object.values(grouped);
};

function KOTModal({ kots, onClose, table }) {
  const [combinedItems, setCombinedItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalItems, setOriginalItems] = useState([]);

  useEffect(() => {
    console.log("KOTModal received kots:", kots); // DEBUG
    console.log("KOTModal received table:", table); // DEBUG
    
    const grouped = groupItems(kots);
    console.log("Grouped items:", grouped); // DEBUG
    
    setCombinedItems(grouped);
    setOriginalItems(JSON.parse(JSON.stringify(grouped)));
  }, [kots]);

  const handleQuantityChange = (itemKey, delta) => {
    setCombinedItems((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemKey) return item;
        const newQuantity = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          isCancelled: newQuantity === 0,
        };
      })
    );
  };

  const doneEdit = async () => {
    try {
      for (const item of combinedItems) {
        const originalItem = originalItems.find((i) => i.itemId === item.itemId);

        if (!originalItem) continue;

        const currentQty = parseInt(item.quantity, 10) || 0;
        const originalQty = parseInt(originalItem.quantity, 10) || 0;

        if (currentQty === originalQty && item.isCancelled === originalItem.isCancelled) {
          continue;
        }

        if (currentQty === 0) {
          await cancelOrderItem({ 
            orderId: item.orderId, 
            itemId: item.itemId, 
            cancel: true 
          });
        } else if (currentQty !== originalQty) {
          await updateOrderItem({
            orderId: item.orderId,
            itemId: item.itemId,
            newQuantity: currentQty,
          });
        }
      }

      setOriginalItems(JSON.parse(JSON.stringify(combinedItems)));
      setIsEditing(false);
      toast.success("Items Updated");
    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error(err.message || "Failed to save changes ❌");
    }
  };

  const cancelEdit = () => {
    setCombinedItems(JSON.parse(JSON.stringify(originalItems)));
    setIsEditing(false);
  };

  const totalAmount = combinedItems
    .filter((item) => !item.isCancelled)
    .reduce((sum, item) => sum + (item.Price || 0) * item.quantity, 0);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header p-2">
            <h6 className="modal-title mb-0">
              Table {table?.number || "Unknown"}
            </h6>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={onClose}
              disabled={isEditing}
            ></button>
          </div>

          <div className="modal-body p-2" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {combinedItems.length === 0 ? (
              <div className="text-muted text-center py-2" style={{ fontSize: "0.85rem" }}>
                No items for this table
              </div>
            ) : (
              <div>
                {combinedItems.map((item) => {
                  const isCancelled = item.isCancelled;
                  const lineStyle = isCancelled ? { textDecoration: "line-through", color: "#999" } : {};

                  return (
                    <div key={item.itemId} className="border rounded p-2 mb-2 bg-light">
                      <div className="d-flex justify-content-between align-items-start" style={lineStyle}>
                        <div className="flex-grow-1" style={{ fontSize: "0.85rem" }}>
                          <div className="fw-semibold d-flex justify-content-between gap-1">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-success fw-bold" style={{ whiteSpace: "nowrap" }}>
                              ₹{((item.Price || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {item.foodType && (
                            <span className={`badge bg-${item.foodType === "Jain" ? "success" : "primary"} mt-1`} style={{ fontSize: "0.7rem" }}>
                              {item.foodType}
                            </span>
                          )}

                          {item.specialInstructions && (
                            <div className="text-dark small fst-italic mt-1" style={{ fontSize: "0.75rem" }}>
                              {item.specialInstructions}
                            </div>
                          )}

                          {isCancelled && (
                            <span className="badge bg-warning text-dark mt-1" style={{ fontSize: "0.7rem" }}>
                              Cancelled
                            </span>
                          )}

                          {!isCancelled && isEditing && (
                            <div className="d-flex align-items-center gap-1 mt-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="py-0 px-2"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => handleQuantityChange(item.itemId, -1)}
                              >
                                −
                              </Button>
                              <span style={{ fontSize: "0.85rem", width: "20px", textAlign: "center" }}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="py-0 px-2"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => handleQuantityChange(item.itemId, 1)}
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="border-top pt-2 mt-2">
                  <div className="d-flex justify-content-between fw-bold" style={{ fontSize: "0.9rem" }}>
                    <span>Total:</span>
                    <span className="text-success">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer p-2 gap-1">
            {!isEditing ? (
              <>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={combinedItems.length === 0}
                  style={{ fontSize: "0.8rem" }}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  style={{ fontSize: "0.8rem" }}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={cancelEdit}
                  style={{ fontSize: "0.8rem" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={doneEdit}
                  style={{ fontSize: "0.8rem" }}
                >
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KOTModal;