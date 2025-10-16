import React, { useEffect, useState } from "react";
import { FiUsers, FiTrash2, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { fetchTables, createTable, deleteTable } from "../config/api";

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [highlightedTable, setHighlightedTable] = useState(null); 
  const navigate = useNavigate();

  // Fetch tables on mount
  useEffect(() => {
    const loadTables = async () => {
      try {
        const data = await fetchTables();
        setTables(data);
      } catch (error) {
        console.error("⚠️ Failed to load tables:", error);
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
       navigate(`/menu/${selectedTable._id}`);
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


  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3">
          <h3 className="fw-bold mb-0">Table Management</h3>
          <p className="text-dark fw-medium mb-0">Select table to take order</p>
        </div>

        {/* Right side buttons */}
       
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
            <div key={table._id} className="col-6 col-sm-4 col-md-3">
              <div
                className={`text-center p-3 rounded shadow-sm ${
                  table.status === "Open"
                    ? "bg-success bg-opacity-10 border border-success"
                    : table.status === "Occupied"
                    ? "bg-danger bg-opacity-10 border border-danger"
                    : "bg-white"
                } ${isHighlighted ? "bg-warning bg-opacity-40" : ""}`}
                onClick={() => handleTableClick(table)}
                style={{ cursor: "pointer" }}
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
    </div>
  );
}

export default TableManagement;
