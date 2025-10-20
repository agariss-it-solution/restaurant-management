import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import { fetchCategories, submitOrder, payBill } from "../config/api";

import { toast } from "react-toastify";
import "../../App.css";

function TakeawayMenu() {
    const navigate = useNavigate();
    const [category, setCategory] = useState("");
    const [menuData, setMenuData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [order, setOrder] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showOrderList, setShowOrderList] = useState(false);

    const [foodType, setFoodType] = useState("Regular");
    const [instructions, setInstructions] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [customerName, setCustomerName] = useState("");

    const currentCategory = menuData.find((cat) => cat.category === category);
    const menuItemsRef = useRef(null);

    useEffect(() => {
        const loadMenu = async () => {
            try {
                const menu = await fetchCategories();
                setMenuData(menu);
                if (menu.length > 0) setCategory(menu[0].category);
            } catch (err) {
                console.error("Error loading menu:", err);
                toast.error("Failed to load menu items");
            } finally {
                setLoading(false);
            }
        };
        loadMenu();
    }, []);

    const handleCategoryClick = (cat) => {
        setCategory(cat.category);
        setSearchTerm("");
        setTimeout(() => {
            menuItemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    const handleAddItem = (item) => {
        setSelectedItem(item);
        setFoodType("Regular");
        setInstructions("");
        setShowModal(true);
    };

    const handleConfirmAdd = () => {
        if (!selectedItem) return;
        setOrder((prev) => {
            const index = prev.findIndex((o) => o._id === selectedItem._id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    qty: updated[index].qty + 1,
                    foodType,
                    instructions,
                };
                return updated;
            } else {
                return [...prev, { ...selectedItem, qty: 1, foodType, instructions }];
            }
        });
        setShowModal(false);
    };

    const handleQuantityChange = (itemId, delta) => {
        setOrder((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((o) => o._id === itemId);
            if (index !== -1) {
                const newQty = updated[index].qty + delta;
                if (newQty <= 0) {
                    updated.splice(index, 1);
                } else {
                    updated[index].qty = newQty;
                }
            }
            return updated;
        });
    };

    // Helper to get total bill
    const getTotal = () => {
        return order.reduce((sum, item) => sum + item.Price * item.qty, 0);
    };

 const handleSubmitOrder = async () => {
    if (order.length === 0) return toast.error("No items in order");
    if (!customerName.trim()) return toast.error("Please enter customer name");

    const orderData = {
        orderType: "Takeaway",
        customerName: customerName.trim(),
        tableNumber: "Takeaway",
        items: order.map((item) => ({
            itemId: item._id,
            quantity: item.qty,
            specialInstructions: item.instructions || "",
            foodType: item.foodType || "Regular",
        })),
    };

    try {
        await submitOrder(orderData);
        toast.success("Takeaway order submitted successfully!");

        // Reset order data
        setOrder([]);
        setCustomerName("");

        // ✅ Small delay ensures toast is visible before redirect
        setTimeout(() => {
            navigate("/admin/dashboard");
        });

    } catch (err) {
        console.error("Error submitting order:", err);
        toast.error(err.message || "Failed to submit order");
    }
};



    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="success" />
            </div>
        );
    }

    const filteredItems = searchTerm
        ? menuData.flatMap((cat) => cat.items || []).filter((item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : currentCategory?.items || [];

    return (
        <div className="py-2">
            {/* Sticky Customer Name - Desktop */}
            <div className="d-none d-lg-block sticky-top bg-white px-3 py-2 mb-2 border-bottom shadow-sm" style={{ top: "0", zIndex: 100 }}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter Customer Name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
            </div>

            {/* Sticky Customer Name - Mobile */}
            <div className="d-lg-none sticky-top bg-white px-2 py-1 mb-1 border-bottom shadow-sm" style={{ top: "0", zIndex: 100 }}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter Customer Name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
            </div>

            <div className="row">
                {/* LEFT: Menu */}
                <div className="col-lg-9" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                    <h4 className="fw-bold pt-2">Takeaway Orders</h4>
                    <p className="text-dark fw-medium mb-3">
                        Select items to add to this takeaway order
                    </p>

                    {/* Categories */}
                    <div className="row g-2 mb-3">
                        {menuData.map((cat) => (
                            <div key={cat._id} className="col-3 col-md-4 col-lg-2">
                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`d-flex flex-column align-items-center p-3 h-100 ${currentCategory?.category === cat.category
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

                    {/* Search */}
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
                    <div ref={menuItemsRef} className="row g-3 p-3">
                        {filteredItems.length === 0 && <p>No items available</p>}
                        {filteredItems.map((item) => {
                            const orderItem = order.find((o) => o._id === item._id) || { qty: 0 };
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
                                                                onClick={() => handleQuantityChange(item._id, -1)}
                                                            >
                                                                −
                                                            </button>
                                                            <span className="fw-bold">{orderItem.qty}</span>
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm py-0 px-2"
                                                                onClick={() => handleQuantityChange(item._id, 1)}
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

                {/* Order Summary */}
                {order.length > 0 && (
                    <>
                        {/* Desktop Sidebar */}
                        <div className="d-none d-lg-flex flex-column bg-white border rounded shadow-sm p-3"
                            style={{
                                position: "sticky",
                                top: "20px",
                                right: "20px",
                                width: "380px",
                                maxHeight: "80vh"
                            }}>
                            <h5 className="fw-bold mb-3">🧾 Current Order</h5>

                            {/* Scrollable List */}
                            <div className="flex-grow-1 overflow-auto mb-3" style={{ maxHeight: "calc(80vh - 140px)" }}>
                                {order.map((item, idx) => (
                                    <div key={idx} className="border rounded p-2 mb-2 small bg-light">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">{item.name}</div>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className={`badge bg-${item.foodType === "Jain" ? "success" : "primary"}`}>
                                                        {item.foodType}
                                                    </span>
                                                    {item.instructions && (
                                                        <small className="text-muted fst-italic">"{item.instructions}"</small>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-success fw-bold">₹{(item.Price * item.qty).toFixed(2)}</div>
                                        </div>

                                        {/* Quantity Controls + Remove */}
                                        <div className="d-flex align-items-center justify-content-between mt-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm px-2 py-0"
                                                    onClick={() => handleQuantityChange(item._id, -1)}
                                                >−</button>
                                                <span>{item.qty}</span>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm px-2 py-0"
                                                    onClick={() => handleQuantityChange(item._id, 1)}
                                                >+</button>
                                            </div>
                                            <button
                                                className="btn btn-link text-danger p-0 small"
                                                onClick={() => setOrder(order.filter((_, i) => i !== idx))}
                                            >
                                                remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="border-top pt-2 mt-auto">
                                <div className="d-flex justify-content-between fw-bold mb-2">
                                    <span>Total:</span>
                                    <span className="text-success">₹{getTotal().toFixed(2)}</span>
                                </div>
                                <button
                                    className="btn btn-success w-100"
                                    disabled={order.length === 0 || !customerName.trim()}
                                    onClick={handleSubmitOrder}
                                >
                                    Send to Kitchen
                                </button>
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="d-lg-none w-100">
                            {/* Bottom Bar */}
                            <div
                                className="fixed-bottom bg-white border-top p-3 d-flex justify-content-between align-items-center shadow-sm"
                                style={{ zIndex: 1060 }}
                                onClick={() => setShowOrderList((prev) => !prev)}
                            >
                                <div className="fw-bold">Total: ₹{getTotal().toFixed(2)}</div>
                                <button
                                    className="btn btn-success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubmitOrder();
                                        setShowOrderList(false);
                                    }}
                                >
                                    Send to Kitchen
                                </button>
                            </div>

                            {/* Slide-Up Drawer */}
                            <div
                                className="bg-white border-top position-fixed start-0 end-0 shadow-lg transition-all"
                                style={{
                                    bottom: showOrderList ? "70px" : "-100%",
                                    maxHeight: "35vh",
                                    overflowY: "auto",
                                    zIndex: 1050,
                                    padding: "15px",
                                    transition: "bottom 0.3s ease-in-out",
                                    borderTopLeftRadius: "12px",
                                    borderTopRightRadius: "12px",
                                }}
                            >
                                <h6 className="fw-semibold text-center border-bottom pb-2 mb-3">Current Order</h6>
                                {order.map((item, idx) => (
                                    <div key={idx} className="border rounded p-2 mb-2 small bg-light">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">{item.name}</div>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className={`badge bg-${item.foodType === "Jain" ? "success" : "primary"}`}>
                                                        {item.foodType}
                                                    </span>
                                                    {item.instructions && (
                                                        <small className="text-muted fst-italic">"{item.instructions}"</small>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-success fw-bold">₹{(item.Price * item.qty).toFixed(2)}</div>
                                        </div>

                                        <div className="d-flex align-items-center justify-content-between mt-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm px-2 py-0"
                                                    onClick={() => handleQuantityChange(item._id, -1)}
                                                >−</button>
                                                <span>{item.qty}</span>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm px-2 py-0"
                                                    onClick={() => handleQuantityChange(item._id, 1)}
                                                >+</button>
                                            </div>
                                            <button
                                                className="btn btn-link text-danger p-0 small"
                                                onClick={() => setOrder(order.filter((_, i) => i !== idx))}
                                            >
                                                remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Item Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
                <Modal.Header closeButton>
                    <Modal.Title>Add to Order: {selectedItem?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label><strong>Food Type</strong></Form.Label>
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
                            <Form.Label><strong>Special Instructions</strong></Form.Label>
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
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handleConfirmAdd}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default TakeawayMenu;