import React, { useEffect, useState } from "react";
import { FiUsers, FiTrash2, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { fetchTables, createTable, deleteTable } from "../config/api";
import BootstrapModal from "./BootstrapModal"; // adjust the path if needed
import { toast } from "react-toastify";

// Modal Component
function Modal({ table, onClose, onAction }) {
  return (
    <div className="modal" style={{ display: "block" }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h4>Table {table.number} Actions</h4>
        <button onClick={() => onAction("viewKots")}>View Kot(s)</button>
        <button onClick={() => onAction("moveTable")}>Move Table</button>
        <button onClick={() => onAction("printBill")}>Print Bill</button>
        <button onClick={() => onAction("printBillAndTakePayment")}>Print Bill & Take Payment</button>
        <button onClick={() => onAction("getPin")}>Get Pin</button>
      </div>
    </div>
  );
}

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [highlightedTable, setHighlightedTable] = useState(null);
  const [longPressTable, setLongPressTable] = useState(null); // Store table for long press
  const [showModal, setShowModal] = useState(false); // Control modal visibility
  const navigate = useNavigate();

  // Fetch tables on mount
  useEffect(() => {
    const loadTables = async () => {
      try {
        const data = await fetchTables();
        setTables(data);
      } catch (error) {
        console.error("⚠️ Failed to load tables:", error);
        toast.error("⚠️ Failed to load tables. Please try again.");
      }
    };
    loadTables();
  }, []);

  const handleTableClick = (table) => {
    if (table.status === "Occupied" && highlightedTable?._id !== table._id) {
      setHighlightedTable(table);
    } else if (table.status !== "Occupied") {
      setHighlightedTable(null);
    }

    if (table.status === "Open") {
      navigate(`/admin/adminmenu/${table._id}`);
      return;
    }

    const updatedTables = tables.map((t) => {
      if (t._id === table._id) {
        return { ...t, status: "Open" };
      }
      if (t.status === "Open" && previousStatuses[t._id]) {
        return { ...t, status: previousStatuses[t._id] };
      }
      return t;
    });

    setTables(updatedTables);
    setSelectedTable({ ...table, status: "Open" });

    setPreviousStatuses((prev) => ({
      ...prev,
      [table._id]: table.status,
    }));
  };

  const handleAddTable = async () => {
    try {
      const existingNumbers = tables.map((t) => t.number);
      const nextNumber = Math.max(0, ...existingNumbers) + 1;

      const newTable = await createTable({
        number: nextNumber,
        status: "Available",
      });

      setTables([...tables, newTable]);
      toast.success(`Table ${nextNumber} added successfully.`);
    } catch (error) {
      console.error("⚠️ Error adding table:", error);
      toast.error("⚠️ Error adding table. Please try again.");
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    // 🔒 Prevent deleting occupied or highlighted (yellow) tables
    if (
      selectedTable.status === "Occupied" ||
      (highlightedTable && highlightedTable._id === selectedTable._id)
    ) {
      toast.warn(
        `⚠️ Table ${selectedTable.number} cannot be deleted while it is ${selectedTable.status === "Occupied" ? "occupied" : "highlighted"
        }.`
      );
      return;
    }

    try {
      await deleteTable(selectedTable._id);
      setTables(tables.filter((t) => t._id !== selectedTable._id));
      toast.success(`✅ Table ${selectedTable.number} deleted successfully.`);
      setSelectedTable(null);
    } catch (error) {
      console.error("⚠️ Error deleting table:", error);
      toast.error("⚠️ Error deleting table. Please try again.");
    }
  };

  // Handle long press
  const handleLongPress = (table) => {
    if (table.status === "Occupied") {
      setLongPressTable(table);
      setShowModal(true);
    } else {
      toast.info("Modal is only available for occupied tables.");
    }
  };


  // Handle action in modal
  const handleAction = (action, payload) => {
    console.log(`Action chosen: ${action}`, payload);

    if (action === "moveTableSuccess" && payload?.data) {
      const { from, to } = payload.data;

      // Update the tables state with the updated 'from' and 'to' tables
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table._id === from._id) return from;
          if (table._id === to._id) return to;
          return table;
        })
      );

      // Update selected and highlighted tables in UI
      setSelectedTable(to);
      setHighlightedTable(null);

      setShowModal(false);
    } else {
      // Handle other modal actions here
      setShowModal(false);
    }
  };


  // Handle mouse down and up for long press detection
  const handleMouseDown = (table) => {
    const timer = setTimeout(() => {
      handleLongPress(table);
    }, 1000); // 1000ms for long press

    // Clear timeout if mouse is released before the long press
    const handleMouseUp = () => clearTimeout(timer);

    // Attach mouse up event listener to the table div
    const tableElement = document.getElementById(`table-${table._id}`);
    tableElement.addEventListener("mouseup", handleMouseUp, { once: true });
  };

<<<<<<< HEAD
  let pressTimer = null;

  const handlePressStart = (e, table) => {
    e.preventDefault();
    pressTimer = setTimeout(() => {
      handleLongPress(table);
    }, 800); // 800ms for long press
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer);
  };

=======
>>>>>>> e8eb220922cf96643536322784f0f5391294d0e3
  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3">
          <h3 className="fw-bold mb-0">Table Management</h3>
          <p className="text-dark fw-medium mb-0">Select table to take order</p>
        </div>

        {/* Right side buttons */}
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button
            className="btn btn-outline-primary rounded-pill d-flex align-items-center px-3 py-1"
            onClick={handleAddTable}
          >
            <FiPlus className="me-2" size={16} /> Add Table
          </button>

          <button
            className="btn btn-outline-danger rounded-pill d-flex align-items-center px-3 py-1"
            onClick={handleDeleteTable}
            disabled={!selectedTable}
          >
            <FiTrash2 className="me-2" size={16} /> Delete Table
          </button>
        </div>
      </div>

      {/* Continue order badge */}
      {selectedTable && (
        <div className="text-end mb-4">
          <span className="badge bg-success bg-opacity-25 text-success fs-6 px-3 py-2 rounded-pill">
            🍴 Continue Order - Table {selectedTable.number}
          </span>
        </div>
      )}

      {/* Table Grid */}
      <div className="row g-4">
        {tables.map((table) => {
          const isHighlighted = highlightedTable?._id === table._id;
          return (
            <div
              key={table._id}
              id={`table-${table._id}`} // Add an ID for long press detection
              className="col-6 col-sm-4 col-md-3"
              onClick={() => handleTableClick(table)}
<<<<<<< HEAD
              onMouseDown={(e) => handlePressStart(e, table)}
              onTouchStart={(e) => handlePressStart(e, table)}
              onMouseUp={handlePressEnd}
              onTouchEnd={handlePressEnd}
              onMouseLeave={handlePressEnd}

              style={{ cursor: "pointer" }}
            >
              <div
                className={`text-center p-3 rounded shadow-sm noselect ${table.status === "Open"
                    ? "bg-success bg-opacity-10 border border-success"
                    : table.status === "Occupied"
                      ? "bg-danger bg-opacity-10 border border-danger"
                      : "bg-white"
=======
              onMouseDown={() => handleMouseDown(table)} // Detect mouse down for long press
              style={{ cursor: "pointer" }}
            >
              <div
                className={`text-center p-3 rounded shadow-sm ${table.status === "Open"
                  ? "bg-success bg-opacity-10 border border-success"
                  : table.status === "Occupied"
                    ? "bg-danger bg-opacity-10 border border-danger"
                    : "bg-white"
>>>>>>> e8eb220922cf96643536322784f0f5391294d0e3
                  } ${isHighlighted ? "bg-warning bg-opacity-40" : ""}`}
              >
                <div
                  className={`fs-2 ${table.status === "Open"
                    ? "text-success"
                    : table.status === "Occupied"
                      ? "text-danger"
                      : "text-dark fw-medium"
                    }`}
                >
                  <FiUsers />
                </div>
                <div className="fw-bold">Table {table.number}</div>
                <div
                  className={`badge mt-1 ${table.status === "Open"
                    ? "bg-success text-white"
                    : table.status === "Occupied"
                      ? "bg-danger text-white"
                      : "bg-light text-dark fw-medium"
                    }`}
                >
                  {table.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show modal for long press action */}
      {showModal && (
        <BootstrapModal
          table={longPressTable}
          onClose={() => setShowModal(false)}
          onAction={handleAction}
        />
      )}

    </div>
  );
}

export default TableManagement;
