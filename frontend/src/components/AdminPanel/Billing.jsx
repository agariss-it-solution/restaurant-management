import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiCreditCard, FiPrinter } from "react-icons/fi";
import { getAllBills, fetchSettings, payBill, getAnalytics } from "../config/api";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import QRScannerModal from "./QRScannerModal";
import html2pdf from 'html2pdf.js';

function BillingRevenue() {
  const [bills, setBills] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [scanningBillId, setScanningBillId] = useState(null);
  const [selectedBillAmount, setSelectedBillAmount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', online: '' });
  const [splitBillId, setSplitBillId] = useState(null);


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

  const handleSplitPayment = async () => {
    if (!splitBillId) return;

    // console.log("splitAmounts at payment:", splitAmounts);

    const cashAmount = parseFloat(splitAmounts.cash);
    const onlineAmount = parseFloat(splitAmounts.online);

    // console.log("cashAmount:", cashAmount, "onlineAmount:", onlineAmount);

    if (isNaN(cashAmount) || isNaN(onlineAmount)) {
      alert("Please enter valid numbers for split amounts.");
      return;
    }

    const billData = bills.find(b => b._id === splitBillId);
    if (!billData) {
      alert("Bill not found.");
      return;
    }

    const totalBillAmount = billData.orders.reduce((sum, order) =>
      sum + order.items.reduce((osum, item) => {
        if (item.isCancelled || item.quantity === 0) return osum;
        return osum + item.Price * item.quantity;
      }, 0), 0
    );

    if ((cashAmount + onlineAmount).toFixed(2) !== totalBillAmount.toFixed(2)) {
      alert(`Split amounts must add up exactly to total bill ₹${totalBillAmount.toFixed(2)}`);
      return;
    }

    try {
      const payload = {
        paymentMethod: "split",
        paymentAmounts: {
          cash: cashAmount,
          online: onlineAmount,
        },
      };


      const updatedBill = await payBill(splitBillId, payload);

      setBills(prevBills =>
        prevBills.map(bill =>
          bill._id === splitBillId ? { ...bill, status: updatedBill.status || "Paid" } : bill
        )
      );

      setShowSplitModal(false);
      setSplitBillId(null);
      setSplitAmounts({ cash: '', online: '' });

    } catch (err) {
      console.error("Split payment failed:", err);
      alert("Payment failed. Please try again.");
    }
  };





  const openSplitModal = (billId) => {
    const billData = bills.find(b => b._id === billId);
    if (!billData) return;

    const totalBillAmount = billData.orders.reduce((sum, order) =>
      sum + order.items.reduce((osum, item) => {
        if (item.isCancelled || item.quantity === 0) return osum;
        return osum + item.Price * item.quantity;
      }, 0), 0
    );

    setSplitBillId(billId);
    setSplitAmounts({ cash: totalBillAmount.toFixed(2), online: "0.00" }); // Must be strings representing numbers!
    setShowSplitModal(true);
  };




  const handlePrint = async (billId, mode = "print") => {
    // ✅ OPEN PRINT WINDOW IMMEDIATELY to avoid Android popup blocking
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print the bill.");
      return;
    }

    // 🧠 Use loading message while fetching data
    printWindow.document.write("<p>Loading bill...</p>");
    printWindow.document.close();

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
      settings.qr = response.qr || settings.qr;

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

    const billElement = document.getElementById(`bill-${billId}`);
    if (!billElement) return;

    const clonedBill = billElement.cloneNode(true);
    clonedBill.querySelectorAll("button, .no-print, .print-hide, .order-id, .status, .total-row, small, badge")
      .forEach(el => el.remove());

    const billData = bills.find(b => b._id === billId);
    const calculateBillTotal = () => {
      if (!billData) return 0;
      return billData.orders.reduce((sum, order) =>
        sum + order.items.reduce((osum, item) => {
          if (item.isCancelled || item.quantity === 0) return osum;
          return osum + item.Price * item.quantity;
        }, 0), 0
      );
    };

    const totalAmount = calculateBillTotal();

    // ✅ Print HTML content
    const contentHTML = `
    <div style="width: 80mm; max-width: 100%; margin: auto; font-family: Arial; font-size: 12px; color: #222; border: 1px solid #ddd; padding: 15px;">
      <div style="text-align: center; margin-bottom: 10px;">
        ${settings.logo ? `<img src="${settings.logo}" alt="Logo" style="width: 70px; height: auto; margin-bottom: 8px;">` : ""}
        <h1 style="margin: 0; font-size: 18px;">${settings.restaurantName}</h1>
        <p style="margin: 0; font-size: 10px; color: #555;">${settings.address}</p>
        <p style="margin: 0; font-size: 10px; color: #555;">Phone: ${settings.phoneNumber}</p>
      </div>
      <hr style="border-top: 1px dashed #333;">

      <div style="margin-bottom: 10px;">
        <strong>Table: </strong> ${billData?.table?.number || "-"}<br>
        <strong>Date: </strong> ${new Date(billData?.createdAt).toLocaleDateString()}<br>
        <strong>Time: </strong> ${new Date(billData?.createdAt).toLocaleTimeString()}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #ccc;">
            <th style="text-align: left;">Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${billData?.orders.map(order => order.items.filter(item => !item.isCancelled && item.quantity > 0).map(item => `
            <tr>
              <td>${item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">₹${(item.Price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')).join('')}
        </tbody>
      </table>

      <hr style="border-top: 1px solid #333;">
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>Total</span>
        <span>₹${totalAmount.toFixed(2)}</span>
      </div>

      <hr style="border-top: 1px dashed #333;">
      <div style="text-align: center; font-size: 11px; color: #555;">
        Thank you for dining with us!<br>
        Please visit again.
      </div>
    </div>
  `;

    // ✅ Write final HTML to the opened window
    printWindow.document.open();
    printWindow.document.write(`
    <html>
      <head>
        <title>Print Bill</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              font-family: Arial, sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 4px 0;
              border-bottom: 1px solid #ccc;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          }
        </style>
      </head>
      <body>${contentHTML}</body>
    </html>
  `);
    printWindow.document.close();

    // ✅ Wait a bit before printing (helps Android render)
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Fallbacks
        printWindow.onafterprint = () => printWindow.close();

        if (printWindow.matchMedia) {
          const mediaQueryList = printWindow.matchMedia('print');
          mediaQueryList.addListener(mql => {
            if (!mql.matches) printWindow.close();
          });
        }
      }, 700); // 500-1000ms delay helps on Android
    };
  };


  const toggleExpand = (oi) => {
    setExpandedOrders((prev) => ({ ...prev, [oi]: !prev[oi] }));
  };

  const openConfirm = (billId) => {
    const billData = bills.find(b => b._id === billId);
    if (!billData) return;

    const billTotal = billData.orders.reduce((sum, order) =>
      sum + order.items.reduce((osum, item) => {
        if (item.isCancelled || item.quantity === 0) return osum;
        return osum + item.Price * item.quantity;
      }, 0), 0
    );

    setSelectedBillId(billId);
    setSelectedBillAmount(billTotal);
    setShowConfirm(true);
  };


  const confirmPay = () => {
    if (!selectedBillId || !paymentType) return;

    if (paymentType === "Cash") {
      handlePay(selectedBillId, "Cash");
    } else if (paymentType === "Online") {
      setShowScanner(true);
      setScanningBillId(selectedBillId);
    } else if (paymentType === "Split") {
      openSplitModal(selectedBillId);
    }

    // Close selection modal
    setShowConfirm(false);
    setPaymentType("");
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
                      
                        <Button
                          className="btn btn-success flex-fill"
                          onClick={() => openConfirm(bill._id)}
                        >
                          Pay
                        </Button>


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
      <Modal
        show={showSplitModal}
        onHide={() => setShowSplitModal(false)}
        centered
        size="md"
        backdrop="static"
        keyboard={false}
        contentClassName="rounded-4 shadow p-3"
      >
        <Modal.Header className="border-0">
          <Modal.Title className="fw-bold text-center w-100">
            Split Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Enter amounts to pay via Cash and Online:</p>
          <div className="mb-3">
            <label className="form-label">Cash Amount</label>
            <input
              type="number"
              className="form-control"
              value={splitAmounts.cash}
              min="0"
              step="0.01"
              onChange={(e) => {
                const val = e.target.value;
                const billData = bills.find(b => b._id === splitBillId);
                if (!billData) return;

                const totalBillAmount = billData.orders.reduce((sum, order) =>
                  sum + order.items.reduce((osum, item) => {
                    if (item.isCancelled || item.quantity === 0) return osum;
                    return osum + item.Price * item.quantity;
                  }, 0), 0
                );

                const cashVal = parseFloat(val) || 0;

                setSplitAmounts({
                  cash: val,
                  online: (totalBillAmount - cashVal).toFixed(2),
                });
              }}
            />




          </div>
          <div className="mb-3">
            <label className="form-label">Online Amount</label>
            <input
              type="number"
              className="form-control"
              value={splitAmounts.online}
              min="0"
              step="0.01"
              onChange={(e) => {
                const val = e.target.value;
                const billData = bills.find(b => b._id === splitBillId);
                if (!billData) return;

                const totalBillAmount = billData.orders.reduce((sum, order) =>
                  sum + order.items.reduce((osum, item) => {
                    if (item.isCancelled || item.quantity === 0) return osum;
                    return osum + item.Price * item.quantity;
                  }, 0), 0
                );

                const onlineVal = parseFloat(val) || 0;

                setSplitAmounts({
                  online: val,
                  cash: (totalBillAmount - onlineVal).toFixed(2),
                });
              }}
            />


          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center border-0">
          <Button variant="outline-secondary" className="px-4 rounded-pill" onClick={() => setShowSplitModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" className="px-4 rounded-pill" onClick={handleSplitPayment}>
            Pay
          </Button>
        </Modal.Footer>
      </Modal>
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
            Select Payment Method
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="fw-semibold mb-4">
            Bill Total: ₹{selectedBillAmount?.toFixed(2)}
          </p>

          <div className="d-grid gap-2 mb-3">
            <Button
              variant={paymentType === "Cash" ? "success" : "outline-success"}
              onClick={() => setPaymentType("Cash")}
            >
              Cash
            </Button>
            <Button
              variant={paymentType === "Online" ? "primary" : "outline-primary"}
              onClick={() => setPaymentType("Online")}
            >
              Online
            </Button>
            <Button
              variant={paymentType === "Split" ? "warning" : "outline-warning"}
              onClick={() => setPaymentType("Split")}
            >
              Half Pay (Split)
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center border-0">
          <Button
            variant="outline-secondary"
            className="px-4 rounded-pill"
            onClick={() => {
              setShowConfirm(false);
              setPaymentType("");
              setSelectedBillId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="px-4 rounded-pill"
            onClick={confirmPay}
            disabled={!paymentType}
          >
            Pay ₹{selectedBillAmount?.toFixed(2)}
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
