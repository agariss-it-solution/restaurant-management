import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiCreditCard, FiPrinter } from "react-icons/fi";
import { getAllBills,fetchSettings, payBill, getAnalytics } from "../config/api";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import QRScannerModal from "./QRScannerModal";

function BillingRevenue() {
  const [bills, setBills] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [scanningBillId, setScanningBillId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [selectedBillId, setSelectedBillId] = useState(null);

  const [data, setData] = useState({
    todayRevenue: "0.00",
    avgOrderValue: "0.00",
    ordersToday: 0,
    completedOrders: 0,
    paymentTotals: { cash: 0, online: 0, other: 0, total: 0 },
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAnalytics();
        if (result && result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch revenue summary", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadBills = async () => {
      try {
        const response = await getAllBills();
        const billList = Array.isArray(response) ? response : response.data || [];
        setBills(billList);
      } catch (err) {
        console.error("Failed to load bills:", err);
      }
    };
    loadBills();
  }, []);

  const handlePay = async (billId, type) => {
    try {
      const paymentMethod = type.toLowerCase();
      const updatedBill = await payBill(billId, paymentMethod);
      setBills((prevBills) =>
        prevBills.map((bill) =>
          bill._id === billId ? { ...bill, status: updatedBill.status } : bill
        )
      );
      setShowScanner(false);
      setScanningBillId(null);
    } catch (err) {
      console.error(err);
    }
   
  };

const handlePrint = async (billId) => {
  const billElement = document.getElementById(`bill-${billId}`);
  if (!billElement) return;

  // Fetch restaurant settings
  let settings = {
    restaurantName: "MK's Food",
    address: "123 Main Street, City",
    phoneNumber: "9876543210",
    logo: ""
  };

  try {
    const response = await fetchSettings();
    settings.restaurantName = response.restaurantName || settings.restaurantName;
    settings.address = response.address || settings.address;
    settings.phoneNumber = response.phoneNumber || settings.phoneNumber;

    if (response.logo) {
      const logoResp = await fetch(response.logo);
      const blob = await logoResp.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      settings.logo = await new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result);
      });
    }
  } catch (err) {
    console.error("Failed to fetch settings:", err);
  }

  // Clone bill content and clean it
  const clonedBill = billElement.cloneNode(true);
  clonedBill.querySelectorAll(
    "button, .no-print, .print-hide, .order-id, .status, .total-row, small, badge"
  ).forEach(el => el.remove());

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "bill-print-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "#fff",
    overflowY: "auto",
    zIndex: "9999",
    padding: "10px",
    fontFamily: "'Courier New', monospace",
  });

  // Prepare overlay HTML
  overlay.innerHTML = `
    <style>
      @media print {
        body * {
          visibility: hidden !important;
        }
        #bill-print-overlay, #bill-print-overlay * {
          visibility: visible !important;
        }
        #bill-print-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: white !important;
        }
      }
      .receipt-container {
        width: 80mm;
        max-width: 100%;
        margin: auto;
        font-size: 12px;
      }
      .receipt-header img {
        width: 80px;
        height: auto;
        margin-bottom: 5px;
      }
      .receipt-header h2 {
        margin: 5px 0;
        font-size: 18px;
      }
      .receipt-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .receipt-table th, .receipt-table td {
        padding: 4px;
        border-bottom: 1px dashed #000;
        text-align: left;
      }
      .receipt-footer {
        margin-top: 15px;
        text-align: center;
      }
      hr {
        border: none;
        border-top: 1px dashed #000;
        margin: 10px 0;
      }
    </style>

    <div class="receipt-container">
      <div class="receipt-header" style="text-align:center;">
        ${settings.logo ? `<img src="${settings.logo}" alt="Logo">` : ""}
        <h2>${settings.restaurantName}</h2>
        <div><small>${settings.address}</small></div>
        <div><small>Phone: ${settings.phoneNumber}</small></div>
        <hr>
      </div>

      <div class="receipt-body">
        ${clonedBill.innerHTML}
      </div>

      <hr>
      <div class="receipt-footer">
        Thank you for visiting!<br>
        Please come again.
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wait for images to load (especially logo) before printing
  const images = overlay.querySelectorAll("img");
  let imagesLoaded = 0;

  if (images.length === 0) {
    triggerPrint();
  } else {
    images.forEach(img => {
      img.onload = img.onerror = () => {
        imagesLoaded++;
        if (imagesLoaded === images.length) {
          triggerPrint();
        }
      };
    });

    // Fallback if image loading takes too long
    setTimeout(() => {
      if (imagesLoaded < images.length) {
        console.warn("Images took too long to load. Proceeding with print.");
        triggerPrint();
      }
    }, 3000);
  }

  function triggerPrint() {
    const bodyChildren = [...document.body.children].filter(c => c !== overlay);
    bodyChildren.forEach(c => (c.style.display = "none"));

    window.print();

    // Restore and clean up after print
    bodyChildren.forEach(c => (c.style.display = ""));
    overlay.remove();
  }
};






  const toggleExpand = (oi) => {
    setExpandedOrders((prev) => ({ ...prev, [oi]: !prev[oi] }));
  };

  const openConfirm = (billId, type) => {
    setSelectedBillId(billId);
    setPaymentType(type);
    setShowConfirm(true);
  };

  const confirmPay = () => {
    if (!selectedBillId) return;

    if (paymentType === "Cash") {
      handlePay(selectedBillId, "Cash");
    } else if (paymentType === "Online") {
      setShowScanner(true);
      setScanningBillId(selectedBillId);
    }

    setShowConfirm(false);
    setSelectedBillId(null);
  };

  const summaryItems = [
    { label: "Today's Revenue", value: `₹${data.todayRevenue}`, text: "text-success" },
    { label: "Avg Order Value", value: `₹${data.avgOrderValue}`, text: "text-warning" },
    { label: "Orders Today", value: data.ordersToday, text: "text-info" },
    { label: "Completed Orders", value: data.completedOrders, text: "text-secondary" },
  ];

  return (
    <div className="container-fluid p-1">
      {/* Top Navigation */}
<div className="d-flex pt-3 flex-column-reverse flex-md-row justify-content-between align-items-end mb-4 gap-2 ps-2">
  <h3 className="fw-bold text-center text-md-start mb-0">
    Billing & Revenue Management
  </h3>
  <button
    className="btn btn-outline-primary"
    onClick={() => navigate("/admin/order-history")}
  >
   Bill History
  </button>
</div>



      {/* Main Row */}
      <div className="row g-4 mb-4">
        {/* Left: Today's Bills */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-semibold mb-3">Today's Unpaid Bills</h5>

            {bills.filter(b => b.status === "Unpaid" && b.orders?.some(order =>
              order.items?.some(item => !item.isCancelled && item.quantity > 0)
            )).length === 0 ? (
              <p className="text-muted">No unpaid bills</p>
            ) : (
              <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "6px" }}>
                {bills.filter(b => b.status === "Unpaid" && b.orders?.some(order =>
                  order.items?.some(item => !item.isCancelled && item.quantity > 0)
                )).map(bill => {
                  const billTotal = bill.orders?.reduce((sum, order) =>
                    sum + order.items?.reduce((osum, item) => {
                      if (item.isCancelled || item.quantity === 0) return osum;
                      return osum + item.Price * item.quantity;
                    }, 0), 0
                  );
                  if (billTotal === 0) return null;

                  return (
                    <div key={bill._id} id={`bill-${bill._id}`} className="mb-4">
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Table {bill.table?.number || "-"}</span>
                        <span className="text-danger">₹{billTotal.toFixed(2)}</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Order #{bill.orderNumber || bill._id}</small>
                        {/* <span className="badge bg-warning">{bill.status}</span> */}
                      </div>


                      <small className="text-muted">{new Date(bill.createdAt).toLocaleTimeString()}</small>
                      <hr />

                      <div>
                        {bill.orders?.map((order, oi) => {
                          const validItems = order.items?.filter(i => !i.isCancelled && i.quantity > 0) || [];
                          if (validItems.length === 0) return null;

                          const isExpanded = expandedOrders[oi] || false;
                          const visibleItems = isExpanded ? validItems : validItems.slice(0, 3);
                          const hiddenCount = validItems.length - visibleItems.length;

                          return (
                            <div key={oi} className="mb-3">
                              {visibleItems.map((item, ii) => (
                                <div key={`${oi}-${ii}`} className="d-flex justify-content-between">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>₹{(item.Price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              {hiddenCount > 0 && (
                                <div
                                  className="text-primary small fw-semibold mt-1"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => toggleExpand(oi)}
                                >
                                  {isExpanded ? "" : `+${hiddenCount} more items`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Buttons - MOBILE FIXED: stack buttons on small screens */}
                      <div className="d-flex flex-column flex-md-row flex-wrap gap-2 mt-3">
                        <button
                          className="btn btn-success flex-fill"
                          onClick={() => openConfirm(bill._id, "Cash")}
                        >
                          <FiCheckCircle className="me-2" /> Pay Cash
                        </button>
                        <button
                          className="btn btn-primary flex-fill"
                          onClick={() => openConfirm(bill._id, "Online")}
                        >
                          <FiCreditCard className="me-2" />Pay Online
                        </button>
                        <button
                          className="btn btn-secondary flex-fill"
                          onClick={() => handlePrint(bill._id)}
                          aria-label="Print Bill"
                        >
                          <FiPrinter className="me-1" /> Print
                        </button>
                      </div>
                      <hr />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Revenue Summary */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-semibold mb-3">Revenue Summary</h5>
              <div className="row g-3">
                {summaryItems.map((item, index) => (
                  <div className="col-6" key={index}>
                    <div className="text-center border rounded py-3 bg-light">
                      <h6 className="text-muted small mb-1">{item.label}</h6>
                      <h5 className={`fw-bold ${item.text}`}>{item.value}</h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h6 className="mb-2">Payment Methods Breakdown</h6>
              <div className="d-flex justify-content-between py-2">
                <span>Cash</span>
                <span>₹{data.paymentTotals.cash}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span>Online</span>
                <span>₹{data.paymentTotals.online}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2"></div>
              <div className="d-flex justify-content-between py-2">
                <span>Total Revenue</span>
                <span>₹{data.paymentTotals.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        centered
        size="md"
        backdrop="static"
        keyboard={false}
        contentClassName="rounded-4 shadow p-3"
      >
        <Modal.Header className="border-0">
          <Modal.Title className="fw-bold text-center w-100">
            Confirm Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>
            Are you sure you want to pay this bill via{" "}
            <span className="fw-semibold">{paymentType}</span>?
          </p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center border-0">
          <Button
            variant="outline-secondary"
            className="px-4 rounded-pill"
            onClick={() => setShowConfirm(false)}
          >
            No
          </Button>
          <Button
            variant="success"
            className="px-4 rounded-pill"
            onClick={confirmPay}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Scanner Modal Component */}
      <QRScannerModal
        showScanner={showScanner}
        setShowScanner={setShowScanner}
        scanningBillId={scanningBillId}
        setScanningBillId={setScanningBillId}
        handlePay={handlePay}
      />
    </div>
  );
}

export default BillingRevenue;
