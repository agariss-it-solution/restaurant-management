// IMPORTS
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import {
  fetchCategories,
  fetchTables,
  updateTable,
  submitOrder,
} from "../config/api";
import { toast } from "react-toastify";
import "../../App.css";

function MenuPage() {
  const navigate = useNavigate();
  const { tableId } = useParams();

  const [category, setCategory] = useState("");
  const [menuData, setMenuData] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  const [order, setOrder] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [foodType, setFoodType] = useState("Regular");
  const [instructions, setInstructions] = useState("");
   const [showOrderList, setShowOrderList] = useState(false)

  // Search term state
  const [searchTerm, setSearchTerm] = useState("");

  const currentCategory = menuData.find((cat) => cat.category === category);
  const menuItemsRef = useRef(null);
  const orderSummaryRef = useRef(null);

  useEffect(() => {
    const loadMenuAndTable = async () => {
      try {
        const [menu, tablesList] = await Promise.all([
          fetchCategories(),
          fetchTables(),
        ]);
        setMenuData(menu);
        setTables(tablesList);

        if (menu.length > 0) setCategory(menu[0].category);

        const tableObj = tablesList.find((t) => t._id === tableId);
        setTableNumber(tableObj ? tableObj.number : tableId);
      } catch (err) {
        console.error("Error loading menu or tables:", err);
        setTableNumber(tableId);
      } finally {
        setLoading(false);
      }
    };
    loadMenuAndTable();
  }, [tableId]);

  const handleCategoryClick = (cat) => {
    setCategory(cat.category);
    setSearchTerm(""); // reset search on category change

    setTimeout(() => {
      if (menuItemsRef.current) {
        menuItemsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 150);
  };

  const handleAddItem = (item) => {
    setSelectedItem(item);
    setFoodType("Regular");
    setInstructions("");
    setShowModal(true);
  };

 const handleConfirmAdd = () => {
  if (selectedItem) {
    setOrder((prev) => {
      const existingIndex = prev.findIndex((item) => item._id === selectedItem._id && item.foodType === foodType && item.instructions === instructions);

      if (existingIndex !== -1) {
        // Item already exists, increase qty
        const updated = [...prev];
        updated[existingIndex].qty += 0;
        return updated;
      } else {
        // New item, add to order
        const newItem = {
          _id: selectedItem._id,
          name: selectedItem.name,
          Price: selectedItem.Price,
          foodType,
          instructions,
          qty: 1,
        };
        return [...prev, newItem];
      }
    });
  }
  setShowModal(false);

  setTimeout(() => {
    if (orderSummaryRef.current) {
      orderSummaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 100);
};


  const handleSubmitOrder = async () => {
    if (order.length === 0) {
      toast.error("No items in order");
      return;
    }

    const orderData = {
      table: tableId,
      items: order.map((item) => ({
        itemId: item._id,
        quantity: item.qty,
        specialInstructions: item.instructions || "",
        foodType: item.foodType || "Regular",
      })),
    };

    try {
      await submitOrder(orderData);
      await updateTable(tableId, { status: "Occupied" });
      toast.success("All items added to order");
      setOrder([]);
      navigate("/waiter/orders");
    } catch (err) {
      console.error("Error submitting order:", err);
      toast.error("Failed to submit order.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  // 🔎 Filtering logic
  let filteredItems = [];
  if (searchTerm.trim()) {
  
    filteredItems = menuData
      .flatMap((cat) => cat.items || [])
      .filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  } else {
    // Only show selected category items
    filteredItems = currentCategory?.items || [];
  }

  return (
    <div className="py-4">
 <div className="row">
        {/* LEFT: Menu Section */}
        <div className="col-lg-9" style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <h4 className="fw-bold">Menu - Table {tableNumber}</h4>
          <p className="text-dark fw-medium mb-3">Select items to add to the order</p>

          {/* Categories */}
          <div className="row g-2 mb-3">
            {menuData.map((cat) => (
              <div key={cat._id} className="col-3 col-md-4 col-lg-2">
                <div
                  onClick={() => handleCategoryClick(cat)}
                  className={`d-flex flex-column align-items-center p-3 h-100 
                    ${currentCategory?.category === cat.category
                      ? "bg-success text-white"
                      : "bg-light text-dark"
                    }`}
                  style={{ cursor: "pointer", borderRadius: "8px" }}
                >
                  {cat.imageUrl && (
                    <img
                      src={cat.imageUrl}
                      alt={cat.category}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "6px",
                      }}
                    />
                  )}
                  <span className="fw-bold small text-center">{cat.category}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search Box */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search items by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Menu Items */}
          <div ref={menuItemsRef} className="row g-3 p-3" style={{ position: "relative" }}>
            {filteredItems.length === 0 && (
              <p className="text-dark fw-medium">No items available</p>
            )}

            {filteredItems.map((item) => {
              const orderItemIndex = order.findIndex((o) => o._id === item._id);
              const orderItem = orderItemIndex !== -1 ? order[orderItemIndex] : { qty: 0 };

              return (
                <div key={item._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{item.name}</h5>

                  <div className="mt-auto d-flex justify-content-between align-items-center w-100">
  <strong className="text-success">₹{item.Price}</strong>

  <div className="d-flex align-items-center gap-2">
    {orderItem.qty > 0 && (
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-secondary btn-sm py-0 px-2"
          onClick={() => {
            const updated = [...order];
            if (updated[orderItemIndex].qty > 1)
              updated[orderItemIndex].qty -= 1;
            else updated.splice(orderItemIndex, 1);
            setOrder(updated);
          }}
        >
          −
        </button>

        <span className="fw-bold">{orderItem.qty}</span>

        <button
          className="btn btn-outline-secondary btn-sm py-0 px-2"
          onClick={() => {
            const updated = [...order];
            updated[orderItemIndex].qty += 1;
            setOrder(updated);
          }}
        >
          +
        </button>
      </div>
    )}

    <Button
      variant="success"
      size="sm"
      onClick={() => handleAddItem(item)}
    >
      + Add
    </Button>
  </div>
</div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Fixed Order Summary */}
        <div className="col-lg-3 d-none d-lg-block">
          {order.length > 0 && (
            <div
              className="order-summary-wrapper p-3 rounded d-flex flex-column"
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                width: "430px",
                maxHeight: "80vh",
                backgroundColor: "white",
                overflow: "hidden",
                border: "1px solid #dee2e6",
                zIndex: 1050,
              }}
            >
              <div
                className="order-summary-content flex-grow-1"
                style={{ overflowY: "auto", maxHeight: "calc(80vh - 80px)" }}
              >
                <h6 className="fw-bold">Current Order</h6>
<ul className="list-group list-group-flush">
  {order.map((item, idx) => (
    <li key={idx} className="list-group-item small border rounded mb-2">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <div className="fw-semibold">{item.name}</div>
          <span
            className={`badge bg-${
              item.foodType === "Jain" ? "success" : "primary"
            } mt-1`}
          >
            {item.foodType}
          </span>
          {item.instructions && (
            <div className="text-dark fw-medium small fst-italic mt-1 text-break">
              "{item.instructions}"
            </div>
          )}
        </div>
        <div className="text-success fw-bold">
          ₹{(item.Price * item.qty).toFixed(2)}
        </div>
      </div>

      {/* Quantity controls and remove aligned on opposite sides */}
      <div className="d-flex align-items-center mt-2 justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary fw-bold btn-sm px-2 py-0"
            onClick={() => {
              const updated = [...order];
              if (updated[idx].qty > 1) updated[idx].qty -= 1;
              else updated.splice(idx, 1);
              setOrder(updated);
            }}
          >
            −
          </button>

          <span>{item.qty}</span>

          <button
            className="btn btn-outline-secondary fw-bold btn-sm px-2 py-0"
            onClick={() => {
              const updated = [...order];
              updated[idx].qty += 1;
              setOrder(updated);
            }}
          >
            +
          </button>
        </div>

        {/* remove button aligned to the right end */}
        <button
          className="btn btn-link text-danger p-0 small"
          onClick={() => setOrder(order.filter((_, i) => i !== idx))}
        >
          remove
        </button>
      </div>
    </li>
  ))}
</ul>


              </div>

              {/* Footer */}
              <div className="mt-3 order-summary-footer">
                <div className="d-flex justify-content-between fw-bold mb-2">
                  <span>Total:</span>
                  <span className="text-success">
                    ₹{order.reduce((sum, item) => sum + item.Price * item.qty, 0).toFixed(2)}
                  </span>
                </div>
                <button className="btn btn-success w-100" onClick={handleSubmitOrder}>
                  Send to Kitchen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Order Summary */}
        {order.length > 0 && (
          <div className="d-lg-none">
            <div
              className="fixed-bottom bg-white p-3 border-top d-flex justify-content-between align-items-center"
              style={{ zIndex: 1060, cursor: "pointer" }}
              onClick={() => setShowOrderList((prev) => !prev)}
            >
              <div className="fw-bold">
                Total: ₹{order.reduce((sum, item) => sum + item.Price * item.qty, 0).toFixed(2)}
              </div>
              <button
                className="btn btn-success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitOrder();
                }}
              >
                Send to Kitchen
              </button>
            </div>

            {showOrderList && (
              <div
                className="d-lg-none bg-white border-top order-list-mobile"
                style={{
                  position: "fixed",
                  bottom: "70px",
                  left: 0,
                  right: 0,
                  maxHeight: "35vh",
                  overflowY: "auto",
                  zIndex: 1050,
                  padding: "10px 15px",
                }}
              >
                <h6 className="fw-semibold text-center py-2">Current Order</h6>
               {order.map((item, idx) => (
  <div
    key={idx}
    className="d-flex justify-content-between align-items-start mb-3 p-2 border rounded"
  >
    <div className="flex-grow-1">
      <div className="fw-semibold">{item.name}</div>
      <div className="d-flex align-items-center gap-2 mt-1">
        <span className={`badge bg-${item.foodType === "Jain" ? "success" : "primary"}`}>
          {item.foodType}
        </span>
        {item.instructions && (
          <small className="text-dark fst-italic">"{item.instructions}"</small>
        )}
      </div>
      <div className="mt-1 d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-secondary btn-sm px-2 py-0"
          onClick={() => {
            const updated = [...order];
            if (updated[idx].qty > 1) updated[idx].qty -= 1;
            else updated.splice(idx, 1);
            setOrder(updated);
          }}
        >
          −
        </button>
        <span>{item.qty}</span>
        <button
          className="btn btn-outline-secondary btn-sm px-2 py-0"
          onClick={() => {
            const updated = [...order];
            updated[idx].qty += 1;
            setOrder(updated);
          }}
        >
          +
        </button>
      </div>
    </div>

    {/* Updated right side: price and remove */}
    <div className="text-end ms-2 d-flex flex-column align-items-end justify-content-between">
      <div className="text-success fw-bold">
        ₹{(item.Price * item.qty).toFixed(2)}
      </div>
      <button
        className="btn btn-link text-danger p-0 small mt-1"
        onClick={() => setOrder(order.filter((_, i) => i !== idx))}
      >
        remove
      </button>
    </div>
  </div>
))}
    
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Add to Order: {selectedItem?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>
                <strong>Food Type</strong>
              </Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Regular"
                  name="foodType"
                  checked={foodType === "Regular"}
                  onChange={() => setFoodType("Regular")}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Jain"
                  name="foodType"
                  checked={foodType === "Jain"}
                  onChange={() => setFoodType("Jain")}
                />
              </div>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>
                <strong>Special Instructions</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. No onions, extra cheese"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConfirmAdd}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Extra CSS for desktop to reset fixed styles */}
      <style>{`
        @media (min-width: 992px) {
          .order-summary-wrapper {
            position: static !important;
            max-height: none !important;
            overflow-y: visible !important;
            border-top: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MenuPage;
