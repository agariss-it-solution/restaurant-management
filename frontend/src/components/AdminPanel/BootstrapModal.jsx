import React from "react";

function BootstrapModal({ table, onClose, onAction }) {
  const actions = [
    { key: "viewKots", label: "View KOT(s)" },
    { key: "moveTable", label: "Move Table" },
    { key: "printBill", label: "Print Bill" },
    { key: "printBillAndTakePayment", label: "Print Bill & Take Payment" },
    { key: "getPin", label: "Get Pin" },
  ];

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down"
        role="document"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Table No: {table.number}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body d-grid gap-2">
            {actions.map((action) => (
              <button
                key={action.key}
                className="btn btn-outline-secondary text-start"
                onClick={() => {
                  onAction(action.key);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BootstrapModal;
