import React from "react";
<<<<<<< HEAD
import { fetchOrders, updateOrderItem, cancelOrderItem } from "../config/api";
=======

>>>>>>> e8eb220922cf96643536322784f0f5391294d0e3
// Utility to group items by name and sum quantities
const groupItems = (kots) => {
  const grouped = {};

  kots.forEach((kot) => {
    kot.items.forEach((item) => {
      const key = item.name;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
        };
      } else {
        grouped[key].quantity += item.quantity;
        // If multiple special instructions exist, combine them (optional)
        if (item.specialInstructions) {
          grouped[key].specialInstructions += ` | ${item.specialInstructions}`;
        }
      }
    });
  });

  return Object.values(grouped);
};

function KOTModal({ kots, onClose, table }) {
  const combinedItems = groupItems(kots);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">KOT(s) for Table {table.number}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {combinedItems.length === 0 ? (
              <div className="text-muted">No KOT items found.</div>
            ) : (
              <ul className="list-group">
                {combinedItems.map((item, index) => (
                  <li key={index} className="list-group-item">
                    • <strong>{item.name}</strong> × {item.quantity}
                    {item.specialInstructions && (
<<<<<<< HEAD
                      <div className="text-muted small mt-1">
                        <strong>Note:</strong> {item.specialInstructions}
=======
                      <div className="text-muted small">
                        Note: {item.specialInstructions}
>>>>>>> e8eb220922cf96643536322784f0f5391294d0e3
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KOTModal;
