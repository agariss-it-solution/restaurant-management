import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // <-- Import useNavigate
import {
  moveTable,
  fetchAvailableTables,
  fetchOrders,
} from "../config/api";
import KOTModal from "./Kotmodel";

function BootstrapModal({ table, onClose, onAction }) {
  const navigate = useNavigate();  // <-- Initialize navigate

  const [moveMode, setMoveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [kots, setKots] = useState([]);
  const [kotError, setKotError] = useState(null);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [showMainModal, setShowMainModal] = useState(true);

  const actions = [
    { key: "viewKots", label: "View KOT(s)" },
    { key: "moveTable", label: "Move Table" },
    { key: "printBillAndTakePayment", label: "Print Bill & Take Payment" },
  ];

  useEffect(() => {
    if (moveMode) {
      setFetchingTables(true);
      setFetchError(null);
      fetchAvailableTables()
        .then((tables) => {
          const filtered = tables.filter((t) => t._id !== table._id);
          setAvailableTables(filtered);
        })
        .catch((err) =>
          setFetchError(err.message || "Failed to fetch available tables")
        )
        .finally(() => setFetchingTables(false));
    }
  }, [moveMode, table._id]);

  const handleViewKots = async () => {
    setKotError(null);
    try {
      const result = await fetchOrders(table._id);
      setKots(result.data || []);
      setShowMainModal(false);
      setShowKOTModal(true);
    } catch (err) {
      setKotError(err.message || "Failed to fetch KOT(s)");
    }
  };

  const handleMoveTable = async (newTableId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await moveTable(table._id, newTableId);
      onAction("moveTableSuccess", result);
      setMoveMode(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to move table");
    } finally {
      setLoading(false);
    }
  };

  // New handler for Print Bill & Take Payment button
const handlePrintBillAndTakePayment = () => {
  if (!table || (!table._id && !table.id)) {
    console.error("Table ID is missing.");
    return;
  }
  const tableId = table._id || table.id;
  onClose();
  navigate(`/admin/billing/${tableId}`);
};


  return (
    <>
      {showMainModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            overflowY: "auto",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
          >
            <div className="modal-content">
              {/* Modal Header */}
              <div className="modal-header">
                <h5 className="modal-title">Table No: {table.number}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <div
                className="modal-body d-grid gap-2"
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Move Table Mode */}
                {moveMode ? (
                  <>
                    <h6 className="fw-bold">Select a table to move to:</h6>
                    {fetchingTables ? (
                      <div>Loading tables...</div>
                    ) : fetchError ? (
                      <div className="text-danger">{fetchError}</div>
                    ) : availableTables.length === 0 ? (
                      <div className="text-muted">No available tables.</div>
                    ) : (
                      availableTables.map((availableTable) => (
                        <button
                          key={availableTable._id}
                          className="btn btn-outline-primary text-start"
                          onClick={() => handleMoveTable(availableTable._id)}
                          disabled={loading}
                        >
                          {loading ? "Moving..." : `Table ${availableTable.number}`}
                        </button>
                      ))
                    )}

                    <button
                      className="btn btn-secondary mt-2"
                      onClick={() => setMoveMode(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  // Normal Action Buttons
                  actions.map((action) => (
                    <button
                      key={action.key}
                      className="btn btn-outline-secondary text-start"
                      onClick={() => {
                        if (action.key === "moveTable") {
                          setMoveMode(true);
                          setError(null);
                        } else if (action.key === "viewKots") {
                          handleViewKots();
                        } else if (action.key === "printBillAndTakePayment") {
                          handlePrintBillAndTakePayment(); // Redirect here
                        } else {
                          onAction(action.key);
                          onClose();
                        }
                      }}
                      disabled={loading}
                    >
                      {action.label}
                    </button>
                  ))
                )}

                {/* KOT Error */}
                {kotError && (
                  <div className="alert alert-danger mt-2">{kotError}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KOT Modal */}
      {showKOTModal && (
        <KOTModal
          kots={kots}
          table={table}
          onClose={() => {
            setShowKOTModal(false);
            setShowMainModal(true);
          }}
        />
      )}
    </>
  );
}

export default BootstrapModal;
